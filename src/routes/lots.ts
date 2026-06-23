import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export default function (prisma: PrismaClient) {
  const router = Router();
  router.use(authMiddleware);

  // Все лоты пользователя
  router.get('/', async (req: AuthRequest, res) => {
    const lots = await prisma.lot.findMany({
      where: { userId: req.userId },
      include: { item: true, city: true },
    });
    res.json(lots);
  });

  // Создать лот (из товара)
  router.post('/', async (req: AuthRequest, res) => {
    const { itemId, cityId, quantityTotal, costPerUnit, totalCost, sellPricePerUnit, name, image } = req.body;
    const lot = await prisma.lot.create({
      data: {
        userId: req.userId!,
        itemId,
        cityId,
        quantityTotal,
        quantityRemaining: quantityTotal,
        quantitySold: 0,
        costPerUnit,
        totalCost,
        sellPricePerUnit,
        totalRevenue: 0,
        commissionPaid: 0,
      },
    });
    res.json(lot);
  });

  // Обновить остаток/цену (частично)
  router.put('/:id', async (req: AuthRequest, res) => {
    const id = req.params.id as string;
    const { quantityRemaining, sellPricePerUnit } = req.body;
    const lot = await prisma.lot.findFirst({ where: { id, userId: req.userId } });
    if (!lot) return res.status(404).json({ error: 'Лот не найден' });
    const data: any = {};
    if (quantityRemaining !== undefined) {
      data.quantityRemaining = quantityRemaining;
      data.quantitySold = lot.quantityTotal - quantityRemaining;
    }
    if (sellPricePerUnit !== undefined) {
      data.sellPricePerUnit = sellPricePerUnit;
    }
    const updated = await prisma.lot.update({ where: { id }, data });
    res.json(updated);
  });

  // Удалить лот
  router.delete('/:id', async (req: AuthRequest, res) => {
    const id = req.params.id as string;
    await prisma.lot.deleteMany({ where: { id, userId: req.userId } });
    res.json({ success: true });
  });

  // Внести продажу
  router.post('/:id/sale', async (req: AuthRequest, res) => {
    const id = req.params.id as string;
    const { quantity, revenue } = req.body; // количество проданного, полученная сумма (нетто)
    const lot = await prisma.lot.findFirst({ where: { id, userId: req.userId } });
    if (!lot) return res.status(404).json({ error: 'Лот не найден' });
    if (quantity <= 0 || quantity > lot.quantityRemaining) return res.status(400).json({ error: 'Неверное количество' });
    if (revenue < 0) return res.status(400).json({ error: 'Неверная выручка' });
    const updated = await prisma.lot.update({
      where: { id },
      data: {
        quantityRemaining: lot.quantityRemaining - quantity,
        quantitySold: lot.quantitySold + quantity,
        totalRevenue: lot.totalRevenue + revenue,
      },
    });
    res.json(updated);
  });

  return router;
}