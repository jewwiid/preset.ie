# API Documentation - Preset Platform

## 🌐 API Overview

Preset provides a comprehensive REST API built on Next.js API routes with Supabase backend. The API follows RESTful principles with clear resource-based URLs, standard HTTP methods, and consistent response formats.

## 🔐 Authentication

### **Authentication Methods**

#### **Supabase Auth Integration**
```typescript
// Client-side authentication
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Get session
const { data: { session } } = await supabase.auth.getSession();
```

#### **API Route Authentication**
```typescript
// API route authentication middleware
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Proceed with authenticated request
}
```

### **Authorization Levels**

#### **User Roles**
- **Talent**: Can apply to gigs, create showcases, message contributors
- **Contributor**: Can create gigs, review applications, book talent
- **Admin**: Can moderate content, manage users, access admin features

#### **Permission Matrix**
| Resource | Talent | Contributor | Admin |
|----------|--------|-------------|-------|
| Create Gig | ❌ | ✅ | ✅ |
| Apply to Gig | ✅ | ❌ | ✅ |
| View Applications | ❌ | ✅ (own gigs) | ✅ |
| Moderate Content | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |

## 📋 Core API Endpoints

### **Authentication Endpoints**

#### **POST /api/auth/signup**
Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "role": "talent",
  "displayName": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "talent",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

#### **POST /api/auth/signin**
Sign in with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "talent"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

### **User Profile Endpoints**

#### **GET /api/users/profile**
Get current user's profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "display_name": "John Doe",
  "handle": "johndoe",
  "avatar_url": "https://...",
  "bio": "Professional photographer",
  "city": "New York",
  "style_tags": ["portrait", "fashion"],
  "profile_completion_percentage": 85,
  "subscription_tier": "plus",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### **PUT /api/users/profile**
Update user profile.

**Request Body:**
```json
{
  "display_name": "John Doe",
  "bio": "Professional photographer specializing in portraits",
  "city": "New York",
  "style_tags": ["portrait", "fashion", "commercial"]
}
```

**Response:**
```json
{
  "success": true,
  "profile": {
    "id": "uuid",
    "display_name": "John Doe",
    "bio": "Professional photographer specializing in portraits",
    "city": "New York",
    "style_tags": ["portrait", "fashion", "commercial"],
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### **Gig Management Endpoints**

#### **GET /api/gigs**
Get list of published gigs with filtering.

**Query Parameters:**
```
?page=1&limit=20&location=New York&radius=10&comp_type=paid&status=published
```

**Response:**
```json
{
  "gigs": [
    {
      "id": "uuid",
      "title": "Fashion Portrait Shoot",
      "description": "Looking for a model for fashion portraits",
      "comp_type": "paid",
      "location": {
        "text": "New York, NY",
        "lat": 40.7128,
        "lng": -74.0060,
        "radius": 10
      },
      "date_time_window": {
        "start": "2024-01-15T10:00:00Z",
        "end": "2024-01-15T16:00:00Z"
      },
      "application_deadline": "2024-01-10T23:59:59Z",
      "max_applicants": 20,
      "usage_rights": "Portfolio use only",
      "safety_notes": "Public location, bring ID",
      "status": "published",
      "boost_level": 0,
      "owner": {
        "id": "uuid",
        "display_name": "Jane Smith",
        "avatar_url": "https://...",
        "rating": 4.8
      },
      "moodboard": {
        "id": "uuid",
        "title": "Fashion Inspiration",
        "items": [
          {
            "id": "uuid",
            "url": "https://...",
            "type": "character",
            "label": "model pose"
          }
        ]
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

#### **POST /api/gigs**
Create a new gig.

**Request Body:**
```json
{
  "title": "Fashion Portrait Shoot",
  "description": "Looking for a model for fashion portraits",
  "comp_type": "paid",
  "location": {
    "text": "New York, NY",
    "lat": 40.7128,
    "lng": -74.0060,
    "radius": 10
  },
  "date_time_window": {
    "start": "2024-01-15T10:00:00Z",
    "end": "2024-01-15T16:00:00Z"
  },
  "application_deadline": "2024-01-10T23:59:59Z",
  "max_applicants": 20,
  "usage_rights": "Portfolio use only",
  "safety_notes": "Public location, bring ID",
  "moodboard": {
    "title": "Fashion Inspiration",
    "items": [
      {
        "url": "https://example.com/image.jpg",
        "type": "character",
        "label": "model pose"
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "gig": {
    "id": "uuid",
    "title": "Fashion Portrait Shoot",
    "status": "draft",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### **GET /api/gigs/[id]**
Get specific gig details.

**Response:**
```json
{
  "id": "uuid",
  "title": "Fashion Portrait Shoot",
  "description": "Looking for a model for fashion portraits",
  "comp_type": "paid",
  "location": {
    "text": "New York, NY",
    "lat": 40.7128,
    "lng": -74.0060,
    "radius": 10
  },
  "date_time_window": {
    "start": "2024-01-15T10:00:00Z",
    "end": "2024-01-15T16:00:00Z"
  },
  "application_deadline": "2024-01-10T23:59:59Z",
  "max_applicants": 20,
  "usage_rights": "Portfolio use only",
  "safety_notes": "Public location, bring ID",
  "status": "published",
  "boost_level": 0,
  "owner": {
    "id": "uuid",
    "display_name": "Jane Smith",
    "avatar_url": "https://...",
    "rating": 4.8,
    "completed_gigs": 25
  },
  "moodboard": {
    "id": "uuid",
    "title": "Fashion Inspiration",
    "items": [
      {
        "id": "uuid",
        "url": "https://...",
        "type": "character",
        "label": "model pose"
      }
    ]
  },
  "applications_count": 5,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### **Application Endpoints**

#### **POST /api/gigs/[id]/apply**
Apply to a gig.

**Request Body:**
```json
{
  "note": "I'm interested in this shoot and have experience with fashion photography"
}
```

**Response:**
```json
{
  "success": true,
  "application": {
    "id": "uuid",
    "gig_id": "uuid",
    "applicant_id": "uuid",
    "note": "I'm interested in this shoot and have experience with fashion photography",
    "status": "pending",
    "applied_at": "2024-01-01T00:00:00Z"
  }
}
```

#### **GET /api/gigs/[id]/applications**
Get applications for a gig (contributor only).

**Response:**
```json
{
  "applications": [
    {
      "id": "uuid",
      "gig_id": "uuid",
      "applicant_id": "uuid",
      "note": "I'm interested in this shoot",
      "status": "pending",
      "applied_at": "2024-01-01T00:00:00Z",
      "applicant": {
        "id": "uuid",
        "display_name": "John Doe",
        "avatar_url": "https://...",
        "bio": "Professional model",
        "city": "New York",
        "style_tags": ["fashion", "portrait"],
        "rating": 4.5,
        "completed_gigs": 15
      }
    }
  ]
}
```

#### **PATCH /api/applications/[id]**
Update application status (contributor only).

**Request Body:**
```json
{
  "status": "shortlisted"
}
```

**Response:**
```json
{
  "success": true,
  "application": {
    "id": "uuid",
    "status": "shortlisted",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### **Messaging Endpoints**

#### **GET /api/gigs/[id]/messages**
Get messages for a gig.

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "gig_id": "uuid",
      "from_user_id": "uuid",
      "to_user_id": "uuid",
      "body": "Hi! I'm interested in this shoot",
      "attachments": [],
      "sent_at": "2024-01-01T00:00:00Z",
      "read_at": "2024-01-01T00:05:00Z",
      "sender": {
        "id": "uuid",
        "display_name": "John Doe",
        "avatar_url": "https://..."
      }
    }
  ]
}
```

#### **POST /api/gigs/[id]/messages**
Send a message.

**Request Body:**
```json
{
  "to_user_id": "uuid",
  "body": "Hi! I'm interested in this shoot",
  "attachments": []
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": "uuid",
    "gig_id": "uuid",
    "from_user_id": "uuid",
    "to_user_id": "uuid",
    "body": "Hi! I'm interested in this shoot",
    "attachments": [],
    "sent_at": "2024-01-01T00:00:00Z"
  }
}
```

### **Showcase Endpoints**

#### **POST /api/gigs/[id]/showcase**
Create a showcase from completed gig.

**Request Body:**
```json
{
  "media_ids": ["uuid1", "uuid2", "uuid3"],
  "caption": "Amazing fashion shoot in NYC",
  "tags": ["fashion", "portrait", "outdoor"]
}
```

**Response:**
```json
{
  "success": true,
  "showcase": {
    "id": "uuid",
    "gig_id": "uuid",
    "creator_id": "uuid",
    "talent_id": "uuid",
    "media_ids": ["uuid1", "uuid2", "uuid3"],
    "caption": "Amazing fashion shoot in NYC",
    "tags": ["fashion", "portrait", "outdoor"],
    "palette": ["#FF5733", "#33FF57", "#3357FF"],
    "approvals": [],
    "visibility": "private",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### **POST /api/showcases/[id]/approve**
Approve a showcase.

**Response:**
```json
{
  "success": true,
  "showcase": {
    "id": "uuid",
    "approvals": [
      {
        "user_id": "uuid",
        "approved_at": "2024-01-01T00:00:00Z"
      }
    ],
    "visibility": "public"
  }
}
```

### **Review Endpoints**

#### **POST /api/gigs/[id]/review**
Submit a review for a completed gig.

**Request Body:**
```json
{
  "reviewee_id": "uuid",
  "rating": 5,
  "tags": ["professional", "punctual", "creative"],
  "comment": "Great collaboration! Very professional and creative."
}
```

**Response:**
```json
{
  "success": true,
  "review": {
    "id": "uuid",
    "gig_id": "uuid",
    "reviewer_id": "uuid",
    "reviewee_id": "uuid",
    "rating": 5,
    "tags": ["professional", "punctual", "creative"],
    "comment": "Great collaboration! Very professional and creative.",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

## 💳 Subscription & Payment Endpoints

### **Stripe Integration**

#### **POST /api/subscriptions/create-checkout**
Create Stripe checkout session.

**Request Body:**
```json
{
  "tier": "plus",
  "success_url": "https://preset.ie/dashboard?success=true",
  "cancel_url": "https://preset.ie/pricing?canceled=true"
}
```

**Response:**
```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_..."
}
```

#### **POST /api/subscriptions/webhook**
Stripe webhook endpoint for subscription events.

**Headers:**
```
Stripe-Signature: t=1234567890,v1=signature
```

**Request Body:**
```json
{
  "type": "customer.subscription.updated",
  "data": {
    "object": {
      "id": "sub_...",
      "customer": "cus_...",
      "status": "active",
      "current_period_end": 1234567890
    }
  }
}
```

### **Credit Management**

#### **GET /api/credits/balance**
Get user's credit balance.

**Response:**
```json
{
  "current_balance": 25,
  "total_purchased": 50,
  "total_used": 25,
  "last_purchase": "2024-01-01T00:00:00Z"
}
```

#### **POST /api/credits/purchase**
Purchase credit package.

**Request Body:**
```json
{
  "package": "creative",
  "quantity": 1
}
```

**Response:**
```json
{
  "success": true,
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_...",
  "package": {
    "name": "Creative Bundle",
    "credits": 50,
    "price": 39.99
  }
}
```

## 🤖 AI Integration Endpoints

### **Image Enhancement**

#### **POST /api/ai/enhance**
Enhance an image using AI.

**Request Body:**
```json
{
  "image_url": "https://example.com/image.jpg",
  "prompt": "Make this portrait more dramatic",
  "enhancement_type": "portrait"
}
```

**Response:**
```json
{
  "success": true,
  "enhanced_image_url": "https://...",
  "credits_used": 1,
  "remaining_credits": 24,
  "processing_time": 2.5
}
```

#### **GET /api/ai/balance**
Get platform AI credit balance.

**Response:**
```json
{
  "platform_balance": 938,
  "user_capacity": 234,
  "provider": "nanobanana",
  "last_sync": "2024-01-01T00:00:00Z"
}
```

## 📊 Analytics Endpoints

### **User Analytics**

#### **GET /api/analytics/dashboard**
Get user dashboard analytics.

**Response:**
```json
{
  "profile_views": 45,
  "application_success_rate": 0.75,
  "showcase_views": 120,
  "average_rating": 4.8,
  "completed_gigs": 12,
  "response_time": 2.5,
  "profile_completion": 85
}
```

#### **GET /api/analytics/gigs**
Get gig performance analytics.

**Response:**
```json
{
  "total_gigs": 25,
  "published_gigs": 20,
  "completed_gigs": 15,
  "average_applications": 8.5,
  "conversion_rate": 0.75,
  "total_revenue": 1250.00
}
```

## 🚨 Error Handling

### **Error Response Format**

#### **Standard Error Response**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "timestamp": "2024-01-01T00:00:00Z",
    "request_id": "req_123456789"
  }
}
```

#### **HTTP Status Codes**
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **422**: Validation Error
- **429**: Rate Limited
- **500**: Internal Server Error

### **Common Error Codes**

#### **Authentication Errors**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### **Validation Errors**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      }
    ]
  }
}
```

#### **Rate Limiting**
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "retry_after": 60
  }
}
```

## 🔒 Rate Limiting

### **Rate Limit Headers**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### **Rate Limits by Endpoint**
- **Authentication**: 10 requests per minute
- **Gig Creation**: 5 requests per hour
- **Applications**: 20 requests per hour
- **Messages**: 50 requests per hour
- **AI Enhancement**: 10 requests per hour

## 📝 API Versioning

### **Version Strategy**
- **Current Version**: v1 (default)
- **Version Header**: `API-Version: v1`
- **URL Versioning**: `/api/v1/endpoint`
- **Backward Compatibility**: Maintained for 6 months

### **Version Migration**
```typescript
// Version detection
const apiVersion = request.headers.get('API-Version') || 'v1';

// Route handling
if (apiVersion === 'v1') {
  return handleV1Request(request);
} else if (apiVersion === 'v2') {
  return handleV2Request(request);
}
```

## 🧪 Testing

### **API Testing**

#### **Unit Tests**
```typescript
import { GET } from '@/app/api/gigs/route';

describe('/api/gigs', () => {
  it('should return gigs list', async () => {
    const request = new Request('http://localhost:3000/api/gigs');
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.gigs).toBeDefined();
  });
});
```

#### **Integration Tests**
```typescript
describe('Gig Management Flow', () => {
  it('should create, publish, and manage gig', async () => {
    // Create gig
    const createResponse = await fetch('/api/gigs', {
      method: 'POST',
      body: JSON.stringify(gigData)
    });
    
    // Publish gig
    const publishResponse = await fetch(`/api/gigs/${gigId}/publish`, {
      method: 'PATCH'
    });
    
    // Verify gig is published
    const getResponse = await fetch(`/api/gigs/${gigId}`);
    const gig = await getResponse.json();
    
    expect(gig.status).toBe('published');
  });
});
```

---

This comprehensive API documentation provides everything needed to integrate with Preset's backend services. The RESTful design ensures consistency and ease of use across all endpoints.
