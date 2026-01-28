import express from "express";
import { guestLogin, register, login, me } from "../controllers/authController.js";
import passport from "../services/oauthService.js";
import { generateOAuthToken } from "../services/oauthService.js";

import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// ✅ Existing routes (your original functions)
router.post("/guest", guestLogin);
router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticateToken, me);

// ✅ Google OAuth
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  (req, res) => {
    const token = generateOAuthToken(req.user);
    const user = {
      id: req.user.id,
      userName: req.user.userName,
      email: req.user.email,
    };

    res.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:5173"}?token=${token}&user=${encodeURIComponent(
        JSON.stringify(user)
      )}`
    );
  }
);

// ✅ GitHub OAuth
router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
    session: false,
  })
);

router.get(
  "/github/callback",
  passport.authenticate("github", { session: false, failureRedirect: "/" }),
  (req, res) => {
    const token = generateOAuthToken(req.user);
    const user = {
      id: req.user.id,
      userName: req.user.userName,
      email: req.user.email,
    };

    res.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:5173"}?token=${token}&user=${encodeURIComponent(
        JSON.stringify(user)
      )}`
    );
  }
);

export default router;
