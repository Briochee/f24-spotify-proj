import express from 'express';
import { protect, verifyToken } from "../middlewares/auth.js";

// backend functions from primary.js
import { 
    login,
    callback,
    validateUsername,
    verifyConnection,
    updateUserInfo,
    disconnectSpotify,
} from "../controllers/spotify.js";

const router = express.Router();

router.get("/login", verifyToken, login);
router.get("/validate-username", verifyToken, validateUsername);
router.post("/update-info", verifyToken, updateUserInfo);
router.post("/disconnect", verifyToken, disconnectSpotify);

router.get("/callback", callback);
router.get("/verify-connection", protect, verifyConnection);


export default router;