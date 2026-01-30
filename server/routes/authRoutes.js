import express from 'express';
import passport from 'passport';
import { generateOAuthToken } from '../services/oauthService.js';
import { CONFIG } from '../config/constants.js';
import { authenticateToken } from '../middleware/auth.js';
import { guestLogin, register, login, me, exchangeTicket, createAuthTicket } from '../controllers/authController.js';

const router = express.Router();

// Helper to handle OAuth success
const handleOAuthSuccess = (req, res) => {
  const token = generateOAuthToken(req.user);
  const user = JSON.stringify({
    id: req.user.id,
    userName: req.user.userName,
    email: req.user.email,
  });

  // ✅ Secure Ticket Exchange Flow
  // 1. Create a short-lived ticket (stored in Redis)
  // 2. Redirect to frontend with ?ticket=UUID
  // 3. Frontend exchanges ticket for token via POST request

  createAuthTicket(token, user)
    .then(ticket => {
      const redirectUrl = `${CONFIG.CLIENT_URL}?ticket=${ticket}`;
      res.redirect(redirectUrl);
    })
    .catch(err => {
      console.error('Failed to create auth ticket:', err);
      res.redirect(`${CONFIG.CLIENT_URL}?auth_status=failed`);
    });
};

// ✅ Existing routes
router.post("/guest", guestLogin);
router.post("/register", register);
router.post("/login", login);
router.post("/exchange", exchangeTicket); // New route for ticket exchange
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
