import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default function (prisma: PrismaClient) {
  const router = Router();
  const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-prod';

  router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Имя и пароль обязательны' });
    const hash = await bcrypt.hash(password, 10);
    try {
      const user = await prisma.user.create({ data: { username, password: hash } });
      res.json({ id: user.id, username: user.username });
    } catch {
      res.status(400).json({ error: 'Имя занято' });
    }
  });

  router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Неверные данные' });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, userId: user.id, username: user.username });
  });

  return router;
}