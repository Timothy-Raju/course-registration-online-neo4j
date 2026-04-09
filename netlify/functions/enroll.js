const neo4j = require("neo4j-driver");

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function createDriver() {
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER;
  const password = process.env.NEO4J_PASSWORD;

  if (!uri || !user || !password) {
    throw new Error("Missing Neo4j environment variables: NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD");
  }

  return neo4j.driver(uri, neo4j.auth.basic(user, password));
}

exports.handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  let driver, session;
  try {
    let payload;
    try {
      payload = JSON.parse(event.body || "{}");
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Invalid JSON in request body" }),
      };
    }

    const { studentId, courseCode } = payload;

    if (!studentId || !courseCode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "studentId and courseCode are required" }),
      };
    }

    driver = createDriver();
    session = driver.session();

    const result = await session.run(
      `MATCH (s:Student {studentId: $studentId})
       MATCH (c:Course {courseCode: $courseCode})
       MERGE (s)-[:ENROLLED_IN]->(c)
       RETURN s, c`,
      { studentId, courseCode }
    );

    if (result.records.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          message: "Student or Course not found. Create both before enrollment.",
        }),
      };
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ message: "Enrollment successful" }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: error.message || "Internal server error" }),
    };
  } finally {
    if (session) await session.close();
    if (driver) await driver.close();
  }
};
