# Lindu - Friend Location Tracker

Lindu is a Progressive Web App (PWA) that enables users to track the cities where their friends live, offering a simple, privacy-focused way to stay informed about friends' locations without sharing exact coordinates.

## Features

- **Phone Number Authentication**: Secure sign-up and login using phone number verification via SMS
- **User Profiles**: Simple profiles with just name, profile picture, and city
- **Friend System**: Add friends by phone number, with SMS invitations for non-users
- **Map View**: Interactive map showing friends' locations at the city level
- **Progressive Web App**: Install on your device for a native-like experience

## Tech Stack

- **Frontend**: React, TypeScript, Next.js, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL via Supabase
- **Storage**: Supabase Storage for profile pictures
- **Authentication**: Phone number verification via Twilio
- **Maps**: Google Maps API

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Twilio account
- Google Maps API key

### Environment Setup

1. Clone the repository
2. Copy `.env.local.example` to `.env.local`
3. Fill in the environment variables:
   - Supabase URL and anon key
   - Twilio credentials
   - Google Maps API key

### Database Setup

Create the following tables in your Supabase project:

1. **users**
   - id (uuid, primary key)
   - phone (text, unique)
   - name (text, nullable)
   - profile_picture_url (text, nullable)
   - city (uuid, foreign key to cities.id, nullable)
   - created_at (timestamp with timezone)

2. **cities**
   - id (uuid, primary key)
   - name (text)
   - country (text)
   - lat (float)
   - lng (float)
   - created_at (timestamp with timezone)

3. **friends**
   - id (uuid, primary key)
   - user_id (uuid, foreign key to users.id)
   - friend_id (uuid, foreign key to users.id)
   - status (text, enum: 'pending', 'accepted')
   - created_at (timestamp with timezone)

Also, create a storage bucket named `profile-pictures` with public read access.

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

This app can be deployed to any platform that supports Next.js applications, such as Vercel, Netlify, or a custom server.

## License

MIT
