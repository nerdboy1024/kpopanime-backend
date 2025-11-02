# K-pop Anime Shop - Services Stack

Complete architecture overview and component mapping for the K-pop Anime Shop application.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Static HTML/CSS/JS)                              │
│  ├── Public Pages                                           │
│  ├── Admin Panel                                            │
│  └── Authentication UI                                      │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  Backend API (Node.js/Express)                              │
│  ├── REST API Endpoints                                     │
│  ├── Authentication Middleware                              │
│  ├── File Upload Handler                                    │
│  └── Business Logic                                         │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATA LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  Firebase Services                                           │
│  ├── Firestore (Database)                                   │
│  ├── Firebase Auth (User Management)                        │
│  ├── Firebase Storage (File Storage)                        │
│  └── Firebase Admin SDK                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Frontend Services

### 1.1 Core Pages
| Component | Location | Purpose | Dependencies |
|-----------|----------|---------|--------------|
| **Home Page** | `/frontend/public/index.html` | Landing page with shop showcase | Firebase Config, Script-Firebase.js |
| **Product Details** | `/frontend/public/product.html` | Individual product view | Product.js, Firebase |
| **Shopping Cart** | `/frontend/public/cart.html` | Cart management | Cart.js, LocalStorage |
| **Authentication** | `/frontend/public/auth.html` | Login/Signup | Auth.js, Firebase Auth |
| **User Preferences** | `/frontend/public/preferences.html` | User profile settings | Preferences.js, Firebase |
| **Order Confirmation** | `/frontend/public/order-confirmation.html` | Post-checkout success | Cart cleanup |
| **Test Checkout** | `/frontend/public/test-checkout.html` | Payment testing | Square SDK |

### 1.2 Admin Panel
| Component | Location | Purpose | Dependencies |
|-----------|----------|---------|--------------|
| **Admin Dashboard** | `/frontend/public/admin/index.html` | Main admin interface | Admin.js, Firebase |
| **Admin Core** | `/frontend/public/admin/admin.js` | Admin logic & UI management | Firebase Admin SDK |
| **User Management** | `/frontend/public/admin/admin-users.js` | User administration | Auth, Firestore |
| **Admin Styles** | `/frontend/public/admin/admin.css` | Admin UI styling | - |

### 1.3 JavaScript Services
| Service | Location | Purpose | Key Features |
|---------|----------|---------|--------------|
| **Firebase Config** | `/frontend/public/firebase-config.js` | Firebase initialization | Auth, Firestore, Storage exports |
| **Main Script** | `/frontend/public/script.js` | Core frontend logic | Product display, cart, navigation |
| **Firebase Script** | `/frontend/public/script-firebase.js` | Firestore integration | Real-time data loading |
| **Cart Manager** | `/frontend/public/cart.js` | Shopping cart operations | LocalStorage persistence |
| **Product Handler** | `/frontend/public/product.js` | Product page logic | Firebase queries, cart integration |
| **Auth Handler** | `/frontend/public/auth.js` | Authentication flow | Email/Password, Google OAuth |
| **Preferences Manager** | `/frontend/public/preferences.js` | User settings | Profile management |
| **Profile Prompt** | `/frontend/public/profile-prompt.js` | Progressive profiling | Modal UI, data collection |
| **YouTube Integration** | `/frontend/public/youtube-integration.js` | Video content display | RSS feed parsing |

### 1.4 PHP Services
| Service | Location | Purpose | Security |
|---------|----------|---------|----------|
| **Image Upload API** | `/frontend/api/upload.php` | File upload handler | Firebase token verification, file validation |
| **YouTube Feed Proxy** | `/frontend/api/youtube-feed.php` | RSS feed proxy | CORS bypass |
| **API Security Rules** | `/frontend/api/.htaccess` | Access control | POST-only, file restrictions |

---

## 2. Backend Services (Node.js/Express)

### 2.1 Core Server
| Component | Location | Purpose |
|-----------|----------|---------|
| **Main Server** | `/backend/server.js` | Express app, routing, middleware |
| **Firebase Config** | `/backend/config/firebase.js` | Admin SDK initialization |
| **Environment Config** | `/backend/.env` | Environment variables |

### 2.2 API Routes
| Route | File | Endpoints | Purpose |
|-------|------|-----------|---------|
| **Products** | `/backend/routes/products.js` | `/api/products/*` | Product CRUD operations |
| **Categories** | `/backend/routes/categories.js` | `/api/categories/*` | Category management |
| **Blog** | `/backend/routes/blog.js` | `/api/blog/*` | Blog post operations |
| **Orders** | `/backend/routes/orders.js` | `/api/orders/*` | Order processing |
| **Auth** | `/backend/routes/auth.js` | `/api/auth/*` | User authentication |
| **Users** | `/backend/routes/users.js` | `/api/users/*` | User management |
| **Admin** | `/backend/routes/admin.js` | `/api/admin/*` | Admin operations |

### 2.3 Utility Scripts
| Script | Location | Purpose | When to Run |
|--------|----------|---------|-------------|
| **Seed Firestore** | `/backend/scripts/seed-firestore.js` | Master data seeding | Initial setup |
| **Seed Categories** | `/backend/scripts/seed-categories.js` | Populate categories | Setup/Reset |
| **Seed Products** | `/backend/scripts/seed-products.js` | Populate products | Setup/Reset |
| **Seed Blog** | `/backend/scripts/seed-blog.js` | Populate blog posts | Setup/Reset |
| **Create Admin** | `/backend/scripts/create-admin.js` | Create admin user | User setup |
| **Test Firebase** | `/backend/scripts/test-firebase.js` | Connection testing | Troubleshooting |
| **Seed Roles** | `/backend/seed-roles.js` | Initialize user roles | Initial setup |

### 2.4 Database Schema
| File | Purpose |
|------|---------|
| `/backend/database/schema.sql` | PostgreSQL schema (legacy reference) |

---

## 3. Third-Party Services

### 3.1 Firebase Services

#### Firebase Authentication
- **Purpose**: User authentication and authorization
- **Methods**: Email/Password, Google OAuth
- **Features**:
  - User registration and login
  - Token-based authentication
  - Custom claims for roles (admin, customer, etc.)
  - Password reset

#### Firestore Database
- **Purpose**: NoSQL document database
- **Collections**:

| Collection | Document Structure | Indexes |
|------------|-------------------|---------|
| **users** | `{ email, displayName, role, preferences, tags, createdAt }` | email, role |
| **products** | `{ name, slug, price, categoryId, images, stock, isActive }` | slug, categoryId, isActive |
| **categories** | `{ name, slug, description, icon }` | slug |
| **blog_posts** | `{ title, slug, content, authorId, isPublished }` | slug, isPublished |
| **orders** | `{ orderNumber, userId, items, total, status }` | orderNumber, userId, status |

#### Firebase Storage
- **Purpose**: File storage for images
- **Buckets**:
  - Product images
  - Blog post images
  - User uploads

#### Firebase Admin SDK
- **Purpose**: Server-side Firebase operations
- **Features**:
  - User management
  - Custom token generation
  - Database operations with admin privileges

### 3.2 External Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| **Square Payments** | Payment processing | Integration ready |
| **Printful** | Print-on-demand fulfillment | Optional integration |
| **YouTube Data API** | Video feed integration | RSS-based (no API key needed) |

---

## 4. Data Flow

### 4.1 User Authentication Flow
```
User Login Request
    ↓
Frontend (auth.js)
    ↓
Firebase Auth SDK
    ↓
[Authentication]
    ↓
ID Token Generated
    ↓
Store in LocalStorage
    ↓
Include in API Requests (Bearer Token)
    ↓
Backend Middleware Verification
    ↓
Firebase Admin SDK Validates Token
    ↓
Extract User Claims (role, uid)
    ↓
Authorize Request
```

### 4.2 Product Display Flow
```
Page Load
    ↓
Frontend (script-firebase.js)
    ↓
Query Firestore (products collection)
    ↓
Filter: isActive = true
    ↓
Order by: createdAt desc
    ↓
Load Product Data
    ↓
Render Product Cards
    ↓
User Interaction (Add to Cart)
    ↓
Update LocalStorage (kpopanime_cart)
    ↓
Update Cart Count UI
```

### 4.3 Order Processing Flow
```
User Clicks Checkout
    ↓
Load Cart from LocalStorage
    ↓
Frontend sends order data to Backend
    ↓
Backend validates request
    ↓
Create Order Document in Firestore
    ↓
Process Payment (Square)
    ↓
Update Order Status
    ↓
Send Confirmation Email
    ↓
Clear Cart (LocalStorage)
    ↓
Redirect to Order Confirmation
```

### 4.4 Admin Content Management Flow
```
Admin Login
    ↓
Verify Admin Role (Firebase Custom Claims)
    ↓
Access Admin Panel
    ↓
Create/Edit Product
    ↓
Upload Images (upload.php)
    ↓
Validate Firebase Token
    ↓
Store in Firebase Storage
    ↓
Save Product Data to Firestore
    ↓
Real-time Update on Frontend
```

---

## 5. Storage Strategy

### 5.1 Client-Side Storage (Browser)

| Storage Type | Key | Purpose | Lifespan |
|--------------|-----|---------|----------|
| **LocalStorage** | `authToken` | Firebase ID token | Until logout |
| **LocalStorage** | `userId` | Current user ID | Until logout |
| **LocalStorage** | `kpopanime_cart` | Shopping cart items | Persistent |
| **LocalStorage** | `kpopanime_wishlist` | Wishlist items | Persistent |
| **SessionStorage** | `profilePromptShown` | Profile prompt state | Session only |

### 5.2 Server-Side Storage

| Storage Type | Location | Purpose |
|--------------|----------|---------|
| **Firebase Storage** | `/products/*` | Product images |
| **Firebase Storage** | `/blog/*` | Blog post images |
| **Firestore** | All collections | Application data |
| **Local Files** | `/backend/uploads/*` | Temporary uploads (dev) |
| **Service Account** | `/backend/serviceAccountKey.json` | Firebase admin credentials |

---

## 6. Security Layers

### 6.1 Authentication & Authorization
```
┌─────────────────────────────────────────┐
│ Layer 1: Firebase Authentication       │
│ - Email/Password validation             │
│ - Google OAuth                          │
│ - Token generation                      │
└─────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────┐
│ Layer 2: Custom Claims                 │
│ - Role assignment (admin/customer)      │
│ - Permission levels                     │
└─────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────┐
│ Layer 3: Backend Middleware            │
│ - Token verification                    │
│ - Role-based access control (RBAC)     │
│ - Request validation                    │
└─────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────┐
│ Layer 4: Firestore Security Rules      │
│ - Document-level permissions            │
│ - Field-level validation                │
└─────────────────────────────────────────┘
```

### 6.2 Security Measures

| Component | Security Feature |
|-----------|-----------------|
| **API Endpoints** | JWT token validation, CORS restrictions |
| **File Uploads** | Type validation, size limits, virus scanning ready |
| **User Data** | Hashed passwords, encrypted tokens |
| **Admin Panel** | Role verification, audit logging |
| **Environment Variables** | Secret management, .env exclusion |
| **HTTPS** | SSL/TLS encryption for all traffic |

---

## 7. API Endpoints Reference

### 7.1 Public Endpoints (No Auth Required)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/products` | List all active products |
| `GET` | `/api/products/:slug` | Get product by slug |
| `GET` | `/api/categories` | List all categories |
| `GET` | `/api/blog` | List published blog posts |
| `GET` | `/api/blog/:slug` | Get blog post by slug |
| `GET` | `/api/health` | Server health check |
| `POST` | `/api/auth/register` | User registration |
| `POST` | `/api/auth/login` | User login |
| `POST` | `/api/auth/google` | Google OAuth login |

### 7.2 Authenticated Endpoints (User Token Required)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/users/me` | Get current user profile |
| `PUT` | `/api/users/me` | Update user profile |
| `GET` | `/api/users/me/preferences` | Get user preferences |
| `PUT` | `/api/users/me/preferences` | Update preferences |
| `GET` | `/api/users/me/orders` | Get user's orders |
| `POST` | `/api/orders` | Create new order |
| `GET` | `/api/orders/:id` | Get order details |

### 7.3 Admin Endpoints (Admin Role Required)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/admin/users` | List all users |
| `GET` | `/api/admin/users/:id` | Get user details |
| `PUT` | `/api/admin/users/:id/role` | Update user role |
| `POST` | `/api/admin/users/:id/tags` | Manage user tags |
| `GET` | `/api/admin/segments` | Get user segments |
| `GET` | `/api/admin/segments/:id/export` | Export segment data |
| `POST` | `/api/products` | Create product |
| `PUT` | `/api/products/:id` | Update product |
| `DELETE` | `/api/products/:id` | Delete product |
| `POST` | `/api/blog` | Create blog post |
| `PUT` | `/api/blog/:id` | Update blog post |
| `DELETE` | `/api/blog/:id` | Delete blog post |
| `GET` | `/api/admin/stats` | Dashboard statistics |
| `GET` | `/api/admin/orders` | All orders (admin view) |
| `PUT` | `/api/admin/orders/:id/status` | Update order status |

---

## 8. Environment Configuration

### 8.1 Required Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `5000` |
| `FRONTEND_URL` | CORS allowed origin | `https://www.kpopanimeshop.com` |
| `API_URL` | Backend API URL | `https://api.kpopanimeshop.com` |
| `FIREBASE_PROJECT_ID` | Firebase project | `kpopanimeshop` |
| `FIREBASE_CLIENT_EMAIL` | Service account email | `firebase-adminsdk-*@*.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Service account key | `-----BEGIN PRIVATE KEY-----\n...` |
| `JWT_SECRET` | JWT signing key | Random 32+ char string |
| `JWT_EXPIRE` | Token expiration | `7d` |
| `ADMIN_EMAIL` | Default admin email | `admin@kpopanimeshop.com` |
| `ADMIN_PASSWORD` | Default admin password | Strong password |
| `PRINTFUL_API_KEY` | Printful integration | Optional |

---

## 9. Deployment Architecture

### 9.1 Production Setup

```
┌──────────────────────────────────────────────────────────┐
│                    DNS / Domain                          │
│  www.kpopanimeshop.com → CDN/Hosting                    │
│  api.kpopanimeshop.com → Backend Server                 │
└──────────────────────────────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────┐
│                 Frontend Hosting                         │
│  (Static Files: HTML, CSS, JS, Images)                  │
│  - Vercel / Netlify / Firebase Hosting                  │
│  - CDN for static assets                                │
└──────────────────────────────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────┐
│              Backend API Server                          │
│  (Node.js/Express)                                       │
│  - Render / Railway / Fly.io                            │
│  - Environment variables configured                      │
│  - SSL/TLS enabled                                       │
└──────────────────────────────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────┐
│              Firebase Services                           │
│  - Firestore (Database)                                  │
│  - Firebase Auth (Authentication)                        │
│  - Firebase Storage (Files)                              │
│  - Automatic scaling & backups                           │
└──────────────────────────────────────────────────────────┘
```

### 9.2 Development Setup

```
┌──────────────────────────────────────────────────────────┐
│            Local Development Server                      │
│  Frontend: http://localhost:8080                         │
│  Backend:  http://localhost:5000                         │
└──────────────────────────────────────────────────────────┘
                        ▼
┌──────────────────────────────────────────────────────────┐
│         Firebase Project (Development)                   │
│  - Test data in Firestore                               │
│  - Dev authentication                                    │
│  - Local storage emulator (optional)                     │
└──────────────────────────────────────────────────────────┘
```

---

## 10. Monitoring & Analytics

### 10.1 Available Metrics

| Metric | Source | Purpose |
|--------|--------|---------|
| **User Analytics** | Firebase Analytics | User behavior tracking |
| **API Performance** | Backend logs | Response times, errors |
| **Database Usage** | Firestore console | Read/write operations |
| **Storage Usage** | Firebase Storage | File storage consumption |
| **Authentication** | Firebase Auth | Login/signup rates |
| **Error Tracking** | Console logs | Application errors |

### 10.2 Log Locations

| Component | Log Location |
|-----------|--------------|
| Backend API | `console.log` / stdout |
| Frontend Errors | Browser console |
| Firebase Operations | Firebase Console |
| PHP Upload API | `/frontend/api/php_errors.log` |

---

## 11. Backup & Recovery

### 11.1 Data Backup Strategy

| Data Type | Backup Method | Frequency |
|-----------|---------------|-----------|
| **Firestore Data** | Firebase automatic backups | Daily |
| **User Authentication** | Firebase managed | Continuous |
| **File Storage** | Firebase Storage versioning | On write |
| **Code Repository** | Git version control | On commit |
| **Service Account Keys** | Secure offline storage | One-time |

### 11.2 Recovery Procedures

1. **Database Recovery**: Use Firestore import/export tools
2. **User Recovery**: Firebase Auth provides automatic backups
3. **File Recovery**: Firebase Storage maintains file versions
4. **Code Rollback**: Git revert to previous commit

---

## 12. Performance Optimization

### 12.1 Frontend Optimization

- **Lazy Loading**: Images loaded on demand
- **Code Splitting**: Separate bundles for admin vs. public
- **Caching**: LocalStorage for cart, preferences
- **CDN**: Static assets served from CDN
- **Minification**: CSS/JS minification in production

### 12.2 Backend Optimization

- **Connection Pooling**: Firebase Admin SDK connection reuse
- **Query Optimization**: Firestore indexes for common queries
- **Caching**: Redis cache layer (optional)
- **Rate Limiting**: API request throttling
- **Compression**: Gzip/Brotli compression

### 12.3 Database Optimization

- **Indexes**: Firestore composite indexes on frequently queried fields
- **Denormalization**: Duplicate data for read performance
- **Batch Operations**: Group writes together
- **Query Limits**: Paginate large result sets

---

## 13. Testing Strategy

### 13.1 Test Locations

| Test Type | Location | Purpose |
|-----------|----------|---------|
| **Health Check** | `/api/health` | Server status |
| **Firebase Connection** | `backend/scripts/test-firebase.js` | Database connectivity |
| **Checkout Test** | `frontend/public/test-checkout.html` | Payment flow |

### 13.2 Manual Testing Checklist

- [ ] User registration and login
- [ ] Product browsing and search
- [ ] Cart operations (add, remove, update)
- [ ] Checkout process
- [ ] Order confirmation
- [ ] Admin panel access
- [ ] Product management (CRUD)
- [ ] Blog post management
- [ ] User management
- [ ] File uploads
- [ ] Authentication flows
- [ ] Mobile responsiveness

---

## 14. Troubleshooting Guide

### 14.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| **CORS Errors** | Origin not allowed | Update CORS config in `server.js` |
| **Auth Failures** | Token expired | Refresh Firebase token |
| **Upload Failures** | File size/type | Check PHP upload limits |
| **Firestore Connection** | Invalid credentials | Verify service account key |
| **Cart Not Persisting** | LocalStorage disabled | Enable browser storage |
| **Images Not Loading** | Storage permissions | Check Firebase Storage rules |

### 14.2 Debug Commands

```bash
# Test Firebase connection
node backend/scripts/test-firebase.js

# Check backend health
curl http://localhost:5000/api/health

# View backend logs
npm run dev  # in backend directory

# Check Firestore data
# Navigate to: https://console.firebase.google.com/project/kpopanimeshop/firestore

# Test file upload
# Use frontend/public/test-checkout.html
```

---

## 15. Technology Stack Summary

### 15.1 Frontend Stack
- **HTML5** - Markup
- **CSS3** - Styling (with custom CSS, no frameworks)
- **JavaScript (ES6+)** - Client-side logic
- **Firebase SDK** - Client-side Firebase integration
- **PHP 7+** - File upload API

### 15.2 Backend Stack
- **Node.js v18+** - Runtime
- **Express.js** - Web framework
- **Firebase Admin SDK** - Server-side Firebase
- **JWT** - Token authentication
- **Multer** - File upload middleware (optional)

### 15.3 Database & Storage
- **Firebase Firestore** - NoSQL database
- **Firebase Storage** - File storage
- **Firebase Authentication** - User management

### 15.4 DevOps & Tools
- **Git** - Version control
- **npm** - Package management
- **Environment Variables** - Configuration
- **Render/Railway/Fly.io** - Backend hosting options
- **Vercel/Netlify** - Frontend hosting options

---

## 16. Future Enhancements

### 16.1 Planned Features
- [ ] Real-time inventory tracking
- [ ] Advanced search and filtering
- [ ] Product recommendations
- [ ] Wishlist functionality
- [ ] Order tracking system
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Loyalty program
- [ ] Affiliate system
- [ ] Multi-currency support
- [ ] Internationalization (i18n)
- [ ] Progressive Web App (PWA)
- [ ] Mobile app integration

### 16.2 Technical Improvements
- [ ] Automated testing suite
- [ ] CI/CD pipeline
- [ ] Error monitoring (Sentry)
- [ ] Performance monitoring (New Relic)
- [ ] Analytics dashboard
- [ ] A/B testing framework
- [ ] GraphQL API
- [ ] WebSockets for real-time features
- [ ] Service worker for offline support

---

**Last Updated**: 2025-11-02
**Version**: 1.0.0
**Maintained By**: Development Team
