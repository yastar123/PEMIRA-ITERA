# Setup Instructions - ITERA Election System

## Project Overview
This is a Next.js-based voting application for ITERA (Institut Teknologi Sumatera) student president elections with PostgreSQL database using Supabase and Prisma ORM.

## Technology Stack
- **Frontend**: Next.js 14, React 18, TypeScript
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Authentication**: Custom Next.js API routes
- **Styling**: Tailwind CSS, Radix UI components
- **Deployment**: Replit (configured for autoscale)

## Environment Variables Required
Create a `.env.local` file in your project root with the following variables:

```bash
# Database Connection (Supabase PostgreSQL)
DATABASE_URL="your_supabase_database_url_here"

# Optional - for direct database connection without pooler  
DIRECT_URL="your_direct_database_url_here"

# NextAuth Configuration (optional for future auth expansion)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_random_secret_32_characters_long"

# Supabase Configuration (for future Supabase features)
NEXT_PUBLIC_SUPABASE_URL="https://npshlpybxvvfseobjlmc.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key_here"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
```

## Local Development Setup

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Access to Supabase project with the provided DATABASE_URL

### Step 1: Clone and Install
```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd itera-election-system

# Install dependencies
npm install
```

### Step 2: Environment Setup
```bash
# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your actual database credentials
nano .env.local
```

### Step 3: Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Push database schema to Supabase
npx prisma db push

# (Optional) View your database in Prisma Studio
npx prisma studio
```

### Step 4: Run Development Server
```bash
# Start the development server
npm run dev

# Server will be available at http://localhost:3000
```

## Database Schema
The application uses the following main entities:

- **User**: Student information with voting status
- **Candidate**: Election candidates with vision/mission
- **Vote**: Individual votes cast
- **VotingSession**: QR code sessions for validation
- **AdminLog**: Administrative actions logging
- **Settings**: System configuration

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login with ITERA email
- `POST /api/auth/register` - New user registration
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - User logout

### Voting
- `GET /api/candidates` - List all active candidates
- `POST /api/candidates` - Create new candidate (admin only)
- `POST /api/votes` - Cast a vote
- `GET /api/votes` - Get voting statistics

### Voting Sessions
- `POST /api/voting-sessions` - Generate QR code session
- `GET /api/voting-sessions` - Get user's voting session
- `POST /api/admin/validate-session` - Validate QR code (admin only)

## Key Features

1. **Authentication**: Custom email-based authentication for ITERA students
2. **Voting System**: One vote per student with QR code validation
3. **Admin Panel**: Candidate management and vote validation
4. **Real-time Stats**: Live voting statistics
5. **Mobile Friendly**: Responsive design for all devices

## Production Deployment

### Replit Deployment (Already Configured)
The project is configured for Replit autoscale deployment:
- Build command: `npm run build`
- Start command: `npm start`
- Environment variables managed through Replit secrets

### Manual Deployment
For other platforms:
```bash
# Build the application
npm run build

# Start production server
npm start
```

## Troubleshooting

### Database Connection Issues
1. Verify DATABASE_URL is correct
2. Check Supabase project is active
3. Ensure connection pooler settings are correct

### Prisma Issues
```bash
# Reset Prisma client
npx prisma generate

# Reset database schema (WARNING: deletes data)
npx prisma db push --force-reset
```

### Development Server Issues
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

## Security Notes

1. **Database Credentials**: Never commit .env files to version control
2. **Authentication**: Currently uses simple email validation - implement proper password hashing for production
3. **CORS**: Configured for localhost - update for production domains
4. **Rate Limiting**: Consider implementing for API endpoints in production

## Admin Access

To create admin users, update the user role directly in the database:
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@itera.ac.id';
UPDATE "User" SET role = 'SUPER_ADMIN' WHERE email = 'superadmin@itera.ac.id';
```

## Support

For technical issues:
1. Check the logs: `npm run dev` and monitor console output
2. Verify database connectivity with Prisma Studio
3. Check API responses in browser developer tools

## License
This project is created for ITERA student elections. All rights reserved.