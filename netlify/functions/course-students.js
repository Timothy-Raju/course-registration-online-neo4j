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
    const courseCode = decodeURIComponent(event.path.split("/").pop());
    driver = createDriver();
    session = driver.session();

    const result = await session.run(
      `MATCH (s:Student)-[:ENROLLED_IN]->(c:Course {courseCode: $courseCode})
       RETURN c, collect(s) AS students`,
      { courseCode }
    );

    if (result.records.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: "Course not found or no students" }),
      };
    }

    const record = result.records[0];
    const course = record.get("c").properties;
    const students = record.get("students").map((studentNode) => studentNode.properties);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ course, students }),
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
