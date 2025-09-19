# Course Management System

A MERN stack application with microservices architecture for managing courses.

## Features

- 3 Backend Microservices (Auth, Course Management, AI Recommendations)
- React Frontend with Redux
- MongoDB for data storage
- Redis for caching
- Elasticsearch for search
- Docker support

## Test Credentials

**Admin Login:**
- Email: `Ramyadav@gmail.com`
- Password: `Ram@1234`

**User Login:**
- Email: `user@gmail.com`
- Password: `Ram@1234`

*These credentials are connected to MongoDB Atlas for testing purposes.*

## Setup

**Requirements:**
- Node.js 18+
- MongoDB running on port 27017
- Redis running on port 6379
- Elasticsearch running on port 9200

**Start Backend:**
```bash
# Auth Service (port 3001)
cd backend/services/auth
npm install
npm start

# Course Management Service (port 3002)
cd backend/services/course-management
npm install
npm start

# AI Recommendation Service (port 3003)
cd backend/services/ai-recommendation
npm install
npm start
```

**Start Frontend:**
```bash
cd sampleuniproject-waygood-sampleuniproject
npm install
npm run dev
```

## Features

- Admin login and authentication
- Course search with filters
- CSV upload for course data
- AI-powered course recommendations
- Course details pages
- Admin dashboard

## Docker

### AI Recommendations Service (Dockerized)

**Build and Run:**
```bash
cd backend/services/ai-recommendation
docker build -t ai-service .
docker run -d -p 3003:3003 --name ai-container ai-service
```

**Docker Commands Cheat Sheet:**
```bash
# Build Docker Image
docker build -t ai-service .

# Run Container
docker run -d -p 3003:3003 --name ai-container ai-service

# See Running Containers
docker ps

# Stop Container
docker stop ai-container

# Start Stopped Container
docker start ai-container

# Remove Container
docker rm ai-container

# View Logs
docker logs ai-container
docker logs -f ai-container  # Live logs

# Enter Container Shell (Debugging)
docker exec -it ai-container sh

# Restart Container
docker restart ai-container

# Cleanup
docker container prune  # Remove stopped containers
docker image prune -a   # Remove unused images
```

**Test the Service:**
```bash
# Health check
curl http://localhost:3003/health

# Sample recommendations
curl http://localhost:3003/api/recommendations/sample

# Custom recommendations
curl -X POST http://localhost:3003/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{"topics": ["machine learning"], "skillLevel": "Beginner"}'
```

## API Endpoints

- POST /api/auth/login - Admin login
- GET /api/courses - Get all courses
- GET /api/search/courses - Search courses
- POST /api/upload/csv - Upload course data
- POST /api/recommendations - Get AI recommendations

## Tech Stack

**Backend:** Node.js, Express, MongoDB, Redis, Elasticsearch, JWT
**Frontend:** React, Next.js, TypeScript, Redux Toolkit, Tailwind CSS