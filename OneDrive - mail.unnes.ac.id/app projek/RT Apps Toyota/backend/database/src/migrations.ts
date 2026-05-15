/**
 * Database Migration Script for Digital RT-Muban Platform
 * This script creates all necessary tables based on the database schema
 * Run with: npm run migrate
 */

import { db } from '@rt-muban/shared';
import logger from '@rt-muban/shared/src/utils/logger';

const migrations = [
  // 1. Authentication & User Management Tables
  {
    name: '001_create_users_table',
    query: `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100),
        profile_picture_url TEXT,
        language_preference VARCHAR(5) DEFAULT 'id',
        timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
        is_active BOOLEAN DEFAULT true,
        is_verified BOOLEAN DEFAULT false,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
      CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
    `,
  },
  {
    name: '002_create_roles_table',
    query: `
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      INSERT INTO roles (name, description) VALUES
        ('admin', 'System administrator with full access'),
        ('rt_leader', 'RT/Muban leader with management capabilities'),
        ('resident', 'Regular community resident'),
        ('business_owner', 'Local business owner'),
        ('security_personnel', 'Security patrol member'),
        ('waste_collector', 'Waste bank collection team member')
      ON CONFLICT DO NOTHING;
    `,
  },
  {
    name: '003_create_permissions_table',
    query: `
      CREATE TABLE IF NOT EXISTS permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        resource VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);
    `,
  },
  {
    name: '004_create_user_roles_table',
    query: `
      CREATE TABLE IF NOT EXISTS user_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        neighborhood_id UUID,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, role_id, neighborhood_id)
      );
      CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
    `,
  },
  {
    name: '005_create_role_permissions_table',
    query: `
      CREATE TABLE IF NOT EXISTS role_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        UNIQUE(role_id, permission_id)
      );
    `,
  },
  {
    name: '006_create_sessions_table',
    query: `
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) UNIQUE NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        revoked_at TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    `,
  },
  {
    name: '007_create_user_settings_table',
    query: `
      CREATE TABLE IF NOT EXISTS user_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        notification_preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,
  },

  // 2. Neighborhood Management Tables
  {
    name: '008_create_neighborhoods_table',
    query: `
      CREATE TABLE IF NOT EXISTS neighborhoods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL,
        country VARCHAR(50) NOT NULL,
        province VARCHAR(100),
        city VARCHAR(100),
        district VARCHAR(100),
        sub_district VARCHAR(100),
        postal_code VARCHAR(20),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        total_households INTEGER DEFAULT 0,
        leader_id UUID REFERENCES users(id),
        description TEXT,
        logo_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_neighborhoods_country ON neighborhoods(country);
      CREATE INDEX IF NOT EXISTS idx_neighborhoods_leader_id ON neighborhoods(leader_id);
      CREATE INDEX IF NOT EXISTS idx_neighborhoods_location ON neighborhoods(latitude, longitude);
    `,
  },
  {
    name: '009_create_households_table',
    query: `
      CREATE TABLE IF NOT EXISTS households (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
        household_number VARCHAR(50) NOT NULL,
        address TEXT NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        total_members INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(neighborhood_id, household_number)
      );
      CREATE INDEX IF NOT EXISTS idx_households_neighborhood_id ON households(neighborhood_id);
    `,
  },
  {
    name: '010_create_household_members_table',
    query: `
      CREATE TABLE IF NOT EXISTS household_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        relationship_to_head VARCHAR(50),
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(household_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON household_members(household_id);
      CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON household_members(user_id);
    `,
  },
  {
    name: '011_create_announcements_table',
    query: `
      CREATE TABLE IF NOT EXISTS announcements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50),
        priority VARCHAR(20) DEFAULT 'normal',
        published_at TIMESTAMP,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_announcements_neighborhood_id ON announcements(neighborhood_id);
      CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON announcements(published_at);
    `,
  },

  // 3. Waste Banking Tables
  {
    name: '012_create_waste_categories_table',
    query: `
      CREATE TABLE IF NOT EXISTS waste_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        unit VARCHAR(20),
        value_per_unit DECIMAL(10, 2),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,
  },
  {
    name: '013_create_waste_collection_schedules_table',
    query: `
      CREATE TABLE IF NOT EXISTS waste_collection_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
        collection_date DATE NOT NULL,
        collection_time TIME NOT NULL,
        location VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_waste_schedules_neighborhood_id ON waste_collection_schedules(neighborhood_id);
      CREATE INDEX IF NOT EXISTS idx_waste_schedules_date ON waste_collection_schedules(collection_date);
    `,
  },
  {
    name: '014_create_waste_deposits_table',
    query: `
      CREATE TABLE IF NOT EXISTS waste_deposits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        waste_category_id UUID NOT NULL REFERENCES waste_categories(id),
        quantity DECIMAL(10, 2) NOT NULL,
        total_points DECIMAL(10, 2),
        collection_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_waste_deposits_user_id ON waste_deposits(user_id);
      CREATE INDEX IF NOT EXISTS idx_waste_deposits_category_id ON waste_deposits(waste_category_id);
    `,
  },
  {
    name: '015_create_user_points_table',
    query: `
      CREATE TABLE IF NOT EXISTS user_points (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        balance DECIMAL(12, 2) DEFAULT 0,
        total_earned DECIMAL(12, 2) DEFAULT 0,
        total_redeemed DECIMAL(12, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,
  },
  {
    name: '016_create_recycling_centers_table',
    query: `
      CREATE TABLE IF NOT EXISTS recycling_centers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        phone VARCHAR(20),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_recycling_centers_neighborhood_id ON recycling_centers(neighborhood_id);
    `,
  },

  // 4. Marketplace Tables
  {
    name: '017_create_businesses_table',
    query: `
      CREATE TABLE IF NOT EXISTS businesses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        neighborhood_id UUID REFERENCES neighborhoods(id),
        business_name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        phone_number VARCHAR(20),
        address TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON businesses(owner_id);
      CREATE INDEX IF NOT EXISTS idx_businesses_neighborhood_id ON businesses(neighborhood_id);
      CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category);
    `,
  },
  {
    name: '018_create_products_table',
    query: `
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        price DECIMAL(12, 2) NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        image_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_products_business_id ON products(business_id);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    `,
  },
  {
    name: '019_create_orders_table',
    query: `
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        seller_id UUID NOT NULL REFERENCES users(id),
        total_price DECIMAL(12, 2),
        status VARCHAR(50) DEFAULT 'pending',
        delivery_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
      CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    `,
  },
  {
    name: '020_create_order_items_table',
    query: `
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price DECIMAL(12, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
    `,
  },
  {
    name: '021_create_reviews_table',
    query: `
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON reviews(business_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
      CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
    `,
  },

  // 5. SOS & Emergency Tables
  {
    name: '022_create_emergency_contacts_table',
    query: `
      CREATE TABLE IF NOT EXISTS emergency_contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        contact_name VARCHAR(255) NOT NULL,
        relationship VARCHAR(50),
        phone_number VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);
    `,
  },
  {
    name: '023_create_sos_alerts_table',
    query: `
      CREATE TABLE IF NOT EXISTS sos_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
        alert_type VARCHAR(50),
        title VARCHAR(255),
        description TEXT,
        location VARCHAR(255),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        status VARCHAR(50) DEFAULT 'active',
        severity VARCHAR(50) DEFAULT 'normal',
        acknowledged_by UUID REFERENCES users(id),
        acknowledged_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_sos_alerts_status ON sos_alerts(status);
      CREATE INDEX IF NOT EXISTS idx_sos_alerts_neighborhood_id ON sos_alerts(neighborhood_id);
      CREATE INDEX IF NOT EXISTS idx_sos_alerts_created_at ON sos_alerts(created_at);
    `,
  },
  {
    name: '024_create_incidents_table',
    query: `
      CREATE TABLE IF NOT EXISTS incidents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
        incident_type VARCHAR(100),
        title VARCHAR(255),
        description TEXT,
        location VARCHAR(255),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        status VARCHAR(50) DEFAULT 'reported',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
      CREATE INDEX IF NOT EXISTS idx_incidents_neighborhood_id ON incidents(neighborhood_id);
      CREATE INDEX IF NOT EXISTS idx_incidents_incident_type ON incidents(incident_type);
    `,
  },

  // 6. Patrol Tables
  {
    name: '025_create_patrol_schedules_table',
    query: `
      CREATE TABLE IF NOT EXISTS patrol_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
        schedule_name VARCHAR(255),
        description TEXT,
        start_date DATE NOT NULL,
        end_date DATE,
        is_recurring BOOLEAN DEFAULT false,
        recurrence_pattern VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_patrol_schedules_neighborhood_id ON patrol_schedules(neighborhood_id);
      CREATE INDEX IF NOT EXISTS idx_patrol_schedules_start_date ON patrol_schedules(start_date);
    `,
  },
  {
    name: '026_create_patrol_shifts_table',
    query: `
      CREATE TABLE IF NOT EXISTS patrol_shifts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        schedule_id UUID NOT NULL REFERENCES patrol_schedules(id) ON DELETE CASCADE,
        shift_date DATE NOT NULL,
        shift_start_time TIME NOT NULL,
        shift_end_time TIME NOT NULL,
        assigned_to UUID NOT NULL REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_patrol_shifts_schedule_id ON patrol_shifts(schedule_id);
      CREATE INDEX IF NOT EXISTS idx_patrol_shifts_assigned_to ON patrol_shifts(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_patrol_shifts_date ON patrol_shifts(shift_date);
    `,
  },
  {
    name: '027_create_patrol_logs_table',
    query: `
      CREATE TABLE IF NOT EXISTS patrol_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shift_id UUID NOT NULL REFERENCES patrol_shifts(id) ON DELETE CASCADE,
        patrol_officer_id UUID NOT NULL REFERENCES users(id),
        location VARCHAR(255),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_patrol_logs_shift_id ON patrol_logs(shift_id);
      CREATE INDEX IF NOT EXISTS idx_patrol_logs_officer_id ON patrol_logs(patrol_officer_id);
    `,
  },
  {
    name: '028_create_patrol_incidents_table',
    query: `
      CREATE TABLE IF NOT EXISTS patrol_incidents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        shift_id UUID NOT NULL REFERENCES patrol_shifts(id) ON DELETE CASCADE,
        reported_by UUID NOT NULL REFERENCES users(id),
        incident_type VARCHAR(100),
        title VARCHAR(255),
        description TEXT,
        location VARCHAR(255),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        status VARCHAR(50) DEFAULT 'reported',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_patrol_incidents_shift_id ON patrol_incidents(shift_id);
      CREATE INDEX IF NOT EXISTS idx_patrol_incidents_status ON patrol_incidents(status);
    `,
  },
];

// Run migrations
export async function runMigrations() {
  try {
    logger.info('Starting database migrations...');

    for (const migration of migrations) {
      try {
        await db.query(migration.query);
        logger.info(`✓ Migration completed: ${migration.name}`);
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          logger.info(`⊘ Migration skipped (already exists): ${migration.name}`);
        } else {
          logger.error(`✗ Migration failed: ${migration.name}`, error.message);
          throw error;
        }
      }
    }

    logger.info('All database migrations completed successfully!');
  } catch (error) {
    logger.error('Database migration failed:', error);
    throw error;
  }
}

// Export for use in initialization
export default { runMigrations };
