import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export default function (prisma: PrismaClient) {
  const router = Router();
  router.use(authMiddleware);

  // Получить все ресурсы (справочник)
  router.get('/', async (req: AuthRequest, res) => {
    const resources = await prisma.resource.findMany();
    res.json(resources);
  });

  // Получить цены текущего пользователя для всех городов
  router.get('/prices', async (req: AuthRequest, res) => {
    const prices = await prisma.resourcePrice.findMany({
      where: { userId: req.userId },
      include: { resource: true, city: true },
    });
    // Преобразуем в удобный объект: { [cityId]: { [resourceName]: price } }
    const result: any = {};
    prices.forEach((p: any) => {
      const cityId = p.cityId;
      const resName = p.resource.name;
      if (!result[cityId]) result[cityId] = {};
      result[cityId][resName] = p.price;
    });
    res.json(result);
  });

  // Обновить цены в одном городе (принимает { cityId, prices: { "Название": price } })
  router.put('/prices', async (req: AuthRequest, res) => {
    const { cityId, prices } = req.body;
    if (!cityId || !prices) return res.status(400).json({ error: 'cityId и prices обязательны' });

    // Находим все ресурсы по именам
    const resources = await prisma.resource.findMany({
      where: { name: { in: Object.keys(prices) } },
    });

    const resourceMap = new Map(resources.map(r => [r.name, r.id]));

    for (const [name, price] of Object.entries(prices)) {
      const resourceId = resourceMap.get(name);
      if (!resourceId) continue;
      await prisma.resourcePrice.upsert({
        where: {
          userId_resourceId_cityId: {
            userId: req.userId!,
            resourceId,
            cityId,
          },
        },
        create: {
          userId: req.userId!,
          resourceId,
          cityId,
          price: price as number,
        },
        update: { price: price as number },
      });
    }
    res.json({ success: true });
  });

  return router;
}