# Deployment Guide for NeuroGrid OS

## API Routes in Next.js

This application uses Next.js API routes to handle communication with the Gemini API. When deploying this application, it's important to understand how API routes work in Next.js.

### Static Exports vs Server Deployment

- **Static Exports (`output: 'export'`)**: When using static exports, API routes are not included in the build because they require a server to run. This is why you were experiencing 404 errors with the AI Chat component.

- **Server Deployment**: To use API routes, the application must be deployed to a platform that supports Next.js server functionality.

## Deployment Options

### 1. Vercel (Recommended)

Vercel is the easiest platform for deploying Next.js applications with API routes:

1. Create an account on [Vercel](https://vercel.com)
2. Connect your GitHub repository
3. Vercel will automatically detect Next.js and deploy with the correct configuration

### 2. Netlify

Netlify also supports Next.js server functions:

1. Create an account on [Netlify](https://netlify.com)
2. Connect your GitHub repository
3. Set the build command to `npm run build`
4. Set the publish directory to `.next`

### 3. Self-hosted

If you're self-hosting:

1. Build the application with `npm run build`
2. Start the server with `npm start`

## Environment Variables

Make sure to set up your environment variables on your deployment platform:

- `GEMINI_API_KEY`: Your Google Gemini API key

## Changes Made to Fix the 404 Error

1. Removed `output: 'export'` from next.config.js and next.config.ts
2. Updated the AIChat component to use absolute URLs for API calls

These changes ensure that API routes are properly included in the build and that the application can make API calls correctly when deployed.