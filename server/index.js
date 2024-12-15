import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import connectDB, { closeDB } from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import spotifyRoutes from "./routes/spotifyRoutes.js";

dotenv.config();

const app = express();

// Enable CORS to allow cross-origin requests
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);

// Middleware for parsing JSON
app.use(express.json());

// Initialize the database connection
let db;
(async () => {
    try {
        db = await connectDB();
    } catch (error) {
        process.exit(1);
    }
})();

// Routes
app.get("/", (req, res) => {
    res.send("API is running...");
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/spotify", spotifyRoutes);

const PORT = process.env.PORT || 5000;

// Start the server
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Shut down the database connection gracefully
const gracefulShutdown = async (signal) => {
    console.log(`Received ${signal}. Closing the app gracefully...`);
    try {
        await closeDB();
        console.log("Closed MongoDB connection.");
    } catch (error) {
        console.error("Error closing MongoDB connection:", error);
    } finally {
        server.close(() => {
        console.log("Server closed.");
        process.exit(0);
        });
    }
};

// Listen for termination signals
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    gracefulShutdown("Uncaught Exception");
});