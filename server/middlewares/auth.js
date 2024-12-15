import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
    let token = req.headers.authorization;

    if (token && token.startsWith("Bearer")) {
        try {
        token = token.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
        } catch (error) {
        res.status(401).json({ message: "Unauthorized, token failed" });
        }
    } else {
        res.status(401).json({ message: "Unauthorized, no token" });
    }
};

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(403).json({ message: "Invalid or expired token" });
        }
    } else {
        return res.status(401).json({ message: "No token provided" });
    }
};
