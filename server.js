require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const { driver } = require("./neo4j");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", async (req, res) => {
  const session = driver.session();
  try {
    await session.run("RETURN 1 AS ok");
    res.json({ status: "ok" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  } finally {
    await session.close();
  }
});

app.get("/api/graph-config", (req, res) => {
  res.json({
    uri: process.env.NEO4J_URI,
    user: process.env.NEO4J_USER,
    password: process.env.NEO4J_PASSWORD,
  });
});

app.get("/api/graph-data", async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (n) 
      OPTIONAL MATCH (n)-[r]-(m) 
      RETURN collect(DISTINCT n) AS nodes, collect(r) AS relationships, collect(DISTINCT m) AS relatedNodes
    `);

    const allNodes = new Map();
    const edges = [];

    if (result.records.length > 0) {
      const record = result.records[0];
      const nodes = record.get("nodes");
      const relationships = record.get("relationships");

      // Add all nodes
      nodes.forEach((node) => {
        const labels = node.labels[0] || "Node";
        const props = node.properties;
        const id = node.identity.toNumber();

        let label = "";
        let color = "#999";

        if (labels === "Student") {
          label = props.name || "Unknown";
          color = "#c46a2a";
        } else if (labels === "Course") {
          label = props.courseCode || "Unknown";
          color = "#5c6bc0";
        }

        allNodes.set(id, {
          id,
          label,
          color,
          title: `${labels}: ${Object.entries(props)
            .map(([k, v]) => `${k}=${v}`)
            .join(", ")}`,
        });
      });

      // Add relationships
      relationships.forEach((rel) => {
        if (rel) {
          edges.push({
            from: rel.start.toNumber(),
            to: rel.end.toNumber(),
            label: rel.type,
            arrows: "to",
          });
        }
      });
    }

    res.json({
      nodes: Array.from(allNodes.values()),
      edges,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    await session.close();
  }
});

app.post("/api/students", async (req, res) => {
  const { name, studentId } = req.body;
  if (!name || !studentId) {
    return res.status(400).json({ message: "name and studentId are required" });
  }

  const session = driver.session();
  try {
    const query = `
      MERGE (s:Student {studentId: $studentId})
      SET s.name = $name
      RETURN s
    `;
    const result = await session.run(query, { name, studentId });
    const student = result.records[0].get("s").properties;
    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    await session.close();
  }
});

app.post("/api/courses", async (req, res) => {
  const { title, courseCode } = req.body;
  if (!title || !courseCode) {
    return res.status(400).json({ message: "title and courseCode are required" });
  }

  const session = driver.session();
  try {
    const query = `
      MERGE (c:Course {courseCode: $courseCode})
      SET c.title = $title
      RETURN c
    `;
    const result = await session.run(query, { title, courseCode });
    const course = result.records[0].get("c").properties;
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    await session.close();
  }
});

app.post("/api/enroll", async (req, res) => {
  const { studentId, courseCode } = req.body;
  if (!studentId || !courseCode) {
    return res.status(400).json({ message: "studentId and courseCode are required" });
  }

  const session = driver.session();
  try {
    const query = `
      MATCH (s:Student {studentId: $studentId})
      MATCH (c:Course {courseCode: $courseCode})
      MERGE (s)-[:ENROLLED_IN]->(c)
      RETURN s, c
    `;
    const result = await session.run(query, { studentId, courseCode });

    if (result.records.length === 0) {
      return res.status(404).json({
        message: "Student or Course not found. Create both before enrollment.",
      });
    }

    res.status(201).json({ message: "Enrollment successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    await session.close();
  }
});

app.get("/api/students", async (req, res) => {
  const session = driver.session();
  try {
    const query = `
      MATCH (s:Student)
      RETURN s
      ORDER BY s.name
    `;
    const result = await session.run(query);
    const students = result.records.map((record) => record.get("s").properties);
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    await session.close();
  }
});

app.get("/api/courses", async (req, res) => {
  const session = driver.session();
  try {
    const query = `
      MATCH (c:Course)
      RETURN c
      ORDER BY c.courseCode
    `;
    const result = await session.run(query);
    const courses = result.records.map((record) => record.get("c").properties);
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    await session.close();
  }
});

app.get("/api/student/:studentId/courses", async (req, res) => {
  const { studentId } = req.params;
  const session = driver.session();

  try {
    const query = `
      MATCH (s:Student {studentId: $studentId})-[:ENROLLED_IN]->(c:Course)
      RETURN s, collect(c) AS courses
    `;
    const result = await session.run(query, { studentId });

    if (result.records.length === 0) {
      return res.status(404).json({ message: "Student not found or no courses" });
    }

    const record = result.records[0];
    const student = record.get("s").properties;
    const courses = record.get("courses").map((courseNode) => courseNode.properties);

    res.json({ student, courses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    await session.close();
  }
});

app.get("/api/course/:courseCode/students", async (req, res) => {
  const { courseCode } = req.params;
  const session = driver.session();

  try {
    const query = `
      MATCH (s:Student)-[:ENROLLED_IN]->(c:Course {courseCode: $courseCode})
      RETURN c, collect(s) AS students
    `;
    const result = await session.run(query, { courseCode });

    if (result.records.length === 0) {
      return res.status(404).json({ message: "Course not found or no students" });
    }

    const record = result.records[0];
    const course = record.get("c").properties;
    const students = record.get("students").map((studentNode) => studentNode.properties);

    res.json({ course, students });
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    await session.close();
  }
});

app.use(async (req, res, next) => {
  if (req.path.startsWith("/api") || req.path === "/health") {
    return next();
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

async function start() {
  const session = driver.session();
  try {
    // Create constraints once so duplicate IDs are prevented.
    await session.run("CREATE CONSTRAINT student_studentId IF NOT EXISTS FOR (s:Student) REQUIRE s.studentId IS UNIQUE");
    await session.run("CREATE CONSTRAINT course_courseCode IF NOT EXISTS FOR (c:Course) REQUIRE c.courseCode IS UNIQUE");
  } finally {
    await session.close();
  }

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

start().catch(async (error) => {
  console.error("Failed to start server:", error.message);
  await driver.close();
  process.exit(1);
});

process.on("SIGINT", async () => {
  await driver.close();
  process.exit(0);
});
