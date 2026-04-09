# Netlify Deployment Guide

## 📋 Complete Deployment Instructions

### Prerequisites

- Node.js installed
- Git repository configured
- Neo4j database set up (yours at: ce7d6f3d.databases.neo4j.io)
- Netlify account created

---

## 🚀 Deployment Steps

### 1. Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial commit - Netlify deployment ready"
```

### 2. Push to GitHub (or GitLab/Bitbucket)

```bash
git remote add origin https://github.com/your-username/your-repo.git
git branch -M main
git push -u origin main
```

### 3. Connect to Netlify

#### Option A: Using Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
```

#### Option B: Using Web Dashboard

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click "New site from Git"
3. Select your Git provider
4. Choose your repository
5. Accept default settings (build command: `npm install`, functions: `netlify/functions`)
6. Click "Deploy site"

### 4. Set Environment Variables in Netlify Dashboard

1. Go to **Site Settings → Build & Deploy → Environment**
2. Add these environment variables:

```
NEO4J_URI: neo4j+s://ce7d6f3d.databases.neo4j.io
NEO4J_USER: ce7d6f3d
NEO4J_PASSWORD: UQEuJcJBA6DtMdag5fd-Gv4cEW3yl-WSfSI0jfMDe2E
```

### 5. Redeploy

- Go to **Builds** tab
- Click **Trigger Deploy → Deploy site**

---

## 📁 Project Structure

```
webtech/
├── public/                           (Frontend - Static Files)
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── graph.html
├── netlify/
│   └── functions/                    (Backend - Serverless Functions)
│       ├── health.js                 (GET /health)
│       ├── graphData.js              (GET /api/graphData)
│       ├── students.js               (GET/POST /api/students)
│       ├── courses.js                (GET/POST /api/courses)
│       ├── enroll.js                 (POST /api/enroll)
│       ├── student-courses.js        (GET /api/student/:id/courses)
│       └── course-students.js        (GET /api/course/:code/students)
├── netlify.toml                      (Netlify Config)
├── package.json                      (Updated with netlify-cli)
├── neo4j.js                          (DB Connection)
├── server.js                         (Local development only)
└── .env                              (Your credentials)
```

---

## 🔗 API Endpoints (After Deployment)

| Endpoint                           | Method | Description                  |
| ---------------------------------- | ------ | ---------------------------- |
| `/api/health`                      | GET    | Server health check          |
| `/api/graphData`                   | GET    | Get graph visualization data |
| `/api/students`                    | GET    | Get all students             |
| `/api/students`                    | POST   | Create new student           |
| `/api/courses`                     | GET    | Get all courses              |
| `/api/courses`                     | POST   | Create new course            |
| `/api/enroll`                      | POST   | Enroll student in course     |
| `/api/student/:studentId/courses`  | GET    | Get courses for student      |
| `/api/course/:courseCode/students` | GET    | Get students in course       |

---

## 🧪 Local Testing with Netlify

Before deploying, test locally:

```bash
npm install
npm run dev
# Opens at http://localhost:8888
```

This runs both frontend and functions locally.

---

## 🐛 Troubleshooting

### No environment variables found

- Check Netlify Dashboard **Build & Deploy → Environment**
- Make sure you set `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`
- Trigger a new deploy after setting variables

### 404 errors on API calls

- Make sure `netlify.toml` redirects are configured correctly
- Check function names match API paths:
  - `/api/graphData` → `graphData.js`
  - `/api/students` → `students.js`
  - `/api/courses` → `courses.js`
  - `/api/enroll` → `enroll.js`
  - `/api/student/*` → `student-courses.js`
  - `/api/course/*` → `course-students.js`

### Neo4j connection errors

- Verify credentials in Netlify environment variables
- Check if Neo4j instance is online at: https://neo4j.com/cloud/
- Test locally with `npm run dev` first

### Builds failing

- Check **Site Settings → Build & Deploy → Build logs**
- Ensure all dependencies are in `package.json`
- Run `npm install` locally to verify no errors

---

## 🎉 After Deployment

Your site will be live at:

```
https://your-site-name.netlify.app
```

### Test endpoints:

```bash
curl https://your-site-name.netlify.app/api/health
curl https://your-site-name.netlify.app/api/students
```

---

## 📱 Deploy on Every Git Push

Netlify automatically deploys on every push to your main branch:

```bash
git add .
git commit -m "Update message"
git push origin main
# Netlify automatically builds and deploys!
```

---

## 🔐 Security Notes

1. **Never commit `.env`** - Already should be in `.gitignore`
2. **Add to `.gitignore`** if not present:
   ```
   .env
   .netlify
   node_modules/
   build/
   dist/
   ```
3. **Use Netlify Environment Variables** for sensitive credentials (not `.env`)

---

## ✅ Deployment Checklist

- [ ] Git repository initialized and connected
- [ ] All files pushed to GitHub/GitLab/Bitbucket
- [ ] Netlify site created from Git
- [ ] Environment variables set (NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)
- [ ] Build triggered and successful
- [ ] Frontend loads at your-site.netlify.app
- [ ] API endpoints working (test /api/health)
- [ ] Neo4j database queries working
- [ ] Graph visualization displays data

---

For more help, visit: [Netlify Docs](https://docs.netlify.com)
