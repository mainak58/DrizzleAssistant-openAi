import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import "dotenv/config";

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not defined in environment variables");
    process.exit(1);
}

// Create a PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Initialize Drizzle ORM
const db = drizzle(pool);

// Run migrations
async function main() {
    console.log("Running migrations...");

    try {
        await migrate(db, { migrationsFolder: "./drizzle" });
        console.log("Migrations completed successfully!");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
