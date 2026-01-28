import prisma from '../config/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateUserId } from '../utils/helpers.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
const GUEST_TOKEN_EXPIRY = process.env.GUEST_TOKEN_EXPIRY || '2h';

export async function guestLogin(req, res) {
  const { userName } = req.body;

  if (!userName || userName.trim().length < 2) {
    return res.status(400).json({ success: false, error: 'Username must be at least 2 characters' });
  }

  const expiryDate = new Date(Date.now() + 2 * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      userId: generateUserId(),
      userName: userName.trim(),
      isGuest: true,
      role: 'guest',
      guestSessionExpiry: expiryDate,
    },
  });

  const token = jwt.sign(
    { id: user.id, userId: user.userId, userName: user.userName, isGuest: true, role: 'guest' },
    JWT_SECRET,
    { expiresIn: GUEST_TOKEN_EXPIRY }
  );

  return res.json({
    success: true,
    data: { token, user: { id: user.id, userId: user.userId, userName: user.userName, isGuest: true, role: 'guest', expiresAt: expiryDate } },
  });
}

export async function register(req, res) {
  const { userName, email, password } = req.body;

  if (!userName || !email || !password) {
    return res.status(400).json({ success: false, error: 'userName, email, password are required' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ success: false, error: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      userId: generateUserId(),
      userName,
      email,
      passwordHash,
      isGuest: false,
      authProvider: 'email',
      role: 'user',
    },
  });

  const token = jwt.sign(
    { id: user.id, userId: user.userId, userName: user.userName, email: user.email, isGuest: false, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  return res.status(201).json({ success: true, data: { token, user: { id: user.id, userId: user.userId, userName, email, isGuest: false, role: user.role } } });
}

export async function login(req, res) {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.isGuest || !user.passwordHash) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ success: false, error: 'Invalid email or password' });

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const token = jwt.sign(
    { id: user.id, userId: user.userId, userName: user.userName, email: user.email, isGuest: false, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  return res.json({ success: true, data: { token, user: { id: user.id, userId: user.userId, userName: user.userName, email, isGuest: false, role: user.role } } });
}

export async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { userId: true, userName: true, email: true, isGuest: true, role: true, guestSessionExpiry: true, createdAt: true },
  });

  if (!user) return res.status(404).json({ success: false, error: 'User not found' });

  if (user.isGuest && user.guestSessionExpiry && user.guestSessionExpiry < new Date()) {
    return res.status(401).json({ success: false, error: 'Guest session expired', expired: true });
  }

  return res.json({ success: true, data: { user } });
}
