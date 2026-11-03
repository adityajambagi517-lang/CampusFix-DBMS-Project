import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://campusfix_app:CampusFix@2026_Secure@localhost:5432/campusfix_db';

let pool: Pool;

declare global {
  // eslint-disable-next-line no-var
  var __campusfix_pool: Pool | undefined;
}

if (process.env.NODE_ENV === 'production') {
  pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
} else {
  if (!global.__campusfix_pool) {
    global.__campusfix_pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  pool = global.__campusfix_pool;
}

export default pool;

/**
 * Execute parameterized SQL query safely against PostgreSQL pool
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SQL Query] (${duration}ms):`, text.slice(0, 100));
  }
  return res;
}

/**
 * Advanced DBMS Concept: ACID Transaction execution wrapper
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

