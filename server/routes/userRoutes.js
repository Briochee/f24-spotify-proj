import express from 'express';
import { protect, verifyToken } from "../middlewares/auth.js";

// backend functions from primary.js
import { 
    registerUser, 
    loginUser,
    isSpotifyConnected,
    setStatus,
    deleteUserAccount,
    updateQuizHistory,
    getQuizHistory,
    getUserInfo,
} from "../controllers/primary.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/user-info", protect, getUserInfo);
router.get("/check-connection", protect, isSpotifyConnected);
router.post("/set-status", protect, setStatus);
router.put("/quiz-history", protect, updateQuizHistory)
router.get("/quiz-history", protect, getQuizHistory);
router.delete("/delete-account", protect, deleteUserAccount);

export default router;