# Student Course Registration System - Netlify Setup

## Overview

This project has been configured for **Netlify deployment** with:

- **Frontend**: Static site served from `public/` folder
- **Backend**: Serverless functions in `netlify/functions/` folder
- **Database**: External Neo4j instance

## Quick Start

### Local Development

```bash
npm install
npm run dev
# Opens http://localhost:8888
```

### Deploy to Netlify

1. **Initialize Git**

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Push to GitHub**

   ```bash
   git push origin main
   ```

3. **Connect to Netlify**
   - Go to app.netlify.com
   - Click "New site from Git"
   - Select your repository
   - Netlify auto-detects settings

4. **Set Environment Variables**
   - Site Settings → Build & Deploy → Environment
   - Add:
     - `NEO4J_URI`
     - `NEO4J_USER`
     - `NEO4J_PASSWORD`

5. **Deploy**
   - Trigger a new deploy in Netlify Dashboard
   - Your site is live! 🎉

## Files Added/Modified

### ✅ New Files:

- `netlify.toml` - Netlify configuration
- `netlify/functions/health.js` - Health check
- `netlify/functions/graphData.js` - Graph visualization
- `netlify/functions/students.js` - Student operations
- `netlify/functions/courses.js` - Course operations
- `netlify/functions/enroll.js` - Enrollment
- `netlify/functions/student-courses.js` - Get courses by student
- `netlify/functions/course-students.js` - Get students by course
- `.env.example` - Environment template

### 📝 Modified Files:

- `package.json` - Added netlify-cli dev dependency

## Project Structure

```
webtech/
├── public/                      (Frontend - Static site)
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── graph.html
├── netlify/
│   └── functions/               (Backend - Serverless)
│       └── [function files]
├── netlify.toml                 (Configuration)
├── package.json
├── neo4j.js
├── server.js                    (For local dev only)
└── .env
```

## Important Notes

✔️ **Frontend & Backend Fully Integrated** - All API calls work with Netlify functions
✔️ **Auto-Deploy** - Push to Git → Netlify auto-builds & deploys
✔️ **Environment Variables** - Set securely in Netlify Dashboard
✔️ **Database** - Uses your external Neo4j instance

## Support

For detailed instructions, see `NETLIFY_DEPLOYMENT.md`
