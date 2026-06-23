import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

export default function (prisma: PrismaClient) {
  const router = Router();

  router.get('/', async (req, res) => {
    const cities = await prisma.city.findMany();
    res.json(cities);
  });

  return router;
}