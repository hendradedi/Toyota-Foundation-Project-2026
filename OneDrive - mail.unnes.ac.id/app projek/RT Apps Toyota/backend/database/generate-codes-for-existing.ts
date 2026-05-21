/**
 * Script to generate registration codes for existing neighborhoods
 * Run this script once to add registration codes to neighborhoods that don't have them yet
 * 
 * Usage: npx ts-node backend/database/generate-codes-for-existing.ts
 */

import { db } from '../shared/src';
import { generateUniqueRegistrationCode } from '../shared/src/utils/registration-code';

async function generateCodesForExisting() {
  console.log('🔄 Starting registration code generation for existing neighborhoods...\n');

  try {
    // Get all neighborhoods without registration codes
    const result = await db.query(
      `SELECT id, name, type, is_active 
       FROM neighborhoods 
       WHERE registration_code IS NULL 
       ORDER BY created_at ASC`
    );

    const neighborhoods = result.rows;
    
    if (neighborhoods.length === 0) {
      console.log('✅ All neighborhoods already have registration codes!');
      return;
    }

    console.log(`📋 Found ${neighborhoods.length} neighborhoods without registration codes\n`);

    let successCount = 0;
    let errorCount = 0;

    // Generate code for each neighborhood
    for (const neighborhood of neighborhoods) {
      try {
        console.log(`Processing: ${neighborhood.name} (${neighborhood.type})...`);

        // Generate unique registration code
        const registrationCode = await generateUniqueRegistrationCode(
          'RT',
          async (code: string) => {
            const existing = await db.query(
              'SELECT id FROM neighborhoods WHERE registration_code = $1',
              [code]
            );
            return existing.rows.length > 0;
          }
        );

        // Update neighborhood with registration code
        await db.query(
          `UPDATE neighborhoods 
           SET registration_code = $1, 
               registration_code_generated_at = NOW() 
           WHERE id = $2`,
          [registrationCode, neighborhood.id]
        );

        console.log(`  ✅ Generated code: ${registrationCode}\n`);
        successCount++;

      } catch (error) {
        console.error(`  ❌ Error generating code for ${neighborhood.name}:`, error);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`  Total processed: ${neighborhoods.length}`);
    console.log(`  ✅ Success: ${successCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log('='.repeat(60) + '\n');

    // Verify results
    const verifyResult = await db.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(registration_code) as with_code,
        COUNT(*) - COUNT(registration_code) as without_code
       FROM neighborhoods`
    );

    const stats = verifyResult.rows[0];
    console.log('📈 Current Status:');
    console.log(`  Total neighborhoods: ${stats.total}`);
    console.log(`  With registration code: ${stats.with_code}`);
    console.log(`  Without registration code: ${stats.without_code}\n`);

    if (stats.without_code === '0') {
      console.log('🎉 All neighborhoods now have registration codes!');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await db.end();
    console.log('\n✅ Script completed. Database connection closed.');
  }
}

// Run the script
generateCodesForExisting()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
