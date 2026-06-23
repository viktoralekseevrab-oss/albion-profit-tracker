import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export default function (prisma: PrismaClient) {
  const router = Router();
  router.use(authMiddleware);

  router.post('/', async (req: AuthRequest, res) => {
    const { items, lots, cityResources } = req.body;
    const userId = req.userId!;

    try {
      await prisma.$transaction(async (tx) => {
        // Удаляем старые данные пользователя
        await tx.item.deleteMany({ where: { userId } });
        await tx.lot.deleteMany({ where: { userId } });
        await tx.resourcePrice.deleteMany({ where: { userId } });

        // Создаём товары
        for (const item of items) {
          const { id, resources, cityData, ...rest } = item;

          // Для каждого ресурса ищем его id по имени (если передан resourceId, берём его)
          const resourcesCreate = [];
          for (const r of resources) {
            let resourceId = r.resourceId;
            if (!resourceId && r.name) {
              const resource = await tx.resource.findUnique({ where: { name: r.name } });
              if (!resource) throw new Error(`Ресурс не найден: ${r.name}`);
              resourceId = resource.id;
            }
            if (!resourceId) throw new Error('У ресурса должно быть имя или resourceId');
            resourcesCreate.push({ resourceId, qty: r.qty });
          }

          await tx.item.create({
            data: {
              ...rest,
              userId,
              resources: { create: resourcesCreate },
              cityData: {
                create: cityData.map((cd: any) => ({
                  cityId: cd.cityId,
                  craftCost: cd.craftCost || 0,
                  sellPrice: cd.sellPrice || 0,
                  taxPercent: cd.taxPercent ?? 10.5,
                })),
              },
            },
          });
        }

        // Создаём лоты
        for (const lot of lots) {
          const { id, ...lotData } = lot;
          await tx.lot.create({ data: { ...lotData, userId } });
        }

        // Восстанавливаем цены ресурсов
        for (const cityId of Object.keys(cityResources)) {
          const prices = cityResources[cityId];
          for (const resourceName of Object.keys(prices)) {
            const resource = await tx.resource.findUnique({ where: { name: resourceName } });
            if (resource) {
              await tx.resourcePrice.upsert({
                where: {
                  userId_resourceId_cityId: {
                    userId,
                    resourceId: resource.id,
                    cityId,
                  },
                },
                create: {
                  userId,
                  resourceId: resource.id,
                  cityId,
                  price: prices[resourceName],
                },
                update: { price: prices[resourceName] },
              });
            }
          }
        }
      });

      res.json({ success: true });
    } catch (err: any) {
      console.error('Ошибка импорта:', err);
      res.status(400).json({ error: err.message });
    }
  });

  return router;
}