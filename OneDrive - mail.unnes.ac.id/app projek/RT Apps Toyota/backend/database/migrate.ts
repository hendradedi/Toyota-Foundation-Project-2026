import { runMigrations } from './src/migrations'; runMigrations().catch(err => { console.error(err); process.exit(1); });
