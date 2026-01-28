import express from 'express';
import passport from 'passport';
import { generateOAuthToken } from '../services/oauthService.js';
import { CONFIG } from '../config/constants.js';
import { authenticateToken } from '../middleware/auth.js';
import { guestLogin, register, login, me } from '../controllers/authController.js';

const router = express.Router();

// Helper to handle OAuth success
const handleOAuthSuccess = (req, res) => {
  const token = generateOAuthToken(req.user);
  const user = JSON.stringify({
    id: req.user.id,
    userName: req.user.userName,
    email: req.user.email,
  });

  // Set temporary cookie for token transfer (1 min expiry)
  // This is more secure than putting it in the URL
  res.cookie('auth_token_transfer', token, {
    httpOnly: false, // Start false so clientJS can read it, then move to localStorage/httpOnly cookie
    secure: CONFIG.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 1000 // 1 minute
  });

  // Also pass user data in cookie to avoid URL clutter
  res.cookie('auth_user_transfer', encodeURIComponent(user), {
    httpOnly: false,
    secure: CONFIG.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 1000
  });

  // Redirect to frontend
  res.redirect(`${CONFIG.CLIENT_URL}?auth_status=success`);
};

// ✅ Existing routes
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
  passport.authenticate("google", { session: false, failureRedirect: `${CONFIG.CLIENT_URL}?auth_status=failed` }),
  handleOAuthSuccess
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
  passport.authenticate("github", { session: false, failureRedirect: `${CONFIG.CLIENT_URL}?auth_status=failed` }),
  handleOAuthSuccess
);

export default router;
