import express from 'express';
import { verifyToken } from "../middlewares/auth.js";

// backend functions from primary.js
import { 
    login,
    callback,
} from "../controllers/spotify.js";

const router = express.Router();

router.get("/login", verifyToken, login);

router.get("/callback", callback);


export default router;