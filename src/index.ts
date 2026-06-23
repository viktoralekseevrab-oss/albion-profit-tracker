import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { seedCitiesAndResources } from './seed';
import authRoutes from './routes/auth';
import itemRoutes from './routes/items';
import cityRoutes from './routes/cities';
import lotRoutes from './routes/lots'   // пока заглушка или потом создашь
import resourceRoutes from './routes/resources';
//import importRoutes from './routes/importData';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Авто-заполнение справочников
seedCitiesAndResources(prisma).catch(console.error);

app.use('/api/cities', cityRoutes(prisma));
app.use('/api/auth', authRoutes(prisma));
app.use('/api/items', itemRoutes(prisma));
app.use('/api/lots', lotRoutes(prisma)); // раскомментировать, когда появится файл
app.use('/api/resources', resourceRoutes(prisma));
//app.use('/api/import', importRoutes(prisma));
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌱 Сервер запущен: http://localhost:${PORT}`);
});