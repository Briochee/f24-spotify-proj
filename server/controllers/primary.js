import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import axios from 'axios';

// Register a user
export const registerUser = async (req, res) => {
    try {
        // console.log("Request body:", req.body);

        const { email, password, firstName, lastName } = req.body;

        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = await User.create({ email, password, firstName, lastName });

        // Generate a token for the new user
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(201).json({
            message: "User registered successfully",
            token,
        });
    } catch (error) {
        console.error("Error in registerUser:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Login a user
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        if (user.password !== password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ message: "Login successful", token });
    } catch (error) {
        console.error("Error during login:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const validateUsername = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findOne({ email });
        // revalidate Spotify username here if needed
        if (user.spotifyConnected) {
            try {
                const profileResponse = await axios.get("https://api.spotify.com/v1/me", {
                    headers: {
                        Authorization: `Bearer ${user.spotifyAccessToken}`, // Use stored access token
                    },
                });

                const spotifyUsername = profileResponse.data.display_name;
                if (user.spotifyUsername !== spotifyUsername) {
                    user.spotifyUsername = spotifyUsername;
                    await user.save();
                }
            } catch (spotifyError) {
                console.error("Failed to validate Spotify username:", spotifyError.message);
            }
        }
    } catch (error) {
        console.error("Could not validate Spotify username: ", error);
    }
};

// Check if a user is connected to Spotify
export const isSpotifyConnected = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find the user in the database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Return the Spotify connection status
        res.json({ connected: user.spotifyConnected });
    } catch (error) {
        console.error("Error checking Spotify connection:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Set connection status on user profile
export const setStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { connection } = req.body;

        // Find the user in the database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.spotifyConnected = connection;
        await user.save();

    } catch (error) {
        console.error("Error checking Spotify connection:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};