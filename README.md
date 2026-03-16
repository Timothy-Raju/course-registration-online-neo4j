# Student Course Registration System

A small class assignment project built with:
- HTML, CSS, JavaScript (frontend)
- Node.js + Express (backend)
- Neo4j (graph database)

## Features
- Add Student
- Add Course
- Enroll Student in Course
- View all Students
- View all Courses
- View courses by student
- View students by course

## Neo4j Graph Model
- `(:Student {studentId, name})`
- `(:Course {courseCode, title})`
- `(:Student)-[:ENROLLED_IN]->(:Course)`

## Setup
1. Install dependencies:
   npm install
2. Create `.env` from `.env.example` and add your Neo4j password.
3. Start server:
   npm start
4. Open:
   http://localhost:3000

## Environment Variables
- `NEO4J_URI` (example: `bolt://localhost:7687`)
- `NEO4J_USER` (usually `neo4j`)
- `NEO4J_PASSWORD`
- `PORT` (optional, default is `3000`)

## Useful API Endpoints
- `POST /api/students`
- `POST /api/courses`
- `POST /api/enroll`
- `GET /api/students`
- `GET /api/courses`
- `GET /api/student/:studentId/courses`
- `GET /api/course/:courseCode/students`
- `GET /health`

## Suggested Demo Flow
1. Add 2-3 students
2. Add 2-3 courses
3. Enroll students into courses
4. Show students list and courses list
5. Query by student and by course to show graph relationships
