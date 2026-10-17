import app from './app';
import { PrismaClient } from '@prisma/client';
import { seedDatabase } from './services/seeder';

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        // Test database connection
        await prisma.$connect();
        console.log('✅ Database connected successfully');

        // Auto-seed if the database is empty (first startup)
        const binCount = await prisma.bin.count();
        if (binCount === 0) {
            try {
                await seedDatabase();
            } catch (e) {
                console.warn('⚠️  Auto-seed failed. Run "npm run db:seed" manually.', e);
            }
        }

        app.listen(PORT, () => {
            console.log(`🚀 Smart Waste Management Server running on port ${PORT}`);
            console.log(`   API: http://localhost:${PORT}/api`);
            console.log(`   Health: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
