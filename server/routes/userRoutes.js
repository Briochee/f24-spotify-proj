import express from 'express';
import { protect, verifyToken } from "../middlewares/auth.js";

// backend functions from primary.js
import { 
    registerUser, 
    loginUser,
    isSpotifyConnected,
    setStatus,
    deleteUserAccount,
} from "../controllers/primary.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/check-connection", verifyToken, isSpotifyConnected);
router.post("/set-status", verifyToken, setStatus);
router.delete("/delete-account", protect, deleteUserAccount);

export default router;