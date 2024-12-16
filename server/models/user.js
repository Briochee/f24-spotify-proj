import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: { 
        type: String, required: true, unique: true 
    },
    password: { 
        type: String, required: true 
    },
    firstName: { 
        type: String, required: true 
    },
    lastName: { 
        type: String, required: true 
    },
    spotifyConnected: { 
        type: Boolean, default: false 
    },
    spotifyUsername: { 
        type: String, default: null 
    },
    spotifyAccessToken: {
        type: String, default: null 
    },
    spotifyRefreshToken: {
        type: String, default: null 
    },
});

const User = mongoose.model("User", userSchema);

export default User;