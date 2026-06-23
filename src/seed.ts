import { PrismaClient } from '@prisma/client';

const CITIES = [
  { name: 'Лимхерст', slug: 'lymhurst' },
  { name: 'Мартлок', slug: 'martlock' },
  { name: 'Бриджуотер', slug: 'bridgewatch' },
  { name: 'Тетфорд', slug: 'thetford' },
  { name: 'Форт Стерлинг', slug: 'fortsterling' },
  { name: 'Карлеон', slug: 'caerleon' },
  { name: 'Чёрный рынок', slug: 'blackmarket' },
];

function generateResources() {
  const categories = [
    { key: 'ore', name: 'Стальной слиток' },
    { key: 'wood', name: 'Брусья' },
    { key: 'hide', name: 'Кожа' },
    { key: 'fiber', name: 'Ткань' },
  ];
  const tiers = [4,5,6,7,8];
  const enchants = [0,1,2,3,4];
  const resources: any[] = [];
  categories.forEach(cat => {
    tiers.forEach(tier => {
      enchants.forEach(enchant => {
        resources.push({
          name: `${cat.name} T${tier}.${enchant}`,
          category: cat.key,
          tier,
          enchant,
        });
      });
    });
  });
  return resources;
}

export async function seedCitiesAndResources(prisma: PrismaClient) {
  // Города
  for (const city of CITIES) {
    await prisma.city.upsert({
      where: { slug: city.slug },
      create: city,
      update: {},
    });
  }

  // Ресурсы
  const resources = generateResources();
  for (const res of resources) {
    await prisma.resource.upsert({
      where: { name: res.name },
      create: res,
      update: {},
    });
  }
  console.log('✅ Города и ресурсы синхронизированы');
}