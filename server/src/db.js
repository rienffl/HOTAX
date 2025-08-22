
import pkg from 'pg';
const { Pool } = pkg;
const connectionString = process.env.DATABASE_URL;
export const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
