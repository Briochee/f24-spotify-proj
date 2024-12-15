import express from 'express';
import { verifyToken } from "../middlewares/auth.js";

// backend functions from primary.js
import { 
    registerUser, 
    loginUser,
} from "../controllers/primary.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

export default router;