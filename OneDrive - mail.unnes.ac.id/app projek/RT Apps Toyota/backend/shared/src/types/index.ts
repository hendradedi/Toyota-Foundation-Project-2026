// Common types for RT-Muban backend services

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  message?: string;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName?: string;
  profilePictureUrl?: string;
  languagePreference: string;
  timezone: string;
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  createdAt: Date;
}

export interface Neighborhood {
  id: string;
  name: string;
  type: 'RT' | 'Muban';
  country: string;
  province?: string;
  city?: string;
  district?: string;
  subDistrict?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  totalHouseholds: number;
  leaderId?: string;
  description?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Household {
  id: string;
  neighborhoodId: string;
  householdNumber: string;
  address: string;
  latitude?: number;
  longitude?: number;
  headOfHouseholdId?: string;
  totalMembers: number;
  phoneNumber?: string;
  email?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WasteCategory {
  id: string;
  name: string;
  description?: string;
  unitOfMeasurement: string;
  pointsPerUnit: number;
  isActive: boolean;
  createdAt: Date;
}

export interface Business {
  id: string;
  ownerId: string;
  neighborhoodId: string;
  businessName: string;
  description?: string;
  category: string;
  logoUrl?: string;
  phoneNumber?: string;
  email?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  operatingHours?: string;
  isVerified: boolean;
  isActive: boolean;
  rating: number;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmergencyAlert {
  id: string;
  neighborhoodId: string;
  createdById: string;
  alertType: string;
  title: string;
  description: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  respondersCount: number;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface PatrolSchedule {
  id: string;
  neighborhoodId: string;
  scheduleName: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  isRecurring: boolean;
  recurrencePattern?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  notificationType: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}
