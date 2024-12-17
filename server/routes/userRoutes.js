import express from 'express';
import { verifyToken } from "../middlewares/auth.js";

// backend functions from primary.js
import { 
    registerUser, 
    loginUser,
    isSpotifyConnected,
    validateUsername,
    setStatus,
    deleteUserAccount,
} from "../controllers/primary.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/check-connection", verifyToken, isSpotifyConnected);
router.get("/validate-username", verifyToken, validateUsername);
router.post("/set-status", verifyToken, setStatus);
router.delete("/delete-account", verifyToken, deleteUserAccount);

export default router;