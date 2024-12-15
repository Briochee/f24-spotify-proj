import express from 'express';
import { verifyToken } from "../middlewares/auth.js";

// backend functions from primary.js
import { 
    spotifyCallback,
} from "../controllers/spotify.js";

const router = express.Router();

router.post("/spotify-callback", verifyToken, spotifyCallback);

export default router;