import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

export const adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
};

export const authMiddleware = (req, res, next) => {
    let token = req.header("Authorization");
    token = token && token.startsWith("Bearer") ? token.split(" ")[1] : null;

    if (!token)
        return res
            .status(401)
            .json({ message: "Access denied. No token provided." });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            console.error("Token verification error:", error);
            return res.status(401).json({ message: "Token has expired. Please log in again." });
        }
        console.error("Token verification error:", error);
        res.status(400).json({ message: "Invalid token" });
    }
};
