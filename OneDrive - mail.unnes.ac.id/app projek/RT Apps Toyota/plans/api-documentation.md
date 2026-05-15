# Digital RT-Muban API Documentation

## Overview

This document defines the complete REST API structure for the Digital RT-Muban platform, following RESTful conventions and organized by functional modules.

---

## 1. API Base Configuration

### Base URL
```
https://api.rt-muban.example.com/v1
```

### Authentication
All endpoints require authentication via JWT Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Response Format
All responses follow this structure:
```json
{
  "success": true,
  "data": {},
  "message": "Optional success message",
  "error": null
}
```

Error responses:
```json
{
  "success": false,
  "data": null,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### HTTP Status Codes
- `200 OK` - Successful request
- `201 Created` - Resource created
- `204 No Content` - Successful deletion
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## 2. Authentication API

### Login
```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "roles": ["resident"]
    }
  }
}
```

### Register
```
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+6281234567890"
}
```

### Refresh Token
```
POST /auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Logout
```
POST /auth/logout
```

### Get Current User
```
GET /auth/me
```

---

## 3. User Management API

### Get User Profile
```
GET /users/profile
```

### Update User Profile
```
PUT /users/profile
```

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+6281234567890",
  "language_preference": "id"
}
```

### Get User Households
```
GET /users/households
```

### Get User Roles
```
GET /users/roles
```

### Update User Settings
```
PUT /users/settings
```

**Request Body:**
```json
{
  "notification_preferences": {
    "email": true,
    "push": true,
    "sms": false
  }
}
```

---

## 4. Neighborhood Management API

### Get Neighborhood Details
```
GET /neighborhoods/{id}
```

### List Neighborhoods
```
GET /neighborhoods
```

**Query Parameters:**
- `country` - Filter by country (Indonesia/Thailand)
- `type` - Filter by type (RT/Muban)
- `page` - Page number
- `limit` - Items per page

### Create Neighborhood
```
POST /neighborhoods
```

**Request Body:**
```json
{
  "name": "RT 01",
  "type": "RT",
  "country": "Indonesia",
  "province": "Central Java",
  "city": "Semarang",
  "district": "Semarang Utara",
  "sub_district": "Tambakrejo"
}
```

### Update Neighborhood
```
PUT /neighborhoods/{id}
```

### Get Neighborhood Announcements
```
GET /neighborhoods/{id}/announcements
```

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page
- `category` - Filter by category

### Create Announcement
```
POST /neighborhoods/{id}/announcements
```

**Request Body:**
```json
{
  "title": "Community Meeting",
  "content": "Join us for the monthly community meeting...",
  "category": "general",
  "priority": "normal",
  "published_at": "2026-05-20T10:00:00Z"
}
```

### Get Household Members
```
GET /households/{id}/members
```

### Add Household Member
```
POST /households/{id}/members
```

**Request Body:**
```json
{
  "user_id": "uuid",
  "relationship_to_head": "spouse"
}
```

---

## 5. Waste Banking API

### List Waste Categories
```
GET /waste-bank/categories
```

### Get Waste Collection Schedule
```
GET /waste-bank/schedule
```

**Query Parameters:**
- `neighborhood_id` - Filter by neighborhood
- `date_from` - Start date
- `date_to` - End date

### Schedule Collection
```
POST /waste-bank/schedule
```

**Request Body:**
```json
{
  "neighborhood_id": "uuid",
  "collection_date": "2026-05-20",
  "collection_time": "08:00",
  "location": "RT Community Center"
}
```

### Record Waste Deposit
```
POST /waste-bank/deposit
```

**Request Body:**
```json
{
  "waste_category_id": "uuid",
  "quantity": 2.5,
  "collection_id": "uuid"
}
```

### Get User Points
```
GET /waste-bank/points
```

### Get Points History
```
GET /waste-bank/points/history
```

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page

### List Recycling Centers
```
GET /waste-bank/recycling-centers
```

**Query Parameters:**
- `neighborhood_id` - Filter by neighborhood

---

## 6. Marketplace API

### List Businesses
```
GET /marketplace/businesses
```

**Query Parameters:**
- `neighborhood_id` - Filter by neighborhood
- `category` - Filter by category
- `search` - Search query
- `page` - Page number
- `limit` - Items per page

### Get Business Details
```
GET /marketplace/businesses/{id}
```

### Create Business
```
POST /marketplace/businesses
```

**Request Body:**
```json
{
  "business_name": "Toko Sembako Jaya",
  "description": "Local grocery store",
  "category": "grocery",
  "phone_number": "+6281234567890",
  "address": "Jl. Merdeka No. 123"
}
```

### List Products
```
GET /marketplace/products
```

**Query Parameters:**
- `business_id` - Filter by business
- `category` - Filter by category
- `search` - Search query
- `page` - Page number
- `limit` - Items per page

### Create Product
```
POST /marketplace/products
```

**Request Body:**
```json
{
  "name": "Beras Premium",
  "description": "High quality rice",
  "category": "food",
  "price": 15000,
  "stock_quantity": 100
}
```

### Create Order
```
POST /marketplace/orders
```

**Request Body:**
```json
{
  "seller_id": "uuid",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 5
    }
  ],
  "delivery_address": "Jl. Merdeka No. 45"
}
```

### Get Order Status
```
GET /marketplace/orders/{id}
```

### List Orders
```
GET /marketplace/orders
```

**Query Parameters:**
- `status` - Filter by status
- `page` - Page number
- `limit` - Items per page

### Leave Review
```
POST /marketplace/reviews
```

**Request Body:**
```json
{
  "business_id": "uuid",
  "product_id": "uuid",
  "rating": 5,
  "comment": "Great service!"
}
```

---

## 7. SOS & Emergency API

### List Emergency Contacts
```
GET /sos/contacts
```

### Add Emergency Contact
```
POST /sos/contacts
```

**Request Body:**
```json
{
  "contact_name": "Family Member",
  "relationship": "Spouse",
  "phone_number": "+6281234567890"
}
```

### Send SOS Alert
```
POST /sos/alerts
```

**Request Body:**
```json
{
  "neighborhood_id": "uuid",
  "alert_type": "medical",
  "title": "Medical Emergency",
  "description": "Person collapsed at home",
  "location": "Jl. Merdeka No. 45",
  "latitude": -6.992743,
  "longitude": 110.421977
}
```

### Get Active Alerts
```
GET /sos/alerts
```

**Query Parameters:**
- `status` - Filter by status
- `severity` - Filter by severity

### Acknowledge Alert
```
POST /sos/alerts/{id}/acknowledge
```

### Report Incident
```
POST /sos/incidents
```

**Request Body:**
```json
{
  "neighborhood_id": "uuid",
  "incident_type": "theft",
  "title": "Bicycle Theft",
  "description": "Bicycle stolen from parking area",
  "location": "RT Parking Area",
  "latitude": -6.992743,
  "longitude": 110.421977
}
```

---

## 8. Patrol API

### List Patrol Schedules
```
GET /patrol/schedules
```

**Query Parameters:**
- `neighborhood_id` - Filter by neighborhood
- `is_active` - Filter by active status

### Create Patrol Schedule
```
POST /patrol/schedules
```

**Request Body:**
```json
{
  "schedule_name": "Night Patrol",
  "description": "Night security patrol",
  "start_date": "2026-05-16",
  "is_recurring": true,
  "recurrence_pattern": "daily"
}
```

### List Patrol Shifts
```
GET /patrol/shifts
```

**Query Parameters:**
- `schedule_id` - Filter by schedule
- `shift_date` - Filter by date
- `status` - Filter by status

### Create Patrol Shift
```
POST /patrol/shifts
```

**Request Body:**
```json
{
  "schedule_id": "uuid",
  "shift_date": "2026-05-16",
  "shift_start_time": "20:00",
  "shift_end_time": "06:00",
  "assigned_to": "uuid"
}
```

### Log Patrol Activity
```
POST /patrol/logs
```

**Request Body:**
```json
{
  "shift_id": "uuid",
  "patrol_officer_id": "uuid",
  "location": "RT Area",
  "latitude": -6.992743,
  "longitude": 110.421977,
  "notes": "Normal patrol, no incidents"
}
```

### Report Security Incident
```
POST /patrol/incidents
```

**Request Body:**
```json
{
  "neighborhood_id": "uuid",
  "patrol_log_id": "uuid",
  "incident_type": "disturbance",
  "title": "Loud Noise",
  "description": "Neighbors arguing late at night",
  "location": "Jl. Merdeka",
  "latitude": -6.992743,
  "longitude": 110.421977
}
```

---

## 9. Notification API

### List Notifications
```
GET /notifications
```

**Query Parameters:**
- `is_read` - Filter by read status
- `page` - Page number
- `limit` - Items per page

### Mark as Read
```
PUT /notifications/{id}/read
```

### Mark All as Read
```
PUT /notifications/read-all
```

### Get Notification Preferences
```
GET /notifications/preferences
```

### Update Notification Preferences
```
PUT /notifications/preferences
```

**Request Body:**
```json
{
  "email": true,
  "push": true,
  "sms": false
}
```

---

## 10. File Upload API

### Upload Profile Picture
```
POST /upload/profile-picture
```

**Form Data:**
- `file` - Image file (max 2MB)

### Upload Announcement Image
```
POST /upload/announcement
```

**Form Data:**
- `file` - Image file (max 5MB)
- `neighborhood_id` - UUID

### Upload Business Logo
```
POST /upload/business-logo
```

**Form Data:**
- `file` - Image file (max 5MB)
- `business_id` - UUID

### Upload Product Image
```
POST /upload/product-image
```

**Form Data:**
- `file` - Image file (max 5MB)
- `product_id` - UUID

---

## 11. Search API

### Global Search
```
GET /search
```

**Query Parameters:**
- `query` - Search query
- `type` - Filter by type (business, product, resident)
- `neighborhood_id` - Filter by neighborhood
- `page` - Page number
- `limit` - Items per page

---

## 12. Statistics & Analytics API

### Neighborhood Statistics
```
GET /statistics/neighborhood/{id}
```

### User Activity Statistics
```
GET /statistics/user/activities
```

**Query Parameters:**
- `date_from` - Start date
- `date_to` - End date

### Waste Banking Statistics
```
GET /statistics/waste-bank
```

### Marketplace Statistics
```
GET /statistics/marketplace
```

---

## 13. Error Codes

| Code | Description |
|------|-------------|
| AUTH_001 | Invalid credentials |
| AUTH_002 | Token expired |
| AUTH_003 | Invalid token |
| VALID_001 | Invalid input data |
| VALID_002 | Required field missing |
| VALID_003 | Invalid email format |
| VALID_004 | Invalid phone number |
| NOT_FOUND_001 | Resource not found |
| NOT_FOUND_002 | User not found |
| NOT_FOUND_003 | Neighborhood not found |
| FORBIDDEN_001 | Insufficient permissions |
| FORBIDDEN_002 | Access denied |
| RATE_LIMIT_001 | Too many requests |
| SERVER_001 | Internal server error |
| SERVER_002 | Database error |
| SERVER_003 | External service error |

---

**Version**: 1.0  
**Last Updated**: May 2026  
**API Version**: v1
