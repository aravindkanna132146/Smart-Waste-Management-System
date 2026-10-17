import app from './app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        // Test database connection
        await prisma.$connect();
        console.log('✅ Database connected successfully');

        // Auto-seed if empty
        const binCount = await prisma.bin.count();
        if (binCount === 0) {
            console.log('📦 No data found, running auto-seed...');
            try {
                const { main } = await import('../prisma/seed');
                // seed is self-contained so just import
            } catch (e) {
                console.log('ℹ️  Run "npm run db:seed" to add sample data');
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
