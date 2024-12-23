import querystring from "querystring";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import axios from "axios";
import User from "../models/user.js";

export const login = async (req, res) => {
    try {
        const scope = "user-read-private user-read-email playlist-read-private streaming";

        const spotifyAuthUrl = "https://accounts.spotify.com/authorize?" +
            querystring.stringify({
                response_type: "code",
                client_id: process.env.SPOTIFY_CLIENT_ID,
                scope: scope,
                redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
            });

        // Redirect user to Spotify's authorization page
        res.json({ authUrl: spotifyAuthUrl });
    } catch (error) {
        console.error("Error initiating Spotify OAuth flow:", error.message);
        res.status(500).json({
            message: "Failed to initiate Spotify OAuth flow",
            error: error.message,
        });
    }
};

export const callback = async (req, res) => {
    const code = req.query.code || null;
    // console.log("CALLBACK, REDIRECT URI: ", process.env.SPOTIFY_REDIRECT_URI);

    try {
        const response = await axios.post('https://accounts.spotify.com/api/token',
        querystring.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
        }),
        {
            headers: {
            Authorization:
                'Basic ' +
                Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
            },
        }
        );

        const { access_token, refresh_token } = response.data;
        
        res.redirect(`${process.env.FRONTEND_URL}/homepage?` +
            querystring.stringify({
            access_token,
            refresh_token,
            })
        );
    } catch (error) {
        // console.error(error);
        res.send('Failed to authenticate.');
    }
};

export const validateUsername = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user || !user.spotifyConnected) {
            return res.status(400).json({ message: "Spotify not connected." });
        }

        // Fetch the latest Spotify username
        const profileResponse = await axios.get("https://api.spotify.com/v1/me", {
            headers: { Authorization: `Bearer ${user.spotifyAccessToken.token}` },
        });

        const spotifyUsername = profileResponse.data.display_name;
        if (user.spotifyUsername !== spotifyUsername) {
            user.spotifyUsername = spotifyUsername;
            await user.save();
            console.log("Spotify username updated.");
        }

        res.json({ message: "Spotify username validated successfully." });
    } catch (error) {
        console.error("Failed to validate Spotify username:", error.message);
        res.status(500).json({ message: "Failed to validate Spotify username." });
    }
};

// Verify connection to spotify
export const verifyConnection = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.spotifyConnected) {
            return res.status(401).json({ connected: false, message: "Spotify not connected." });
        }

        const { token, obtainedAt } = user.spotifyAccessToken;

        // Check if the access token is older than 1 hour
        // Get current local time (edge case because I am in a different country, crazy)
        const currentUTC = new Date();
        const localOffset = currentUTC.getTimezoneOffset() * 60 * 1000;
        const currentLocalTime = new Date(currentUTC.getTime() - localOffset);

        const oneHourAgo = new Date(currentLocalTime.getTime() - 3600 * 1000);
        // console.log("Current local time: ", currentLocalTime, "\nOne hr ago: ", oneHourAgo);
        // console.log("Obtain time: ", obtainedAt, "\nOne hr ago: ", oneHourAgo);

        if (obtainedAt && new Date(obtainedAt).getTime() < oneHourAgo.getTime()) {
            console.log("Access token expired. Refreshing...");

            // Refresh the access token
            let refreshedToken;
            try {
                refreshedToken = await refreshAccessToken(user);
                await axios.get("https://api.spotify.com/v1/me", {
                    headers: { Authorization: `Bearer ${refreshedToken}` },
                });
            } catch (refreshError) {
                console.error("Token refresh failed:", refreshError.message);
                return res.status(401).json({ connected: false, message: "Token refresh failed." });
            }
            return res.json({
                connected: true,
                refreshed: true,
                message: "Spotify connection verified, tokens refreshed.",
            });
        }

        // Test current access token validity
        await axios.get("https://api.spotify.com/v1/me", {
            headers: { Authorization: `Bearer ${token}` },
        });

        res.json({
            connected: true,
            refreshed: false,
            message: "Spotify connection verified.",
        });
    } catch (error) {
        console.error("Spotify connection verification failed:", error.message);
        res.status(401).json({ connected: false, message: "Spotify connection invalid." });
    }
};

// Update user schema
export const updateUserInfo = async (req, res) => {
    try {
        const { accessToken, refreshToken } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const currentUTC = new Date();
        const localOffset = currentUTC.getTimezoneOffset() * 60 * 1000;
        const currentLocalTime = new Date(currentUTC.getTime() - localOffset);

        // Update user fields
        user.spotifyConnected = true;
        user.spotifyAccessToken = { token: accessToken, obtainedAt: currentLocalTime };
        user.spotifyRefreshToken = refreshToken;

        await user.save();

        res.json({ message: "User Spotify info updated successfully" });
    } catch (error) {
        console.error("Error updating user info:", error.message);
        res.status(500).json({ message: "Failed to update user info" });
    }
};

// Disconnect the user from Spotify
export const disconnectSpotify = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find the user and update the relevant fields
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.spotifyConnected = false;
        user.spotifyAccessToken = { token: null, obtainedAt: null };
        user.spotifyRefreshToken = null;
        user.spotifyUsername = null;

        await user.save();

        res.json({ message: "Spotify account disconnected successfully" });
    } catch (error) {
        console.error("Error disconnecting Spotify account:", error.message);
        res.status(500).json({ message: "Failed to disconnect Spotify account" });
    }
};

// Refresh tokens if tokens expire
const refreshAccessToken = async (user) => {
    try {
        const response = await axios.post(
            "https://accounts.spotify.com/api/token",
            querystring.stringify({
                grant_type: "refresh_token",
                refresh_token: user.spotifyRefreshToken,
            }),
            {
                headers: {
                    Authorization:
                        "Basic " +
                        Buffer.from(
                            process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
                        ).toString("base64"),
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        const { access_token } = response.data;

        const currentUTC = new Date();
        const localOffset = currentUTC.getTimezoneOffset() * 60 * 1000;
        const currentLocalTime = new Date(currentUTC.getTime() - localOffset);

        // Update user's access token and obtained time
        user.spotifyAccessToken = { token: access_token, obtainedAt: currentLocalTime };
        await user.save();

        console.log("Access token refreshed successfully.");
        return access_token;
    } catch (error) {
        console.error("Failed to refresh access token:", error.message);
        user.spotifyConnected = false;
        await user.save();
        throw new Error("Failed to refresh access token.");
    }
};