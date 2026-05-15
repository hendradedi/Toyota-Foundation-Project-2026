import { Pool, PoolConfig } from 'pg';
import { config } from './config';
import logger from './utils/logger';

// Create connection pool
const poolConfig: PoolConfig = {
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  max: config.database.maxConnections,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
  logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Create a database client
export const db = {
  query: (text: string, params?: any[]) => {
    return pool.query(text, params);
  },
  connect: () => {
    return pool.connect();
  },
  end: () => {
    return pool.end();
  },
  getPool: () => {
    return pool;
  },
};

// Export getPool function for direct access
export const getPool = () => pool;
