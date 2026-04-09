const neo4j = require("neo4j-driver");

const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USER;
const password = process.env.NEO4J_PASSWORD;

if (!uri || !user || !password) {
  throw new Error("Missing Neo4j environment variables");
}

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  const { studentId, courseCode } = JSON.parse(event.body);

  if (!studentId || !courseCode) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "studentId and courseCode are required" }),
    };
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
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Student or Course not found. Create both before enrollment.",
        }),
      };
    }

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Enrollment successful" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message }),
    };
  } finally {
    await session.close();
  }
};
