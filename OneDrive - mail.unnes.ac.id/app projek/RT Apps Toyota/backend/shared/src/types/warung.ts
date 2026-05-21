// Warung Warga Types

export enum WarungCommunityScope {
  RT_ONLY = 'rt_only',      // Visible only to residents in the same RT
  COMMUNITY = 'community',  // Visible to all residents in the same Muban
  ALL_RT = 'all_rt',        // Visible to all RTs in the system
}

export enum WarungStatus {
  PENDING = 'pending',       // Warung application submitted, awaiting approval
  APPROVED = 'approved',     // RT leader approved, shop is active
  REJECTED = 'rejected',     // RT leader rejected
  INACTIVE = 'inactive',     // Shop is closed
}

export enum WarungApprovalStatus {
  PENDING = 'pending',       // Awaiting RT leader review
  APPROVED = 'approved',     // Approved by RT leader
  REJECTED = 'rejected',     // Rejected by RT leader
}

export enum WarungProductCondition {
  NEW = 'new',               // Brand new items
  GOOD = 'good',             // Good condition, used items
  FAIR = 'fair',             // Fair condition, used items
  EXCELLENT = 'excellent',   // Excellent condition, used items
}

export enum WarungProductCategory {
  CLOTHING = 'clothing',
  FOOD = 'food',
  ELECTRONICS = 'electronics',
  HOUSEHOLD = 'household',
  OTHER = 'other',
}

export enum WarungOrderStatus {
  PENDING = 'pending',       // Order placed, awaiting confirmation
  CONFIRMED = 'confirmed',   // Seller confirmed the order
  PROCESSING = 'processing', // Preparing the order
  SHIPPED = 'shipped',       // Order is being delivered
  DELIVERED = 'delivered',   // Order completed
  CANCELLED = 'cancelled',   // Order cancelled
  REFUNDED = 'refunded',     // Order refunded
}

export enum WarungPaymentStatus {
  UNPAID = 'unpaid',         // Payment not made
  PAID = 'paid',             // Payment completed
  REFUNDED = 'refunded',     // Payment refunded
}

export interface Warung {
  id: string;
  owner_id: string;
  neighborhood_id: string;
  community_scope: WarungCommunityScope;
  shop_name: string;
  description?: string;
  category: WarungProductCategory;
  status: WarungStatus;
  approval_status: WarungApprovalStatus;
  approval_reason?: string;
  approved_by?: string;
  approval_date?: Date;
  validity_start_date: Date;
  validity_end_date: Date;
  operating_hours?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  logo_url?: string;
  is_active: boolean;
  rating: number;
  total_reviews: number;
  created_at: Date;
  updated_at: Date;
}

export interface WarungProduct {
  id: string;
  warung_id: string;
  name: string;
  description?: string;
  category: WarungProductCategory;
  subcategory?: string;
  brand?: string;
  condition: WarungProductCondition;
  price: number;
  currency: string;
  stock_quantity: number;
  image_url?: string;
  is_available: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface WarungOrder {
  id: string;
  order_number: string;
  buyer_id: string;
  buyer_neighborhood_id: string;
  seller_warung_id: string;
  seller_owner_id: string;
  total_amount: number;
  currency: string;
  status: WarungOrderStatus;
  payment_status: WarungPaymentStatus;
  payment_method?: string;
  delivery_address?: string;
  delivery_date?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface WarungOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface WarungReview {
  id: string;
  reviewer_id: string;
  warung_id: string;
  product_id?: string;
  rating: number;
  comment?: string;
  is_verified_purchase: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface WarungApprovalHistory {
  id: string;
  warung_id: string;
  previous_status?: string;
  new_status: string;
  approval_decision: 'approved' | 'rejected' | 'review_requested';
  decision_reason?: string;
  approved_by?: string;
  approved_at?: Date;
  created_by: string;
  created_at: Date;
}

export interface WarungApplication {
  id: string;
  applicant_id: string;
  applicant_neighborhood_id: string;
  warung_id?: string;
  application_number: string;
  shop_name: string;
  category?: string;
  description?: string;
  business_ownership_type: 'personal' | 'family' | 'partner';
  opening_date: Date;
  expected_daily_sales?: number;
  products_count?: number;
  documentation?: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  reviewer_comments?: string;
  reviewed_by?: string;
  reviewed_at?: Date;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface WarungServiceResponse<T> {
  data?: T;
  message?: string;
  errors?: any[];
  approval_history?: WarungApprovalHistory[];
}

export interface CreateWarungRequest {
  shop_name: string;
  description?: string;
  category: string;
  community_scope: string;
  operating_hours?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateWarungRequest {
  shop_name?: string;
  description?: string;
  category?: string;
  community_scope?: string;
  operating_hours?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  is_active?: boolean;
}

export interface CreateWarungProductRequest {
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  condition: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
}

export interface CreateWarungOrderRequest {
  buyer_id: string;
  buyer_neighborhood_id: string;
  seller_warung_id: string;
  items: {
    product_id: string;
    quantity: number;
  }[];
  delivery_address?: string;
  notes?: string;
  delivery_date?: Date;
}

export interface CreateWarungReviewRequest {
  warung_id: string;
  product_id?: string;
  rating: number;
  comment?: string;
}

export interface WarungAnalytics {
  total_warungs: number;
  active_warungs: number;
  pending_approval: number;
  total_products: number;
  total_orders: number;
  total_revenue: number;
  average_rating: number;
  by_category: Record<string, number>;
  by_scope: Record<string, number>;
}
