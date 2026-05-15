/**
 * Database Seed Script for Digital RT-Muban Platform
 * This script inserts initial/demo data into the database
 * Run with: npm run seed
 */

import { db } from '@rt-muban/shared';
import { hashPassword } from '@rt-muban/shared/src/utils/password';
import logger from '@rt-muban/shared/src/utils/logger';
import { v4 as uuidv4 } from 'uuid';

const seedData = {
  permissions: [
    // User permissions
    { resource: 'users', action: 'read', description: 'Read user information' },
    { resource: 'users', action: 'update', description: 'Update user profile' },
    { resource: 'users', action: 'delete', description: 'Delete user account' },
    
    // Neighborhood permissions
    { resource: 'neighborhoods', action: 'read', description: 'Read neighborhood information' },
    { resource: 'neighborhoods', action: 'create', description: 'Create new neighborhood' },
    { resource: 'neighborhoods', action: 'update', description: 'Update neighborhood' },
    { resource: 'neighborhoods', action: 'delete', description: 'Delete neighborhood' },
    
    // Announcement permissions
    { resource: 'announcements', action: 'create', description: 'Create announcements' },
    { resource: 'announcements', action: 'update', description: 'Update announcements' },
    { resource: 'announcements', action: 'delete', description: 'Delete announcements' },
    
    // Waste bank permissions
    { resource: 'waste_bank', action: 'manage', description: 'Manage waste banking operations' },
    { resource: 'waste_bank', action: 'collect', description: 'Record waste collection' },
    
    // Marketplace permissions
    { resource: 'marketplace', action: 'sell', description: 'Create and sell products' },
    { resource: 'marketplace', action: 'buy', description: 'Purchase products' },
    { resource: 'marketplace', action: 'review', description: 'Leave reviews' },
    
    // Patrol permissions
    { resource: 'patrol', action: 'manage', description: 'Manage patrol schedules' },
    { resource: 'patrol', action: 'log', description: 'Log patrol activities' },
    
    // Admin permissions
    { resource: 'system', action: 'admin', description: 'Full system administration' },
  ],
  wasteCategories: [
    {
      name: 'Plastic',
      description: 'Plastic bottles, bags, and containers',
      unit: 'kg',
      value_per_unit: 500,
    },
    {
      name: 'Paper',
      description: 'Newspapers, cardboard, and paper waste',
      unit: 'kg',
      value_per_unit: 300,
    },
    {
      name: 'Metal',
      description: 'Aluminum cans, tin, and metal waste',
      unit: 'kg',
      value_per_unit: 1000,
    },
    {
      name: 'Glass',
      description: 'Glass bottles and glass waste',
      unit: 'kg',
      value_per_unit: 200,
    },
    {
      name: 'Organic',
      description: 'Food waste and organic materials',
      unit: 'kg',
      value_per_unit: 100,
    },
  ],
  demoUsers: [
    {
      email: 'admin@rtmuban.local',
      password: 'AdminPassword@123',
      first_name: 'Admin',
      last_name: 'User',
      phone: '+6281234567890',
      role: 'admin',
    },
    {
      email: 'leader@rtmuban.local',
      password: 'LeaderPassword@123',
      first_name: 'RT',
      last_name: 'Leader',
      phone: '+6281234567891',
      role: 'rt_leader',
    },
    {
      email: 'resident@rtmuban.local',
      password: 'ResidentPassword@123',
      first_name: 'John',
      last_name: 'Doe',
      phone: '+6281234567892',
      role: 'resident',
    },
  ],
};

export async function runSeeds() {
  try {
    logger.info('Starting database seeding...');

    // 1. Seed permissions
    logger.info('Seeding permissions...');
    for (const perm of seedData.permissions) {
      const [resource, action] = [perm.resource, perm.action];
      const existingPerm = await db.query(
        `SELECT id FROM permissions WHERE resource = $1 AND action = $2`,
        [resource, action]
      );

      if (existingPerm.rows.length === 0) {
        await db.query(
          `INSERT INTO permissions (id, name, description, resource, action)
           VALUES ($1, $2, $3, $4, $5)`,
          [uuidv4(), `${resource}:${action}`, perm.description, resource, action]
        );
        logger.info(`✓ Permission created: ${resource}:${action}`);
      }
    }

    // 2. Seed waste categories
    logger.info('Seeding waste categories...');
    for (const category of seedData.wasteCategories) {
      const existing = await db.query(
        `SELECT id FROM waste_categories WHERE name = $1`,
        [category.name]
      );

      if (existing.rows.length === 0) {
        await db.query(
          `INSERT INTO waste_categories (id, name, description, unit, value_per_unit, is_active)
           VALUES ($1, $2, $3, $4, $5, true)`,
          [uuidv4(), category.name, category.description, category.unit, category.value_per_unit]
        );
        logger.info(`✓ Waste category created: ${category.name}`);
      }
    }

    // 3. Seed demo users
    logger.info('Seeding demo users...');
    for (const user of seedData.demoUsers) {
      const existing = await db.query(
        `SELECT id FROM users WHERE email = $1`,
        [user.email]
      );

      if (existing.rows.length === 0) {
        const userId = uuidv4();
        const hashedPassword = await hashPassword(user.password);

        await db.query(
          `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, language_preference, timezone, is_active, is_verified)
           VALUES ($1, $2, $3, $4, $5, $6, 'id', 'Asia/Jakarta', true, true)`,
          [userId, user.email, hashedPassword, user.first_name, user.last_name, user.phone]
        );

        // Get role ID
        const roleResult = await db.query(
          `SELECT id FROM roles WHERE name = $1`,
          [user.role]
        );

        if (roleResult.rows.length > 0) {
          await db.query(
            `INSERT INTO user_roles (id, user_id, role_id)
             VALUES ($1, $2, $3)`,
            [uuidv4(), userId, roleResult.rows[0].id]
          );
        }

        logger.info(`✓ Demo user created: ${user.email}`);
      }
    }

    logger.info('✓ All database seeds completed successfully!');
    logger.info('Demo users:');
    for (const user of seedData.demoUsers) {
      logger.info(`  - ${user.email} / ${user.password}`);
    }
  } catch (error) {
    logger.error('Database seeding failed:', error);
    throw error;
  }
}

// Export for use in initialization
export default { runSeeds };
