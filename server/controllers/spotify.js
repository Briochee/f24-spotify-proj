import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import axios from "axios";
import User from "../models/user.js";

export const spotifyCallback = async (req, res) => {
    const { code } = req.body;

    // console.log("Backend Received Authorization Code:", code);

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

        const { access_token, refresh_token } = tokenResponse.data;

        const profileResponse = await axios.get("https://api.spotify.com/v1/me", {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const spotifyUsername = profileResponse.data.display_name;

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized. User not authenticated" });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.spotifyConnected = true;
        user.spotifyAccessToken = access_token;
        user.spotifyRefreshToken = refresh_token;

        if (user.spotifyUsername !== spotifyUsername) {
            user.spotifyUsername = spotifyUsername;
        }

        await user.save();

        res.json({ access_token, refresh_token });
    } catch (error) {
        if (error.response?.data?.error === "invalid_grant") {
            console.error("Invalid authorization code or token already used");
            return res.status(400).json({ message: "Invalid authorization code or token already used" });
        }

        console.error("Failed to connect to Spotify:", error.message);

        // Disconnect user in case of any critical failure
        const user = await User.findById(req.user.id);
        if (user) {
            user.spotifyConnected = false;
            user.spotifyAccessToken = null;
            user.spotifyRefreshToken = null;
            await user.save();
        }

        res.status(500).json({ message: "Failed to connect to Spotify", error: error.response?.data || error.message });
    }
};

export const checkSpotifyConnection = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user || !user.spotifyConnected) {
            return res.json({ connected: false });
        }

        try {
            // Validate Spotify access token
            await axios.get("https://api.spotify.com/v1/me", {
                headers: {
                    Authorization: `Bearer ${user.spotifyAccessToken}`,
                },
            });

            return res.json({ connected: true });
        } catch (error) {
            if (error.response?.status === 401) {
                console.log("Spotify token invalid or expired. Attempting to refresh token...");

                // Attempt to refresh the Spotify token
                const refreshed = await refreshSpotifyToken(user);

                if (refreshed) {
                    // Retry connection check with refreshed token
                    return await checkSpotifyConnection(req, res);
                } else {
                    console.log("Failed to refresh Spotify token. Disconnecting user...");
                    user.spotifyConnected = false;
                    user.spotifyAccessToken = null;
                    user.spotifyRefreshToken = null;
                    await user.save();
                    return res.json({ connected: false });
                }
            }

            console.error("Error validating Spotify connection:", error.message);
            return res.status(500).json({ message: "Error validating Spotify connection", error: error.message });
        }
    } catch (error) {
        console.error("Error checking Spotify connection:", error.message);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const refreshSpotifyToken = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.spotifyRefreshToken) {
            return res.status(400).json({ message: "User not found or no refresh token available" });
        }

        const tokenResponse = await axios.post("https://accounts.spotify.com/api/token",
            new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: user.spotifyRefreshToken,
                client_id: process.env.SPOTIFY_CLIENT_ID,
                client_secret: process.env.SPOTIFY_CLIENT_SECRET,
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        user.spotifyAccessToken = tokenResponse.data.access_token;
        await user.save();

        console.log("Spotify token refreshed successfully.");
        return res.json({ message: "Spotify token refreshed successfully", access_token: tokenResponse.data.access_token });
    } catch (error) {
        console.error("Failed to refresh Spotify token:", error.message);

        // Disconnect the user from Spotify
        const user = await User.findById(req.user.id);
        if (user) {
            user.spotifyConnected = false;
            user.spotifyAccessToken = null;
            user.spotifyRefreshToken = null;
            await user.save();
        }

        return res.status(500).json({ message: "Failed to refresh Spotify token", error: error.message });
    }
};