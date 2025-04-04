import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not defined in environment variables");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

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
