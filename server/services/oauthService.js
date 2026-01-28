import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

// Helper to find or create user
async function findOrCreateUser(profile, authType) {
  const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;
  const userName = profile.displayName || profile.username || email.split('@')[0];

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        userName,
        email,
        authType,
        isGuest: false,
        lastSeen: new Date(),
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { lastSeen: new Date() },
    });
  }
  return user;
}

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateUser(profile, 'google');
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

// GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateUser(profile, 'github');
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

export function generateOAuthToken(user) {
  return jwt.sign(
    {
      id: user.id,
      userId: user.userId,
      userName: user.userName,
      email: user.email,
      isGuest: false,
      role: user.role || 'user',
      authType: user.authType,
    },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

export default passport;
