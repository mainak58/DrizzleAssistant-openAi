import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Create a PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);
