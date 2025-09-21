# Course Management Platform

A MERN stack course management system with microservices architecture, featuring JWT authentication, AI recommendations, Elasticsearch search, and Redis caching.

## What's Built

- **3 Microservices**: Auth, Course Management, and AI Recommendations
- **Frontend**: React with Next.js and TypeScript
- **Database**: MongoDB for data storage
- **Search**: Elasticsearch for full-text search
- **Caching**: Redis for performance optimization
- **AI**: Gemini AI for course recommendations
- **Docker**: Containerized AI service

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis server
- Elasticsearch server

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/Ramkrishna1179/Course-Management.git
cd Course-management
```

2. **Install backend dependencies:**
```bash
cd backend/services/auth && npm install
cd ../course-management && npm install
cd ../ai-recommendation && npm install
```

3. **Install frontend dependencies:**
```bash
cd sampleuniproject-waygood-sampleuniproject
npm install
```

4. **Set up environment variables:**
```bash
# Copy example.env to .env in each service
cp backend/example.env backend/.env
```

5. **Start the services:**
```bash
# Terminal 1 - Auth Service
cd backend/services/auth
npm start

# Terminal 2 - Course Management Service
cd backend/services/course-management
npm start

# Terminal 3 - AI Recommendation Service
cd backend/services/ai-recommendation
npm start

# Terminal 4 - Frontend
cd sampleuniproject-waygood-sampleuniproject
npm run dev
```

## API Endpoints

### Authentication Service (Port 3001)
- `POST /api/auth/signup` - Admin signup
- `POST /api/auth/login` - Admin login
- `GET /api/auth/profile` - Get profile (protected)

### Course Management Service (Port 3002)
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get single course
- `POST /api/upload/csv` - Upload course data
- `GET /api/search/courses` - Search courses
- `GET /api/courses/stats/overview` - Course statistics

### AI Recommendation Service (Port 3003)
- `POST /api/recommendations` - Get AI recommendations
- `GET /api/recommendations/sample` - Get sample recommendations

## Docker Setup

### AI Service (Dockerized)
```bash
cd backend/services/ai-recommendation
docker build -t ai-service .
docker run -d -p 3003:3003 --name ai-container ai-service
```

### Test the AI Service
```bash
# Health check
curl http://localhost:3003/health

# Sample recommendations
curl http://localhost:3003/api/recommendations/sample
```

## Tech Stack

**Backend:**
- Node.js & Express
- MongoDB
- Redis
- Elasticsearch
- JWT Authentication

**Frontend:**
- React 18
- Next.js
- Redux Toolkit
- TypeScript

## Features

- Admin authentication with JWT
- Course search with Elasticsearch
- CSV upload for course data
- AI-powered course recommendations
- Redis caching for performance
- Responsive frontend design

## Test Credentials

**Admin Login:**
- Email: `Ramyadav@gmail.com`
- Password: `Ram@1234`

## Project Structure

```
Course-management/
├── backend/
│   ├── services/
│   │   ├── auth/                 # Authentication service
│   │   ├── course-management/    # Course management service
│   │   └── ai-recommendation/    # AI recommendation service
│   └── example.env
├── sampleuniproject-waygood-sampleuniproject/
│   ├── src/
│   │   ├── app/                  # Next.js pages
│   │   ├── components/           # React components
│   │   └── lib/                  # Utilities and store
│   └── package.json
└── README.md
```

## Development Notes

- Each service runs independently
- Services communicate via HTTP APIs
- Frontend connects to all backend services
- Docker is only used for AI service
- All services have health check endpoints

## License

MIT License