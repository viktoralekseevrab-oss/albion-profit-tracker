import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export default function (prisma: PrismaClient) {
  const router = Router();
  router.use(authMiddleware);

  async function getResourceId(r: any, tx: any = prisma) {
  if (r.resourceId) return r.resourceId;
  if (r.name) {
    let resource = await tx.resource.findUnique({ where: { name: r.name } });
    if (!resource) {
      // Создаём новый ресурс с пометкой "custom"
      resource = await tx.resource.create({
        data: {
          name: r.name,
          category: 'custom',
          tier: 0,
          enchant: 0,
        },
      });
      console.log(`Создан новый ресурс: ${r.name}`);
    }
    return resource.id;
  }
  throw new Error('У ресурса должно быть поле name или resourceId');
}

  router.get('/', async (req: AuthRequest, res) => {
    const items = await prisma.item.findMany({
      where: { userId: req.userId },
      include: {
        resources: { include: { resource: true } },
        cityData: { include: { city: true } },
      },
    });
    res.json(items);
  });

  router.post('/', async (req: AuthRequest, res) => {
    try {
      const { name, image, resources, cityData, returnPercent, useReturn, quantity } = req.body;
      let cdArray = cityData;
      if (!Array.isArray(cdArray)) {
        cdArray = Object.entries(cdArray).map(([cityId, data]: any) => ({
          cityId,
          craftCost: data.craftCost || 0,
          sellPrice: data.sellPrice || 0,
          taxPercent: data.taxPercent ?? 10.5,
        }));
      }
      const resourcesCreate = await Promise.all(resources.map(async (r: any) => ({
        resourceId: await getResourceId(r),
        qty: r.qty,
      })));

      const item = await prisma.item.create({
        data: {
          userId: req.userId!,
          name,
          image,
          returnPercent,
          useReturn,
          quantity,
          resources: { create: resourcesCreate },
          cityData: {
            create: cdArray.map((cd: any) => ({
              cityId: cd.cityId,
              craftCost: cd.craftCost || 0,
              sellPrice: cd.sellPrice || 0,
              taxPercent: cd.taxPercent ?? 10.5,
            })),
          },
        },
        include: {
          resources: { include: { resource: true } },
          cityData: { include: { city: true } },
        },
      });
      res.json(item);
    } catch (err: any) {
      console.error('Ошибка создания товара:', err);
      res.status(400).json({ error: err.message });
    }
  });

  router.put('/:id', async (req: AuthRequest, res) => {
    try {
      const id = req.params.id as string;
      const { name, image, resources, cityData, returnPercent, useReturn, quantity } = req.body;
      let cdArray = cityData;
      if (!Array.isArray(cdArray)) {
        cdArray = Object.entries(cdArray).map(([cityId, data]: any) => ({
          cityId,
          craftCost: data.craftCost || 0,
          sellPrice: data.sellPrice || 0,
          taxPercent: data.taxPercent ?? 10.5,
        }));
      }

      await prisma.$transaction(async (tx) => {
        const resourcesCreate = await Promise.all(resources.map(async (r: any) => ({
          resourceId: await getResourceId(r, tx),
          qty: r.qty,
        })));

        await tx.itemResource.deleteMany({ where: { itemId: id } });
        await tx.itemCityData.deleteMany({ where: { itemId: id } });
        await tx.item.update({
          where: { id },
          data: {
            name,
            image,
            returnPercent,
            useReturn,
            quantity,
            resources: { create: resourcesCreate },
            cityData: {
              create: cdArray.map((cd: any) => ({
                cityId: cd.cityId,
                craftCost: cd.craftCost || 0,
                sellPrice: cd.sellPrice || 0,
                taxPercent: cd.taxPercent ?? 10.5,
              })),
            },
          },
        });
      });

      // Загружаем с включением resource, чтобы вернуть клиенту имена
      const updated = await prisma.item.findUnique({
        where: { id },
        include: {
          resources: { include: { resource: true } },
          cityData: { include: { city: true } },
        },
      });
      res.json(updated);
    } catch (err: any) {
      console.error('Ошибка обновления товара:', err);
      res.status(400).json({ error: err.message });
    }
  });

  router.delete('/:id', async (req: AuthRequest, res) => {
    await prisma.item.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  });

  return router;
}