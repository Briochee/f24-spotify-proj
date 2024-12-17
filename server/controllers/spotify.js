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
        console.error(error);
        res.send('Failed to authenticate.');
    }
};

