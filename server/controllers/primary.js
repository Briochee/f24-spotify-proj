import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

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
        res.status(201).json({
            message: "User registered successfully",
            userId: user._id,
        });
    } catch (error) {
        console.error("Error in registerUser:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Login a user
export const loginUser = async (req, res) => {
    try {
        if (!mongoose.connection.readyState) {
            throw new Error("No MongoDB connection");
        }

        const { email, password } = req.body;

        // Check if all required fields are provided
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Check the password
        if (user.password !== password) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate a JWT token (add your JWT logic here)
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ message: "Login successful", token });
    } catch (error) {
        console.error("Database operation failed:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};