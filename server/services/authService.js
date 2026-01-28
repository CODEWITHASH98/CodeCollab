import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-in-prod";

class AuthService {
  async guestLogin(userName) {
    if (!userName || userName.trim().length === 0) {
      throw new Error("Username is required");
    }

    // Guest session expires in 7 days
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    // Create guest user in DB
    const user = await prisma.user.create({
      data: {
        userName: userName.trim(),
        authType: "guest",
        isGuest: true,
        guestSessionExpiry: expiryDate,
        lastSeen: new Date(),
      },
    });

    // Generate JWT with user.id (primary key)
    const token = jwt.sign(
      { 
        userId: user.id, // Use primary key for relations
        userName: user.userName, 
        authType: user.authType 
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return {
      token,
      user: {
        id: user.id,
        userName: user.userName,
        authType: user.authType,
        isGuest: user.isGuest,
      },
    };
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      throw new Error("Invalid or expired token");
    }
  }

  async updateLastSeen(userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { lastSeen: new Date() },
    });
  }
}

export const authService = new AuthService();
