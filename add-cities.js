const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const cities = [
  { name: 'Лимхерст', slug: 'lymhurst' },
  { name: 'Мартлок', slug: 'martlock' },
  { name: 'Бриджуотер', slug: 'bridgewatch' },
  { name: 'Тетфорд', slug: 'thetford' },
  { name: 'Форт Стерлинг', slug: 'fortsterling' },
  { name: 'Карлеон', slug: 'caerleon' },
  { name: 'Чёрный рынок', slug: 'blackmarket' },
];

const resources = [];
const categories = [
  { key: 'ore', name: 'Стальной слиток' },
  { key: 'wood', name: 'Брусья' },
  { key: 'hide', name: 'Кожа' },
  { key: 'fiber', name: 'Ткань' },
];
for (const cat of categories) {
  for (const tier of [4,5,6,7,8]) {
    for (const enchant of [0,1,2,3,4]) {
      resources.push({
        name: `${cat.name} T${tier}.${enchant}`,
        category: cat.key,
        tier,
        enchant,
      });
    }
  }
}

async function main() {
  // Города
  for (const c of cities) {
    await prisma.city.upsert({ where: { slug: c.slug }, create: c, update: {} });
  }
  // Ресурсы
  for (const r of resources) {
    await prisma.resource.upsert({ where: { name: r.name }, create: r, update: {} });
  }
  console.log('✅ Города и ресурсы успешно добавлены!');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });