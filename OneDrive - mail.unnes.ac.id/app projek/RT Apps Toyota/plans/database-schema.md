# Digital RT-Muban Database Schema

## Overview

This document defines the complete database schema for the Digital RT-Muban platform, covering all five core functions: Administration, Waste Banking, Marketplace, SOS, and Patrol Scheduling.

---

## 1. Authentication & User Management

### users
```sql
CREATE TABLE users (
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

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_is_active ON users(is_active);
```

### roles
```sql
CREATE TABLE roles (
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
  ('waste_collector', 'Waste bank collection team member');
```

### user_roles
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  neighborhood_id UUID,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role_id, neighborhood_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
```

### permissions
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_permissions_resource_action ON permissions(resource, action);
```

### role_permissions
```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);
```

### sessions
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

---

## 2. Neighborhood Management

### neighborhoods
```sql
CREATE TABLE neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'RT' or 'Muban'
  country VARCHAR(50) NOT NULL, -- 'Indonesia' or 'Thailand'
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

CREATE INDEX idx_neighborhoods_country ON neighborhoods(country);
CREATE INDEX idx_neighborhoods_leader_id ON neighborhoods(leader_id);
CREATE INDEX idx_neighborhoods_location ON neighborhoods(latitude, longitude);
```

### households
```sql
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
  household_number VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  head_of_household_id UUID REFERENCES users(id),
  total_members INTEGER DEFAULT 1,
  phone_number VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(neighborhood_id, household_number)
);

CREATE INDEX idx_households_neighborhood_id ON households(neighborhood_id);
CREATE INDEX idx_households_head_of_household_id ON households(head_of_household_id);
```

### residents
```sql
CREATE TABLE residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  relationship_to_head VARCHAR(50),
  id_number VARCHAR(50),
  date_of_birth DATE,
  gender VARCHAR(10),
  occupation VARCHAR(100),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, household_id)
);

CREATE INDEX idx_residents_user_id ON residents(user_id);
CREATE INDEX idx_residents_household_id ON residents(household_id);
```

### announcements
```sql
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50), -- 'general', 'emergency', 'event', 'maintenance'
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  image_url TEXT,
  published_at TIMESTAMP,
  expires_at TIMESTAMP,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_announcements_neighborhood_id ON announcements(neighborhood_id);
CREATE INDEX idx_announcements_published_at ON announcements(published_at);
```

---

## 3. Waste Banking System

### waste_categories
```sql
CREATE TABLE waste_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  unit_of_measurement VARCHAR(20), -- 'kg', 'liter', 'piece'
  points_per_unit DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO waste_categories (name, unit_of_measurement, points_per_unit) VALUES
  ('Plastic Bottles', 'kg', 10),
  ('Paper', 'kg', 5),
  ('Metal', 'kg', 15),
  ('Glass', 'kg', 8),
  ('Organic Waste', 'kg', 2);
```

### waste_collections
```sql
CREATE TABLE waste_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
  collection_date DATE NOT NULL,
  collection_time TIME,
  location VARCHAR(255),
  collector_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_waste_collections_neighborhood_id ON waste_collections(neighborhood_id);
CREATE INDEX idx_waste_collections_collection_date ON waste_collections(collection_date);
```

### waste_transactions
```sql
CREATE TABLE waste_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  waste_category_id UUID NOT NULL REFERENCES waste_categories(id),
  collection_id UUID REFERENCES waste_collections(id),
  quantity DECIMAL(10, 2) NOT NULL,
  points_earned DECIMAL(10, 2) NOT NULL,
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE INDEX idx_waste_transactions_user_id ON waste_transactions(user_id);
CREATE INDEX idx_waste_transactions_transaction_date ON waste_transactions(transaction_date);
```

### waste_points
```sql
CREATE TABLE waste_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id),
  total_points DECIMAL(10, 2) DEFAULT 0,
  redeemed_points DECIMAL(10, 2) DEFAULT 0,
  available_points DECIMAL(10, 2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, neighborhood_id)
);

CREATE INDEX idx_waste_points_user_id ON waste_points(user_id);
```

### recycling_centers
```sql
CREATE TABLE recycling_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone_number VARCHAR(20),
  operating_hours TEXT,
  accepted_waste_types TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recycling_centers_neighborhood_id ON recycling_centers(neighborhood_id);
```

---

## 4. Marketplace System

### businesses
```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id),
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id),
  business_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  logo_url TEXT,
  phone_number VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  operating_hours TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX idx_businesses_neighborhood_id ON businesses(neighborhood_id);
CREATE INDEX idx_businesses_category ON businesses(category);
```

### products
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  price DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'IDR',
  stock_quantity INTEGER DEFAULT 0,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_business_id ON products(business_id);
CREATE INDEX idx_products_category ON products(category);
```

### orders
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'IDR',
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'unpaid', -- 'unpaid', 'paid', 'refunded'
  delivery_address TEXT,
  delivery_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
```

### order_items
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

### transactions
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  transaction_id VARCHAR(100) UNIQUE,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3),
  payment_method VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'success', 'failed', 'cancelled'
  gateway_response TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_order_id ON transactions(order_id);
```

### reviews
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_business_id ON reviews(business_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
```

---

## 5. SOS & Emergency System

### emergency_contacts
```sql
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_name VARCHAR(255) NOT NULL,
  relationship VARCHAR(50),
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_emergency_contacts_user_id ON emergency_contacts(user_id);
```

### emergency_alerts
```sql
CREATE TABLE emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id),
  created_by UUID NOT NULL REFERENCES users(id),
  alert_type VARCHAR(50) NOT NULL, -- 'medical', 'fire', 'security', 'natural_disaster', 'other'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
  responders_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

CREATE INDEX idx_emergency_alerts_neighborhood_id ON emergency_alerts(neighborhood_id);
CREATE INDEX idx_emergency_alerts_status ON emergency_alerts(status);
CREATE INDEX idx_emergency_alerts_created_at ON emergency_alerts(created_at);
```

### alert_responses
```sql
CREATE TABLE alert_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES emergency_alerts(id) ON DELETE CASCADE,
  responder_id UUID NOT NULL REFERENCES users(id),
  response_type VARCHAR(50), -- 'acknowledged', 'on_the_way', 'arrived', 'resolved'
  notes TEXT,
  responded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alert_responses_alert_id ON alert_responses(alert_id);
```

### incident_reports
```sql
CREATE TABLE incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id),
  reported_by UUID NOT NULL REFERENCES users(id),
  incident_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  incident_date TIMESTAMP NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'closed'
  assigned_to UUID REFERENCES users(id),
  evidence_urls TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_incident_reports_neighborhood_id ON incident_reports(neighborhood_id);
CREATE INDEX idx_incident_reports_status ON incident_reports(status);
```

---

## 6. Patrol & Security System

### patrol_schedules
```sql
CREATE TABLE patrol_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id),
  schedule_name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(50), -- 'daily', 'weekly', 'monthly'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_patrol_schedules_neighborhood_id ON patrol_schedules(neighborhood_id);
```

### patrol_shifts
```sql
CREATE TABLE patrol_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES patrol_schedules(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  shift_start_time TIME NOT NULL,
  shift_end_time TIME NOT NULL,
  assigned_to UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_patrol_shifts_schedule_id ON patrol_shifts(schedule_id);
CREATE INDEX idx_patrol_shifts_assigned_to ON patrol_shifts(assigned_to);
CREATE INDEX idx_patrol_shifts_shift_date ON patrol_shifts(shift_date);
```

### patrol_logs
```sql
CREATE TABLE patrol_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES patrol_shifts(id) ON DELETE CASCADE,
  patrol_officer_id UUID NOT NULL REFERENCES users(id),
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  notes TEXT,
  incidents_reported INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_patrol_logs_shift_id ON patrol_logs(shift_id);
CREATE INDEX idx_patrol_logs_patrol_officer_id ON patrol_logs(patrol_officer_id);
```

### security_incidents
```sql
CREATE TABLE security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id),
  reported_by UUID NOT NULL REFERENCES users(id),
  patrol_log_id UUID REFERENCES patrol_logs(id),
  incident_type VARCHAR(50) NOT NULL, -- 'theft', 'vandalism', 'disturbance', 'suspicious_activity', 'other'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  incident_date TIMESTAMP NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'reported', -- 'reported', 'investigating', 'resolved', 'closed'
  assigned_to UUID REFERENCES users(id),
  evidence_urls TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_security_incidents_neighborhood_id ON security_incidents(neighborhood_id);
CREATE INDEX idx_security_incidents_status ON security_incidents(status);
```

---

## 7. Notifications & Logging

### notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50), -- 'alert', 'announcement', 'order', 'waste', 'patrol'
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
```

### audit_logs
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## 8. Indexes Summary

Key indexes for performance optimization:
- User lookups: email, phone, is_active
- Neighborhood queries: country, leader_id, location
- Time-based queries: created_at, published_at, collection_date
- Status-based queries: status fields across all modules
- Foreign key relationships: all user_id, neighborhood_id references
- Geospatial queries: latitude/longitude combinations

---

## 9. Data Integrity Constraints

- Cascade delete for dependent records
- Unique constraints on email, phone, business names
- Check constraints for ratings (1-5), quantities (>0)
- Foreign key constraints with appropriate delete policies
- Timestamp tracking for audit trails

---

**Version**: 1.0  
**Last Updated**: May 2026  
**Database**: PostgreSQL 16+
