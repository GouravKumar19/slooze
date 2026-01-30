# Architecture Documentation

## System Overview

FoodHub is a full-stack food ordering application built with Next.js 14, featuring role-based access control (RBAC) and country-based data isolation.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT BROWSER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Login Page  │  │  Dashboard   │  │  Cart/Orders │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                            │                                         │
│              ┌─────────────┴─────────────┐                          │
│              │      React Contexts       │                          │
│              │  (AuthContext, CartContext)│                          │
│              └─────────────┬─────────────┘                          │
└────────────────────────────┼────────────────────────────────────────┘
                             │ HTTP + JWT
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       NEXT.JS API ROUTES                             │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    RBAC Middleware                            │   │
│  │  • JWT Verification                                          │   │
│  │  • Role Permission Check                                      │   │
│  │  • Country Access Validation                                  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                            │                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │   Auth   │  │Restaurants│  │  Orders  │  │ Payment Methods │   │
│  │   API    │  │    API   │  │   API    │  │      API        │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘   │
└────────────────────────────┬────────────────────────────────────────┘
                             │ Prisma Client
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         POSTGRESQL                                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │  Users  │  │Countries│  │Restaurants│ │  Orders │  │MenuItems│  │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Model

### Entity Relationship Diagram

```
Country (1) ─────< (N) User
    │                   │
    │                   │ (1)
    │                   ▼ (N)
    │               PaymentMethod
    │                   
Country (1) ─────< (N) Restaurant
                        │
                        │ (1)
                        ▼ (N)
                    MenuItem
                        │
                        │ (1)
                        ▼ (N)
                    OrderItem
                        │
                        │ (N)
                        ▼ (1)
                      Order ──────< User
                        │
                        └──────────< PaymentMethod
```

## RBAC Implementation

### Permission Matrix

```
┌───────────────────────┬───────┬─────────┬────────┐
│      Permission       │ Admin │ Manager │ Member │
├───────────────────────┼───────┼─────────┼────────┤
│ VIEW_RESTAURANTS      │   ✓   │    ✓    │   ✓    │
│ VIEW_MENU             │   ✓   │    ✓    │   ✓    │
│ CREATE_ORDER          │   ✓   │    ✓    │   ✓    │
│ ADD_ITEMS             │   ✓   │    ✓    │   ✓    │
│ CHECKOUT              │   ✓   │    ✓    │   ✗    │
│ CANCEL_ORDER          │   ✓   │    ✓    │   ✗    │
│ UPDATE_PAYMENT_METHOD │   ✓   │    ✗    │   ✗    │
└───────────────────────┴───────┴─────────┴────────┘
```

### Country-Based Access

```
┌────────────────────────────────────────────────┐
│              Country Access Rules               │
├────────────────────────────────────────────────┤
│ ADMIN:   Can access ALL countries              │
│ MANAGER: Can access ONLY their assigned country│
│ MEMBER:  Can access ONLY their assigned country│
└────────────────────────────────────────────────┘
```

## Authentication Flow

```
1. User selects account → POST /api/auth/login
2. Server generates JWT with:
   - userId
   - role
   - countryId
   - countryCode
3. Client stores JWT in localStorage
4. Subsequent requests include: Authorization: Bearer <token>
5. Server validates token on each request
```

## Request Flow Example

```
User Action: Add item to cart

1. [Frontend] Click "Add to Cart"
2. [CartContext] addToCart(menuItemId)
3. [API] POST /api/orders { menuItemId }
4. [Middleware] Verify JWT token
5. [API Route] 
   - Check CREATE_ORDER permission
   - Verify country access for menu item
   - Create/update draft order
6. [Database] Insert OrderItem
7. [Response] Return updated order
8. [CartContext] Refresh cart state
9. [UI] Update cart badge
```

## Key Design Decisions

### 1. JWT over Session
- Stateless authentication
- Easy to scale horizontally
- Contains role/country for quick access checks

### 2. Draft Orders as Cart
- Unified order model
- Easy to convert cart to order
- Maintains order history

### 3. Country-Based Isolation
- Implemented at API level
- Filtering happens in database queries
- UI respects backend restrictions

### 4. TailwindCSS
- Utility-first CSS
- Consistent design system
- Fast development
