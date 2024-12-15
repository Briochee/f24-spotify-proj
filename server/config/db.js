import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGO_URI;

let isConnected = false; // Track the connection status

export async function connectDB() {
    if (isConnected) {
        console.log("Using existing MongoDB connection");
        return mongoose.connection.db;
    }

    try {
        const connection = await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        isConnected = true;
        console.log(`Connected to MongoDB: ${connection.connection.name}`);

        // console.log("Running custom database initialization script...");
        // await initializeDatabase();
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        throw error;
    }
}

export async function closeDB() {
    try {
        await mongoose.connection.close();
        isConnected = false;
        console.log("MongoDB connection closed");
    } catch (error) {
        console.error("Failed to close MongoDB connection:", error);
        throw error;
    }
}

// Initialize the database
// async function initializeDatabase() {
//     const collections = await mongoose.connection.db.listCollections().toArray();
//     console.log("Existing collections:", collections);
// }

// Export connectDB as the default export
export default connectDB;