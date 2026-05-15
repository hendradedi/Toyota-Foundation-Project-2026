# Backend API Testing Guide

## Quick Start

### 1. Start Development Server
```bash
cd backend
npm install
npm run dev
```

The API will be available at: `http://localhost:3000/api/v1`

### 2. Health Check
```bash
curl http://localhost:3000/health
```

### 3. API Documentation
Visit: `http://localhost:3000/api-docs` (Swagger UI)

---

## Demo Users for Testing

These users are automatically created on first startup:

| Email | Password | Role |
|-------|----------|------|
| admin@rtmuban.local | AdminPassword@123 | admin |
| leader@rtmuban.local | LeaderPassword@123 | rt_leader |
| resident@rtmuban.local | ResidentPassword@123 | resident |

---

## Authentication Flow

### Step 1: Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@rtmuban.local",
    "password": "AdminPassword@123"
  }'
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
      "email": "admin@rtmuban.local",
      "first_name": "Admin",
      "roles": ["admin"]
    }
  },
  "message": "Login successful"
}
```

### Step 2: Use Access Token
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### Step 3: Refresh Token
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

### Step 4: Logout
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

---

## Testing Each Module

### 1. User Management

**Get Profile:**
```bash
curl -X GET http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

**Update Profile:**
```bash
curl -X PUT http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Updated",
    "phone": "+6281234567890",
    "language_preference": "id"
  }'
```

**Get User Roles:**
```bash
curl -X GET http://localhost:3000/api/v1/users/roles \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### 2. Neighborhood Management

**List Neighborhoods:**
```bash
curl -X GET "http://localhost:3000/api/v1/neighborhoods?country=Indonesia&type=RT&page=1&limit=10" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

**Create Neighborhood (admin only):**
```bash
curl -X POST http://localhost:3000/api/v1/neighborhoods \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "RT 01",
    "type": "RT",
    "country": "Indonesia",
    "province": "Central Java",
    "city": "Semarang",
    "district": "Semarang Utara",
    "sub_district": "Tambakrejo"
  }'
```

**Get Announcements:**
```bash
curl -X GET "http://localhost:3000/api/v1/neighborhoods/NEIGHBORHOOD_ID/announcements?page=1&limit=10" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

**Create Announcement (rt_leader only):**
```bash
curl -X POST http://localhost:3000/api/v1/neighborhoods/NEIGHBORHOOD_ID/announcements \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Community Meeting",
    "content": "Join us for the monthly community meeting",
    "category": "event",
    "priority": "normal"
  }'
```

### 3. Waste Bank

**List Categories:**
```bash
curl -X GET http://localhost:3000/api/v1/waste-bank/categories \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

**Get Collection Schedules:**
```bash
curl -X GET "http://localhost:3000/api/v1/waste-bank/schedule?neighborhood_id=NEIGHBORHOOD_ID&page=1" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

**Record Waste Deposit:**
```bash
curl -X POST http://localhost:3000/api/v1/waste-bank/deposit \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "waste_category_id": "CATEGORY_ID",
    "quantity": 2.5,
    "collection_id": "COLLECTION_ID"
  }'
```

**Get User Points:**
```bash
curl -X GET http://localhost:3000/api/v1/waste-bank/points \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### 4. Marketplace

**List Businesses:**
```bash
curl -X GET "http://localhost:3000/api/v1/marketplace/businesses?category=grocery&search=store&page=1&limit=10" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

**Create Business:**
```bash
curl -X POST http://localhost:3000/api/v1/marketplace/businesses \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "business_name": "Toko Sembako Jaya",
    "description": "Local grocery store",
    "category": "grocery",
    "phone_number": "+6281234567890",
    "address": "Jl. Merdeka No. 123"
  }'
```

**Create Product (business_owner only):**
```bash
curl -X POST http://localhost:3000/api/v1/marketplace/products \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": "BUSINESS_ID",
    "name": "Beras Premium",
    "description": "High quality rice",
    "category": "food",
    "price": 15000,
    "stock_quantity": 100
  }'
```

### 5. SOS & Emergency

**Add Emergency Contact:**
```bash
curl -X POST http://localhost:3000/api/v1/sos/contacts \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contact_name": "Family Member",
    "relationship": "Spouse",
    "phone_number": "+6281234567890"
  }'
```

**Send SOS Alert:**
```bash
curl -X POST http://localhost:3000/api/v1/sos/alerts \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "neighborhood_id": "NEIGHBORHOOD_ID",
    "alert_type": "medical",
    "title": "Medical Emergency",
    "description": "Person collapsed at home",
    "location": "Jl. Merdeka No. 45",
    "latitude": -6.992743,
    "longitude": 110.421977
  }'
```

**Get Active Alerts:**
```bash
curl -X GET "http://localhost:3000/api/v1/sos/alerts?status=active&neighborhood_id=NEIGHBORHOOD_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### 6. Patrol

**List Patrol Schedules:**
```bash
curl -X GET "http://localhost:3000/api/v1/patrol/schedules?neighborhood_id=NEIGHBORHOOD_ID&is_active=true" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

**Create Patrol Schedule (admin/rt_leader only):**
```bash
curl -X POST http://localhost:3000/api/v1/patrol/schedules \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "neighborhood_id": "NEIGHBORHOOD_ID",
    "schedule_name": "Night Patrol",
    "description": "Night security patrol",
    "start_date": "2026-05-16",
    "is_recurring": true,
    "recurrence_pattern": "daily"
  }'
```

**Log Patrol Activity (security_personnel only):**
```bash
curl -X POST http://localhost:3000/api/v1/patrol/logs \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shift_id": "SHIFT_ID",
    "patrol_officer_id": "OFFICER_ID",
    "location": "RT Area",
    "latitude": -6.992743,
    "longitude": 110.421977,
    "notes": "Normal patrol, no incidents"
  }'
```

---

## Error Handling

### Authorization Error (Unauthorized)
```json
{
  "success": false,
  "data": null,
  "message": "Access token is required",
  "error": {
    "code": "AUTH_002",
    "details": {}
  }
}
```

### Permission Denied
```json
{
  "success": false,
  "data": null,
  "message": "Insufficient permissions to access this resource",
  "error": {
    "code": "AUTH_006",
    "details": {
      "required_roles": ["admin"],
      "user_roles": ["resident"]
    }
  }
}
```

### Validation Error
```json
{
  "success": false,
  "data": null,
  "message": "Validation error",
  "error": {
    "code": "VALID_001",
    "details": [
      {
        "value": "invalid-email",
        "msg": "Invalid email format",
        "param": "email",
        "location": "body"
      }
    ]
  }
}
```

---

## Tools Recommended

1. **Postman** - Full-featured API testing
2. **Insomnia** - REST client
3. **curl** - Command line testing
4. **Thunder Client** - VS Code extension
5. **Swagger UI** - Built-in at `/api-docs`

---

## Troubleshooting

### Database Connection Issues
```bash
# Check database connection
psql -h localhost -U postgres -d rt_muban -c "SELECT 1;"
```

### Port Already in Use
```bash
# Change port in .env file
PORT=3001
```

### JWT Token Expired
- Use the refresh token endpoint to get a new access token
- Access tokens expire after 1 hour by default

### Role-Based Access Denied
- Check user roles: `GET /users/roles`
- Switch to admin user for admin-only operations
- Contact administrator to change user role

---

## Performance Testing

### Load Testing with Apache Bench
```bash
# Test with 100 concurrent requests
ab -n 1000 -c 100 http://localhost:3000/api/v1/neighborhoods

# With authentication
ab -n 1000 -c 100 -H "Authorization: Bearer TOKEN" http://localhost:3000/api/v1/auth/me
```

### Rate Limiting Test
```bash
# Should receive 429 Too Many Requests after exceeding limit
for i in {1..150}; do curl http://localhost:3000/api/v1/neighborhoods; done
```

---

## Logs

### Check Application Logs
```bash
# Logs are printed to console in development mode
npm run dev

# Or check log files if configured
tail -f logs/app.log
```

---

**Happy Testing! 🚀**
