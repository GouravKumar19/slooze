# FoodHub - Team Food Ordering Application

A full-stack food ordering application with Role-Based Access Control (RBAC) and country-based data isolation.

## 🍔 Features

- **View Restaurants & Menu Items** - Browse restaurants and their menus
- **Create Orders** - Add items to cart
- **Checkout & Pay** - Place orders with payment
- **Cancel Orders** - Cancel pending orders
- **Payment Management** - Manage payment methods (Admin only)
- **Country-Based Isolation** - Users only see data from their region

## 👥 Users & Roles

| User | Role | Country | Access |
|------|------|---------|--------|
| Nick Fury | Admin | America | Full access to all features and regions |
| Captain Marvel | Manager | India | All features except payment settings, India only |
| Captain America | Manager | America | All features except payment settings, America only |
| Thanos | Member | India | View & add to cart only, India only |
| Thor | Member | India | View & add to cart only, India only |
| Travis | Member | America | View & add to cart only, America only |

## 🔐 RBAC Permissions

| Function | Admin | Manager | Member |
|----------|:-----:|:-------:|:------:|
| View Restaurants & Menu | ✅ | ✅ | ✅ |
| Create Order (Add Items) | ✅ | ✅ | ✅ |
| Checkout & Pay | ✅ | ✅ | ❌ |
| Cancel Order | ✅ | ✅ | ❌ |
| Update Payment Method | ✅ | ❌ | ❌ |

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT
- **Styling**: TailwindCSS

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd su
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create a `.env` file in the root directory:

```env
# Database - PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/food_ordering?schema=public"

# JWT Secret (change in production!)
JWT_SECRET="your-super-secret-jwt-key"
```

### 4. Set up the database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed the database with sample data
npm run db:seed
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Usage

1. **Login**: Select a user from the dropdown to login (demo mode - no password required)
2. **Browse**: View restaurants based on your region
3. **Add to Cart**: Click "Add to Cart" on menu items
4. **Checkout**: Go to cart and place order (Manager/Admin only)
5. **View Orders**: Check order history and cancel if needed
6. **Settings**: Manage payment methods (Admin only)

## 📂 Project Structure

```
src/
├── app/
│   ├── api/                    # API Routes
│   │   ├── auth/               # Authentication endpoints
│   │   ├── restaurants/        # Restaurant endpoints
│   │   ├── orders/             # Order endpoints
│   │   ├── cart/               # Cart endpoints
│   │   └── payment-methods/    # Payment endpoints
│   ├── dashboard/              # Dashboard pages
│   │   ├── restaurants/        # Restaurant browsing
│   │   ├── cart/               # Shopping cart
│   │   ├── orders/             # Order history
│   │   └── settings/           # Payment settings
│   ├── login/                  # Login page
│   ├── globals.css             # Global styles
│   └── layout.tsx              # Root layout
├── context/
│   ├── AuthContext.tsx         # Authentication state
│   └── CartContext.tsx         # Cart state
├── lib/
│   ├── auth.ts                 # JWT utilities
│   ├── prisma.ts               # Prisma client
│   └── rbac.ts                 # Permission utilities
└── prisma/
    ├── schema.prisma           # Database schema
    └── seed.ts                 # Seed data
```

## 🔌 API Endpoints

See [API_COLLECTION.md](./API_COLLECTION.md) for detailed API documentation.

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |

## 🎨 Design Highlights

- **Dark Theme**: Modern dark UI with vibrant accent colors
- **Glassmorphism**: Frosted glass effects for cards
- **Animations**: Smooth transitions and micro-interactions
- **Responsive**: Works on all screen sizes
- **Accessible**: Proper ARIA labels and keyboard navigation

## 🔒 Security Features

- JWT-based authentication
- Role-based access control at API level
- Country-based data isolation
- Input validation and sanitization

## 📝 License

MIT
