import express from 'express';
import { verifyToken } from "../middlewares/auth.js";

// backend functions from primary.js
import { 
    spotifyCallback,
    checkSpotifyConnection,
    refreshSpotifyToken,
} from "../controllers/spotify.js";

const router = express.Router();

router.post("/spotify-callback", verifyToken, spotifyCallback);
router.get("/connection-status", verifyToken, checkSpotifyConnection);
router.post("/refresh-spotify-token", verifyToken, refreshSpotifyToken);

export default router;