import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const spotifyCallback = async (req, res) => {
    const { code } = req.body; // Authorization code from Spotify
    const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
    const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

    try {
        const tokenResponse = await axios.post(
            "https://accounts.spotify.com/api/token",
            new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: REDIRECT_URI,
                client_id: SPOTIFY_CLIENT_ID,
                client_secret: SPOTIFY_CLIENT_SECRET,
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        // Save tokens to your database for the logged-in user
        const { access_token, refresh_token, expires_in } = tokenResponse.data;
        res.json({ access_token, refresh_token, expires_in });
    } catch (error) {
        console.error("Error exchanging authorization code:", error.response.data);
        res.status(500).json({ message: "Failed to connect to Spotify" });
    }
};