# AiFace - Image Upload Application

A full-stack application with Google OAuth2 authentication and image upload functionality.

## Project Structure
```
.
├── client/             # React frontend
├── server/             # Node.js backend
└── README.md
```

## Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Google Cloud Platform account (for OAuth2)

## Setup Instructions

### Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   JWT_SECRET=your_jwt_secret
   ```
4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with:
   ```
   REACT_APP_API_URL=http://localhost:5000
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
   ```
4. Start the development server:
   ```bash
   npm start
   ```

## Features
- Google OAuth2 Authentication
- Image Upload and Storage
- MongoDB Database Integration
- Secure File Handling 