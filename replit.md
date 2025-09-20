# ITERA Election - Student President Voting System

## Overview
This is a Next.js-based voting application for ITERA (Institut Teknologi Sumatera) student president elections. The application provides a secure platform for students to register, receive QR codes for validation, and cast their votes.

## Project Architecture
- **Framework**: Next.js 14.2.16 with TypeScript
- **UI Library**: Radix UI components with Tailwind CSS
- **Authentication**: Mock authentication system (configured for testing)
- **Database**: Mock Supabase client (ready for real integration)
- **Deployment**: Configured for Replit autoscale deployment

## Key Features
- Student registration and login
- QR code generation for voting validation
- Secure voting interface
- Admin and super-admin panels
- Real-time vote tracking
- Responsive design with Indonesian language support

## Recent Changes (September 20, 2025)
- Successfully imported from GitHub and configured for Replit environment
- Installed all npm dependencies and resolved Next.js setup
- Created PostgreSQL database and migrated Prisma schema
- Configured Next.js for Replit proxy compatibility with allowedHosts
- Set up development workflow on port 5000 with 0.0.0.0 hostname
- Added cache control headers for proper iframe display
- Configured autoscale deployment for production
- Application is fully functional and running successfully

## Development Setup
- **Dev Server**: Runs on port 5000 with 0.0.0.0 hostname for Replit compatibility
- **Build System**: Standard Next.js build process
- **Package Manager**: npm
- **TypeScript**: Enabled with relaxed build error settings

## File Structure
- `/app` - Next.js app router pages and layouts
- `/components` - Reusable UI components (Radix UI + custom)
- `/lib` - Utilities, types, and mock services
- `/public` - Static assets
- `/scripts` - Database schema and seed files

## Current Status
✅ Fully functional and ready for development
✅ All dependencies installed
✅ Development server running on port 5000
✅ Deployment configuration complete
✅ Mock authentication system working
✅ UI components rendering correctly

## User Preferences
- Indonesian language interface
- Clean, accessible design with ITERA branding
- Secure voting workflow with QR code validation