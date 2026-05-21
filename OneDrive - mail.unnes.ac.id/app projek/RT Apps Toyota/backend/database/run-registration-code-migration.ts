import { db } from '@rt-muban/shared';

async function runRegistrationCodeMigration() {
  try {
    console.log('🔄 Running registration code migration...');

    // Add registration_code and registration_code_generated_at columns
    await db.query(`
      ALTER TABLE neighborhoods
        ADD COLUMN IF NOT EXISTS registration_code VARCHAR(20) UNIQUE,
        ADD COLUMN IF NOT EXISTS registration_code_generated_at TIMESTAMP
    `);

    console.log('✅ Added registration_code columns');

    // Create index
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_neighborhoods_registration_code 
      ON neighborhoods(registration_code)
    `);

    console.log('✅ Created index on registration_code');
    console.log('✅ Registration code migration completed successfully!');

    process.exit(0);
  } catch (error: any) {
    if (error.code === '42701') {
      console.log('ℹ️  Registration code columns already exist.');
      process.exit(0);
    } else {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  }
}

runRegistrationCodeMigration();
