/**
 * Database Module Index
 * Exports migrations and seeding functions
 */

export { runMigrations } from './migrations';
export { runSeeds } from './seeds';

// Combined initialization function
export async function initializeDatabase() {
  const { runMigrations } = await import('./migrations');
  const { runSeeds } = await import('./seeds');

  try {
    console.log('Initializing database...');
    
    // Run migrations first
    await runMigrations();
    
    // Then run seeds
    await runSeeds();
    
    console.log('Database initialization completed!');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

export default { initializeDatabase };
