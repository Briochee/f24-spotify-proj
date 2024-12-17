import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import axios from "axios";
import User from "../models/user.js";



export const spotifyCallback = async (req, res) => {
    const { code } = req.body;

    // console.log("Authorization Code Received:", code);

    try {
        if (!code) {
            return res.status(400).json({ message: "Authorization code is required" });
        }

        const tokenResponse = await axios.post(
            "https://accounts.spotify.com/api/token",
            new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
                client_id: process.env.SPOTIFY_CLIENT_ID,
                client_secret: process.env.SPOTIFY_CLIENT_SECRET,
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );
        // console.log("Token Response:", tokenResponse.data);

        const { access_token, refresh_token } = tokenResponse.data;

        await updateUserSpotifyData(access_token, refresh_token, req.user.id);

        res.json({ access_token, refresh_token });
    } catch (error) {
        if (error.response?.data?.error === "invalid_grant") {
            console.error("Invalid authorization code or token already used");
            return res.status(400).json({ message: "Authorization code invalid or reused. Please re-authenticate." });
        }

        console.error("Failed to connect to Spotify:", error.message);

        // Disconnect user in case of critical failure
        const user = await User.findById(req.user.id);
        if (user) {
            await disconnectSpotifyHelper(user);
        }

        res.status(500).json({ message: "Failed to connect to Spotify", error: error.response?.data || error.message });
    }
};

export const updateUserSpotifyData = async (accessToken, refreshToken, userId) => {
    try {
        console.log("Access Token:", accessToken);
        const profileResponse = await axios.get("https://api.spotify.com/v1/me", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        console.log("Profile Response:", profileResponse.data); // Debug profile response
        const spotifyUsername = profileResponse.data.display_name;

        const user = await User.findById(userId);
        if (!user) {
            throw new Error("User not found during Spotify callback");
        }

        user.spotifyConnected = true;
        user.spotifyAccessToken = { token: accessToken, obtainedAt: new Date() };
        user.spotifyRefreshToken = refreshToken;

        if (user.spotifyUsername !== spotifyUsername) {
            user.spotifyUsername = spotifyUsername;
        }

        await user.save();
    } catch (error) {
        console.error("Error updating Spotify data for user:", error.message);
        throw error;
    }
};

export const checkSpotifyConnection = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user || !user.spotifyConnected || !user.spotifyAccessToken.token) {
            console.log("No valid Spotify connection found for user.");
            return res.json({ connected: false });
        }

        const tokenAge = Date.now() - new Date(user.spotifyAccessToken.obtainedAt).getTime();
        const ONE_HOUR = 3600000; // 1 hour

        // Refresh token if it has expired
        if (tokenAge >= ONE_HOUR) {
            console.log("Spotify token expired. Attempting to refresh...");
            const refreshed = await refreshSpotifyToken(user);

            if (!refreshed) {
                console.log("Failed to refresh Spotify token. Disconnecting user...");
                user.spotifyConnected = false;
                user.spotifyAccessToken = { token: null, obtainedAt: null };
                user.spotifyRefreshToken = null;
                await user.save();
                return res.json({ connected: false });
            }
        }

        // Validate Spotify access token
        try {
            await axios.get("https://api.spotify.com/v1/me", {
                headers: {
                    Authorization: `Bearer ${user.spotifyAccessToken.token}`,
                },
            });

            console.log("Spotify access token is valid.");
            return res.json({
                connected: true,
                accessToken: user.spotifyAccessToken.token,
                refreshToken: user.spotifyRefreshToken,
            });
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log("Error validating spotify access token: ", error);
            }
        }
    } catch (error) {
        console.error("Error checking Spotify connection:", error.message);
        return res.status(500).json({ connected: false, message: "Server error", error: error.message });
    }
};

export const refreshSpotifyToken = async (user) => {
    try {
        if (!user || !user.spotifyRefreshToken) {
            console.error("No user or refresh token found for refreshing Spotify token.");
            return false;
        }

        console.log("Refreshing Spotify token...");
        const tokenResponse = await axios.post(
            "https://accounts.spotify.com/api/token",
            new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: user.spotifyRefreshToken,
                client_id: process.env.SPOTIFY_CLIENT_ID,
                client_secret: process.env.SPOTIFY_CLIENT_SECRET,
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        user.spotifyAccessToken = {
            token: tokenResponse.data.access_token,
            obtainedAt: new Date(),
        };
        await user.save();

        console.log("Spotify token refreshed successfully.");
        return true;
    } catch (error) {
        console.error("Failed to refresh Spotify token:", error.message);
        return false;
    }
};

export const disconnectSpotify = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        } else {
            console.log("User found, disconnecting spotify");
        }

        user.spotifyConnected = false;
        user.spotifyAccessToken = { token: null, obtainedAt: null };
        user.spotifyRefreshToken = null;
        user.spotifyUsername = null;
        await user.save();

        console.log("User successfully disconnected from Spotify.");
        return res.json({ message: "Spotify account disconnected successfully" });
    } catch (error) {
        console.error("Failed to disconnect Spotify:", error.message);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

const disconnectSpotifyHelper = async (user) => {
    if (!user) {
        throw new Error("User not found");
    }

    user.spotifyConnected = false;
    user.spotifyAccessToken = { token: null, obtainedAt: null };
    user.spotifyRefreshToken = null;
    user.spotifyUsername = null;

    await user.save();
    console.log("User successfully disconnected from Spotify.");
};