# Tashawer Platform - Implementation Plan for Claude Code

## Project Overview

**Tashawer (تشاور)** is an industry consultation marketplace platform similar to Upwork, focused on connecting engineering consultants with clients seeking professional consultation services in Saudi Arabia.

---

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Database | PostgreSQL | 15+ |
| Backend API | Django + Django REST Framework | 5.0+ / 3.14+ |
| Web Frontend | Next.js (React) | 14+ |
| Mobile App | Flutter | 3.16+ |
| Cache/Queue | Redis | 7+ |
| File Storage | AWS S3 / MinIO | - |
| Search | Elasticsearch | 8+ |
| Payment Gateway | Local Saudi Gateway (Moyasar/HyperPay) | - |

---

## Phase 1: Project Foundation & Backend Core

### 1.1 Django Project Setup

```bash
# Initialize Django project
django-admin startproject tashawer_backend
cd tashawer_backend

# Create core applications
python manage.py startapp accounts       # User management
python manage.py startapp consultations  # Consultation/Project management
python manage.py startapp bidding        # Bidding system
python manage.py startapp orders         # Order management
python manage.py startapp wallet         # Wallet & payments
python manage.py startapp notifications  # Notification system
python manage.py startapp admin_panel    # Admin dashboard
python manage.py startapp core           # Shared utilities
```

### 1.2 Directory Structure - Backend

```
tashawer_backend/
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── development.py
│   │   ├── staging.py
│   │   └── production.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── accounts/
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── consultant_profile.py
│   │   │   └── client_profile.py
│   │   ├── serializers/
│   │   ├── views/
│   │   ├── services/
│   │   ├── permissions.py
│   │   └── urls.py
│   ├── consultations/
│   │   ├── models/
│   │   │   ├── project.py
│   │   │   ├── consultation.py
│   │   │   └── category.py
│   │   ├── serializers/
│   │   ├── views/
│   │   ├── services/
│   │   └── urls.py
│   ├── bidding/
│   │   ├── models/
│   │   │   ├── bid.py
│   │   │   └── proposal.py
│   │   ├── serializers/
│   │   ├── views/
│   │   └── urls.py
│   ├── orders/
│   │   ├── models/
│   │   │   ├── order.py
│   │   │   ├── milestone.py
│   │   │   └── deliverable.py
│   │   ├── serializers/
│   │   ├── views/
│   │   └── urls.py
│   ├── wallet/
│   │   ├── models/
│   │   │   ├── wallet.py
│   │   │   └── transaction.py
│   │   ├── serializers/
│   │   ├── views/
│   │   ├── services/
│   │   │   └── payment_gateway.py
│   │   └── urls.py
│   ├── notifications/
│   │   ├── models/
│   │   ├── services/
│   │   │   ├── email.py
│   │   │   ├── sms.py
│   │   │   └── push.py
│   │   └── urls.py
│   └── core/
│       ├── models/
│       │   └── base.py
│       ├── utils/
│       ├── middleware/
│       └── permissions.py
├── media/
├── static/
├── templates/
├── locale/
│   ├── ar/
│   └── en/
├── requirements/
│   ├── base.txt
│   ├── development.txt
│   └── production.txt
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
└── manage.py
```

### 1.3 Core Data Models

#### User Model (accounts/models/user.py)

```python
# Task: Create custom user model with role-based authentication
# Roles: Admin, Staff, Client, Consultant
# Fields:
#   - mobile_number (username - Saudi format +966)
#   - email
#   - password (encrypted, min 8 chars, mixed case + special + number)
#   - registration_no (auto-generated: city_code + sequence)
#   - role (choices: admin, staff, client, consultant)
#   - is_verified
#   - is_approved (admin approval required)
#   - created_at, updated_at
```

#### Consultant Profile (accounts/models/consultant_profile.py)

```python
# Task: Create consultant profile model
# Fields:
#   - user (OneToOne)
#   - specialization (engineering field)
#   - experience_years
#   - hourly_rate
#   - portfolio_url
#   - certifications (JSON)
#   - skills (ManyToMany)
#   - rating (decimal)
#   - total_projects
#   - bio (Arabic/English)
#   - availability_status
#   - saudi_engineering_license_no
```

#### Client Profile (accounts/models/client_profile.py)

```python
# Task: Create client profile model
# Fields:
#   - user (OneToOne)
#   - company_name
#   - company_type (individual, company, government)
#   - commercial_registration_no
#   - vat_number
#   - total_projects_posted
#   - total_spent
```

#### Project Model (consultations/models/project.py)

```python
# Task: Create project/consultation model
# Fields:
#   - client (ForeignKey User)
#   - title
#   - description
#   - category (ForeignKey)
#   - type (choices: hourly, fixed)
#   - budget_min, budget_max
#   - duration_days
#   - required_skills (ManyToMany)
#   - attachments (FileField)
#   - status (draft, open, in_progress, completed, cancelled)
#   - visibility (public, invite_only)
#   - created_at, deadline
```

#### Bid Model (bidding/models/bid.py)

```python
# Task: Create bid model
# Fields:
#   - project (ForeignKey)
#   - consultant (ForeignKey User)
#   - proposed_amount
#   - proposed_duration_days
#   - cover_letter
#   - attachments
#   - status (pending, accepted, rejected, withdrawn)
#   - created_at
```

#### Order Model (orders/models/order.py)

```python
# Task: Create order model
# Fields:
#   - order_no (auto-generated)
#   - project (ForeignKey)
#   - client (ForeignKey)
#   - consultant (ForeignKey)
#   - bid (ForeignKey)
#   - total_amount
#   - platform_fee
#   - status (confirmed, in_progress, delivered, completed, cancelled)
#   - started_at, completed_at
#   - cancellation_reason
```

#### Wallet Model (wallet/models/wallet.py)

```python
# Task: Create wallet model
# Fields:
#   - user (OneToOne)
#   - balance
#   - currency (SAR)
#   - is_active
```

#### Transaction Model (wallet/models/transaction.py)

```python
# Task: Create transaction model
# Fields:
#   - wallet (ForeignKey)
#   - type (credit, debit, refund, withdrawal)
#   - amount
#   - balance_after
#   - reference_type (order, deposit, withdrawal, refund)
#   - reference_id
#   - payment_gateway_ref
#   - status (pending, completed, failed)
#   - notes
#   - created_at
```

---

## Phase 2: API Development

### 2.1 Authentication APIs

```
POST /api/v1/auth/register/client/          # Client registration
POST /api/v1/auth/register/consultant/      # Consultant registration
POST /api/v1/auth/login/                    # Login (mobile + password)
POST /api/v1/auth/logout/                   # Logout
POST /api/v1/auth/refresh/                  # Refresh JWT token
POST /api/v1/auth/verify-otp/               # OTP verification
POST /api/v1/auth/forgot-password/          # Request password reset
POST /api/v1/auth/reset-password/           # Reset password
GET  /api/v1/auth/profile/                  # Get current user profile
PUT  /api/v1/auth/profile/                  # Update profile
```

### 2.2 Client APIs

```
# Projects
GET    /api/v1/client/projects/             # List my projects
POST   /api/v1/client/projects/             # Create project
GET    /api/v1/client/projects/{id}/        # Get project detail
PUT    /api/v1/client/projects/{id}/        # Update project
DELETE /api/v1/client/projects/{id}/        # Delete project (soft)

# Bids Management
GET    /api/v1/client/projects/{id}/bids/   # View bids on project
POST   /api/v1/client/bids/{id}/accept/     # Accept bid
POST   /api/v1/client/bids/{id}/reject/     # Reject bid

# Orders
GET    /api/v1/client/orders/               # List my orders
GET    /api/v1/client/orders/{id}/          # Order detail
POST   /api/v1/client/orders/{id}/confirm/  # Confirm delivery
POST   /api/v1/client/orders/{id}/cancel/   # Cancel order
POST   /api/v1/client/orders/{id}/dispute/  # Open dispute

# Wallet
GET    /api/v1/client/wallet/               # View wallet
POST   /api/v1/client/wallet/deposit/       # Add funds
GET    /api/v1/client/wallet/transactions/  # Transaction history
```

### 2.3 Consultant APIs

```
# Browse Projects
GET    /api/v1/consultant/projects/         # Browse available projects
GET    /api/v1/consultant/projects/{id}/    # Project detail

# Bidding
GET    /api/v1/consultant/bids/             # My bids
POST   /api/v1/consultant/bids/             # Submit bid
PUT    /api/v1/consultant/bids/{id}/        # Update bid
DELETE /api/v1/consultant/bids/{id}/        # Withdraw bid
GET    /api/v1/consultant/bids/{id}/status/ # Check bid status

# Orders (Active Projects)
GET    /api/v1/consultant/orders/           # My orders
GET    /api/v1/consultant/orders/{id}/      # Order detail
POST   /api/v1/consultant/orders/{id}/deliver/ # Submit deliverables
POST   /api/v1/consultant/orders/{id}/milestone/ # Update milestone

# Profile & Services
GET    /api/v1/consultant/services/         # My services catalog
POST   /api/v1/consultant/services/         # Create service offering
PUT    /api/v1/consultant/services/{id}/    # Update service

# Wallet
GET    /api/v1/consultant/wallet/           # View wallet
POST   /api/v1/consultant/wallet/withdraw/  # Request withdrawal
GET    /api/v1/consultant/wallet/transactions/ # Transaction history
```

### 2.4 Admin APIs

```
# User Management
GET    /api/v1/admin/users/                 # List all users
GET    /api/v1/admin/users/{id}/            # User detail
PUT    /api/v1/admin/users/{id}/            # Update user
POST   /api/v1/admin/users/{id}/approve/    # Approve registration
POST   /api/v1/admin/users/{id}/suspend/    # Suspend user
POST   /api/v1/admin/users/{id}/activate/   # Activate user

# Consultations Management
GET    /api/v1/admin/projects/              # All projects
GET    /api/v1/admin/projects/{id}/         # Project detail
PUT    /api/v1/admin/projects/{id}/         # Update project
DELETE /api/v1/admin/projects/{id}/         # Delete project

# Orders Management
GET    /api/v1/admin/orders/                # All orders
GET    /api/v1/admin/orders/{id}/           # Order detail
POST   /api/v1/admin/orders/{id}/resolve/   # Resolve dispute

# Wallet Management
GET    /api/v1/admin/wallets/               # All wallets
GET    /api/v1/admin/wallets/{id}/          # Wallet detail
POST   /api/v1/admin/wallets/{id}/credit/   # Manual credit
POST   /api/v1/admin/wallets/{id}/debit/    # Manual debit
GET    /api/v1/admin/transactions/          # All transactions

# Reports & Analytics
GET    /api/v1/admin/reports/revenue/       # Revenue report
GET    /api/v1/admin/reports/users/         # User statistics
GET    /api/v1/admin/reports/projects/      # Project statistics

# Settings
GET    /api/v1/admin/settings/              # Platform settings
PUT    /api/v1/admin/settings/              # Update settings
GET    /api/v1/admin/categories/            # Categories
POST   /api/v1/admin/categories/            # Create category
```

### 2.5 Common/Public APIs

```
GET    /api/v1/categories/                  # List categories
GET    /api/v1/skills/                      # List skills
GET    /api/v1/consultants/                 # Public consultant directory
GET    /api/v1/consultants/{id}/            # Public consultant profile
POST   /api/v1/contact/                     # Contact form
GET    /api/v1/pages/{slug}/                # Static pages (terms, privacy, etc.)
```

---

## Phase 3: Next.js Frontend

### 3.1 Directory Structure

```
tashawer_frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   │   ├── client/
│   │   │   │   └── consultant/
│   │   │   └── forgot-password/
│   │   ├── (client)/
│   │   │   ├── dashboard/
│   │   │   ├── projects/
│   │   │   │   ├── new/
│   │   │   │   └── [id]/
│   │   │   ├── orders/
│   │   │   │   └── [id]/
│   │   │   ├── wallet/
│   │   │   └── settings/
│   │   ├── (consultant)/
│   │   │   ├── dashboard/
│   │   │   ├── browse/
│   │   │   ├── bids/
│   │   │   ├── orders/
│   │   │   │   └── [id]/
│   │   │   ├── services/
│   │   │   ├── wallet/
│   │   │   └── settings/
│   │   ├── (admin)/
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── projects/
│   │   │   ├── orders/
│   │   │   ├── wallets/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   ├── (public)/
│   │   │   ├── consultants/
│   │   │   ├── about/
│   │   │   ├── contact/
│   │   │   └── terms/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                    # Base UI components
│   │   ├── forms/                 # Form components
│   │   ├── tables/                # Data tables
│   │   ├── cards/                 # Card components
│   │   ├── modals/                # Modal dialogs
│   │   └── layouts/               # Layout components
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProjects.ts
│   │   ├── useOrders.ts
│   │   └── useWallet.ts
│   ├── lib/
│   │   ├── api.ts                 # API client
│   │   ├── auth.ts                # Auth utilities
│   │   └── utils.ts               # Helpers
│   ├── store/                     # State management (Zustand/Redux)
│   ├── types/                     # TypeScript types
│   ├── i18n/                      # Internationalization
│   │   ├── ar.json
│   │   └── en.json
│   └── styles/
│       └── globals.css
├── public/
├── next.config.js
├── tailwind.config.js
├── package.json
└── tsconfig.json
```

### 3.2 Key Pages to Implement

#### Public Pages
- Landing page with consultant search
- Consultant public profiles
- Category browsing
- About, Contact, Terms pages

#### Authentication Pages
- Login (mobile + password)
- Client registration
- Consultant registration (with license verification)
- Password recovery
- OTP verification

#### Client Dashboard
- Overview with stats (active projects, total spent, etc.)
- Project management (create, edit, view bids)
- Order tracking
- Wallet management
- Profile settings

#### Consultant Dashboard
- Overview with stats (active orders, earnings, etc.)
- Browse available projects
- My bids management
- Active orders with deliverable submission
- Service catalog management
- Wallet with withdrawal requests
- Profile settings

#### Admin Dashboard
- Overview with platform statistics
- User management (approve/reject registrations)
- Project moderation
- Order & dispute management
- Wallet & transaction management
- Reports & analytics
- Platform settings

---

## Phase 4: Flutter Mobile App

### 4.1 Directory Structure

```
tashawer_mobile/
├── lib/
│   ├── main.dart
│   ├── app/
│   │   ├── app.dart
│   │   ├── routes.dart
│   │   └── theme.dart
│   ├── core/
│   │   ├── constants/
│   │   ├── errors/
│   │   ├── network/
│   │   │   ├── api_client.dart
│   │   │   └── interceptors/
│   │   ├── utils/
│   │   └── widgets/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── data/
│   │   │   │   ├── models/
│   │   │   │   ├── repositories/
│   │   │   │   └── datasources/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   ├── repositories/
│   │   │   │   └── usecases/
│   │   │   └── presentation/
│   │   │       ├── bloc/
│   │   │       ├── pages/
│   │   │       └── widgets/
│   │   ├── client/
│   │   │   ├── dashboard/
│   │   │   ├── projects/
│   │   │   ├── orders/
│   │   │   └── wallet/
│   │   ├── consultant/
│   │   │   ├── dashboard/
│   │   │   ├── browse/
│   │   │   ├── bids/
│   │   │   ├── orders/
│   │   │   └── wallet/
│   │   ├── notifications/
│   │   └── settings/
│   ├── l10n/                      # Localization
│   │   ├── app_ar.arb
│   │   └── app_en.arb
│   └── injection.dart             # Dependency injection
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── test/
├── pubspec.yaml
└── analysis_options.yaml
```

### 4.2 Key Features for Mobile

#### Both Client & Consultant Apps
- Biometric authentication
- Push notifications (Firebase)
- Real-time chat/messaging
- File upload/download
- Offline mode support
- Arabic RTL support

#### Client App Screens
- Dashboard
- Create/manage projects
- View & accept bids
- Order tracking
- Wallet & payments
- Profile management

#### Consultant App Screens
- Dashboard
- Browse & filter projects
- Submit bids
- Order management & delivery
- Wallet & withdrawals
- Profile & services

---

## Phase 5: Implementation Tasks for Claude Code

### Sprint 1: Backend Foundation (Week 1-2)

```markdown
## Tasks:

### Task 1.1: Initialize Django Project
- Create project structure as defined above
- Configure settings for dev/staging/prod
- Setup PostgreSQL connection
- Configure Redis for caching
- Setup Django REST Framework
- Configure JWT authentication (djangorestframework-simplejwt)
- Setup CORS headers

### Task 1.2: Create Core App
- Base model with created_at, updated_at, soft delete
- Custom permissions classes
- Pagination utilities
- Response formatters
- Exception handlers

### Task 1.3: Implement Accounts App
- Custom User model with mobile auth
- Consultant Profile model
- Client Profile model
- Registration serializers with validation
- Login/Logout views
- OTP verification service
- Password reset flow
- Profile management endpoints
```

### Sprint 2: Core Features Backend (Week 3-4)

```markdown
### Task 2.1: Implement Consultations App
- Category model
- Skill model
- Project model
- Consultation model
- CRUD endpoints for projects
- Search & filter functionality
- File attachment handling

### Task 2.2: Implement Bidding App
- Bid model
- Proposal model
- Bidding endpoints
- Bid status management
- Notifications on bid events

### Task 2.3: Implement Orders App
- Order model
- Milestone model
- Deliverable model
- Order workflow (create, confirm, deliver, complete)
- Status transitions
- Cancellation logic with refund triggers
```

### Sprint 3: Payments & Admin (Week 5-6)

```markdown
### Task 3.1: Implement Wallet App
- Wallet model
- Transaction model
- Payment gateway integration (Moyasar/HyperPay)
- Deposit flow
- Withdrawal request flow
- Escrow logic for orders
- Refund processing

### Task 3.2: Implement Admin APIs
- User management endpoints
- Approval workflow
- Project moderation
- Order dispute resolution
- Manual wallet operations
- Reports generation

### Task 3.3: Implement Notifications
- Email templates (Arabic/English)
- SMS integration (Twilio/local provider)
- Push notification service
- Notification preferences
```

### Sprint 4: Frontend Foundation (Week 7-8)

```markdown
### Task 4.1: Initialize Next.js Project
- Setup Next.js 14 with App Router
- Configure Tailwind CSS
- Setup shadcn/ui components
- Configure i18n (next-intl)
- Setup API client with Axios
- Configure authentication context

### Task 4.2: Implement Auth Pages
- Login page with mobile input
- Client registration form
- Consultant registration form
- OTP verification screen
- Password reset flow

### Task 4.3: Implement Public Pages
- Landing page
- Consultant directory
- Consultant profile page
- Category browsing
- Static pages (about, terms, contact)
```

### Sprint 5: Client Dashboard (Week 9-10)

```markdown
### Task 5.1: Client Dashboard
- Overview with statistics
- Recent projects widget
- Active orders widget
- Wallet balance widget

### Task 5.2: Project Management
- Project listing with filters
- Create project form (multi-step)
- Project detail page
- Bids review interface
- Accept/reject bid functionality

### Task 5.3: Client Orders & Wallet
- Order listing
- Order detail with milestones
- Delivery confirmation
- Wallet page with deposit
- Transaction history
```

### Sprint 6: Consultant Dashboard (Week 11-12)

```markdown
### Task 6.1: Consultant Dashboard
- Overview with statistics
- Active bids widget
- Current orders widget
- Earnings summary

### Task 6.2: Project Browsing & Bidding
- Project search with filters
- Project detail page
- Bid submission form
- My bids listing
- Bid status tracking

### Task 6.3: Consultant Orders & Wallet
- Active orders listing
- Order detail with deliverable upload
- Milestone updates
- Wallet with withdrawal
- Transaction history
```

### Sprint 7: Admin Panel (Week 13-14)

```markdown
### Task 7.1: Admin Dashboard
- Platform statistics
- Revenue charts
- User growth charts
- Recent activity feed

### Task 7.2: Admin Management Features
- User listing with filters
- User approval workflow
- Project moderation
- Order & dispute management

### Task 7.3: Admin Settings & Reports
- Wallet management
- Category management
- Platform settings
- Report generation
```

### Sprint 8: Mobile App (Week 15-18)

```markdown
### Task 8.1: Initialize Flutter Project
- Setup project structure (Clean Architecture)
- Configure dependencies (BLoC, Dio, etc.)
- Setup theming with RTL support
- Configure localization
- Setup dependency injection

### Task 8.2: Auth & Common Features
- Splash screen
- Login screen
- Registration screens
- OTP verification
- Push notifications setup
- Bottom navigation

### Task 8.3: Client Mobile Features
- Dashboard
- Project management
- Order tracking
- Wallet

### Task 8.4: Consultant Mobile Features
- Dashboard
- Project browsing
- Bid management
- Order delivery
- Wallet
```

### Sprint 9: Testing & Deployment (Week 19-20)

```markdown
### Task 9.1: Testing
- Unit tests for backend services
- API integration tests
- Frontend component tests
- E2E tests with Cypress
- Mobile widget tests

### Task 9.2: Documentation
- API documentation (Swagger/OpenAPI)
- Frontend component documentation
- Deployment guide
- User manual

### Task 9.3: Deployment Setup
- Docker containerization
- CI/CD pipeline (GitHub Actions)
- Staging environment
- Production deployment
- Monitoring setup (Sentry, logging)
```

---

## Non-Functional Requirements

### Security
- JWT token authentication with refresh
- Password encryption (bcrypt)
- Input validation & sanitization
- Rate limiting
- SQL injection prevention
- XSS protection
- HTTPS enforcement

### Performance
- Database query optimization
- Redis caching for frequent queries
- CDN for static assets
- Image optimization
- Lazy loading

### Scalability
- Horizontal scaling capability
- Database read replicas
- Queue-based async processing
- Microservices-ready architecture

### Localization
- Full Arabic (RTL) support
- English language support
- Saudi time zone handling
- SAR currency formatting

### Compliance
- Saudi Engineering Authority regulations
- Local payment gateway compliance
- Data privacy (PDPL)
- 99.99% uptime target

---

## Key Dependencies

### Backend (Python)
```txt
Django>=5.0
djangorestframework>=3.14
djangorestframework-simplejwt>=5.3
django-cors-headers>=4.3
django-filter>=23.5
django-storages>=1.14
boto3>=1.34
psycopg2-binary>=2.9
redis>=5.0
celery>=5.3
Pillow>=10.2
python-magic>=0.4
drf-spectacular>=0.27
```

### Frontend (Next.js)
```json
{
  "next": "^14.0",
  "react": "^18.2",
  "typescript": "^5.3",
  "tailwindcss": "^3.4",
  "@tanstack/react-query": "^5.17",
  "axios": "^1.6",
  "zustand": "^4.4",
  "next-intl": "^3.4",
  "react-hook-form": "^7.49",
  "zod": "^3.22"
}
```

### Mobile (Flutter)
```yaml
dependencies:
  flutter_bloc: ^8.1.3
  dio: ^5.4.0
  get_it: ^7.6.4
  go_router: ^12.1.3
  flutter_secure_storage: ^9.0.0
  firebase_messaging: ^14.7.9
  intl: ^0.18.1
  cached_network_image: ^3.3.1
```

---

## Getting Started Commands

### Backend Setup
```bash
# Clone and setup
git clone <repo>
cd tashawer_backend
python -m venv venv
source venv/bin/activate
pip install -r requirements/development.txt

# Database
createdb tashawer_db
python manage.py migrate
python manage.py createsuperuser

# Run
python manage.py runserver
```

### Frontend Setup
```bash
cd tashawer_frontend
npm install
cp .env.example .env.local
npm run dev
```

### Mobile Setup
```bash
cd tashawer_mobile
flutter pub get
flutter run
```

---

## Notes for Claude Code

1. **Start with backend models first** - they define the data structure for the entire platform
2. **Use Django REST Framework serializers** for validation and data transformation
3. **Implement services layer** to keep business logic separate from views
4. **Use signals** for cross-app communication (e.g., creating wallet on user creation)
5. **Implement proper error handling** with custom exception classes
6. **Add comprehensive logging** for debugging and monitoring
7. **Write tests** alongside feature development
8. **Use environment variables** for all sensitive configuration
9. **Follow Arabic naming conventions** in the database for Arabic content fields
10. **Ensure all date/time** is stored in UTC and converted to Saudi time for display

---

*Document Version: 1.0*
*Last Updated: December 2024*
*Project: Tashawer Consultation Platform*
