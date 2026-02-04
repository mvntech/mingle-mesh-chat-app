import { database, config, up, down, status } from 'migrate-mongo';
import { validateEnvironment } from '../config/validateEnv.js';
import "dotenv/config";

async function runMigrations() {
    try {
        validateEnvironment();
    } catch (error) {
        console.error('Environment validation failed:', error);
        process.exit(1);
    }

    try {
        console.log(`Connecting to MongoDB: ${process.env.MONGODB_NAME}...`);
        const { db, client } = await database.connect();
        const migrationStatus = await status(db);
        console.log('Migration Status:', migrationStatus);
        console.log('Applying pending migrations...');
        const appliedItem = await up(db, client);
        if (appliedItem.length > 0) {
            console.log(`Successfully applied ${appliedItem.length} migrations:`);
            appliedItem.forEach(item => console.log(`   - ${item}`));
        } else {
            console.log('No pending migrations found. Database is up to date.');
        }
        await client.close();
        console.log('Migration process completed.');
        process.exit(0);

    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

runMigrations();
