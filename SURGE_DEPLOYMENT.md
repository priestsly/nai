# Surge Deployment Guide for NeuroGrid OS

## Problem

You were experiencing a 404 error with the Neural Link connection because:

1. The Next.js application was configured with `output: 'export'` in production mode, which creates a static export without API routes
2. Surge hosting doesn't support server-side functionality needed for Next.js API routes
3. Environment variables weren't properly configured for the Surge deployment

## Solution

We've made the following changes to fix the issue:

1. Created a `.env` file in the root directory with your Gemini API key
2. Modified `next.config.js` to remove the static export configuration

## Deployment Steps

### Option 1: Deploy to Vercel (Recommended)

Vercel fully supports Next.js API routes and server components:

1. Create an account on [Vercel](https://vercel.com)
2. Connect your GitHub repository or deploy directly from your local project
3. Vercel will automatically detect Next.js and deploy with the correct configuration
4. Add your environment variables in the Vercel dashboard

### Option 2: Deploy to Surge with Client-Side API Calls

If you want to continue using Surge, you'll need to modify your application to make API calls directly from the client side:

1. Install the Google Generative AI library:
   ```
   npm install @google/generative-ai
   ```

2. Modify your AIChat component to use the client-side library instead of API routes
3. Build your application with:
   ```
   npm run build
   ```

4. Deploy to Surge:
   ```
   surge out your-domain.surge.sh
   ```

## Environment Variables

Make sure your environment variables are properly set:

- For local development: Use `.env.local`
- For production: Use `.env` or set environment variables on your hosting platform

## Testing

After deployment, test the Neural Link connection to ensure it's working properly. If you continue to experience issues, check the browser console for error messages.