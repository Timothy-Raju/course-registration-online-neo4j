const neo4j = require("neo4j-driver");

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
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

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  let driver, session;
  try {
    const studentId =
      event.queryStringParameters?.studentId ||
      decodeURIComponent((event.path.match(/\/student\/([^/]+)\/courses$/)?.[1] || "").trim());

    if (!studentId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "studentId is required" }),
      };
    }

    driver = createDriver();
    session = driver.session();

    const result = await session.run(
      `MATCH (s:Student {studentId: $studentId})-[:ENROLLED_IN]->(c:Course)
       RETURN s, collect(c) AS courses`,
      { studentId }
    );

    if (result.records.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: "Student not found or no courses" }),
      };
    }

    const record = result.records[0];
    const student = record.get("s").properties;
    const courses = record.get("courses").map((courseNode) => courseNode.properties);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ student, courses }),
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
