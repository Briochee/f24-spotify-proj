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
        token: { type: String, default: null },
        obtainedAt: { type: Date, default: null },
    },
    spotifyRefreshToken: {
        type: String, default: null 
    },
    quizHistory: {
        quizzesTaken: { type: Number, default: 0},
        questionsAnswered: { type: Number, default: 0},
        lifetimeScore: { type: Number, default: 0},
        correctAnswers: { type: Number, default: 0},
        incorrectAnswers: { type: Number, default: 0},
    }
});

const User = mongoose.model("User", userSchema);

export default User;