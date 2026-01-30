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

  // Pass token and user data via URL query parameters
  // This is required because cookies cannot be shared across different domains (Render -> Vercel)
  const redirectUrl = `${CONFIG.CLIENT_URL}?auth_status=success&token=${encodeURIComponent(token)}&user=${encodeURIComponent(user)}`;

  // Still set cookies as a fallback for same-domain scenarios or if we add a custom domain later
  res.cookie('auth_token_transfer', token, {
    httpOnly: false,
    secure: CONFIG.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 1000 // 1 minute
  });

  res.redirect(redirectUrl);
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
