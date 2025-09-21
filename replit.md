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

## Recent Changes (September 21, 2025)
**MAJOR SECURITY & VALIDATION UPGRADES:**
- **CRITICAL SECURITY FIX**: Replaced vulnerable plain user ID cookies with secure JWT-based authentication system
- **Enhanced Database Schema**: Added `validatedAt` timestamp field to VotingSession model for accurate admin statistics
- **Improved Admin Stats**: Updated statistics calculation to use proper validation timestamps instead of creation times
- **Robust Error Handling**: Implemented Prisma P2002 error code detection for better vote constraint handling
- **Session State Validation**: Enhanced validation workflow to prevent validation of already-used sessions
- **Complete E2E Testing**: Verified entire voting workflow from QR generation through admin validation to vote submission
- **Production Security**: JWT tokens with httpOnly and sameSite=strict cookies, 7-day expiration
- **Data Integrity**: Atomic transactions for vote creation, user status updates, and session marking

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