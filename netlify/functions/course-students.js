const neo4j = require("neo4j-driver");

const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USER;
const password = process.env.NEO4J_PASSWORD;

if (!uri || !user || !password) {
  throw new Error("Missing Neo4j environment variables");
}

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

exports.handler = async (event, context) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  const courseCode = event.path.split("/").pop();
  const session = driver.session();

  try {
    const query = `
      MATCH (s:Student)-[:ENROLLED_IN]->(c:Course {courseCode: $courseCode})
      RETURN c, collect(s) AS students
    `;
    const result = await session.run(query, { courseCode });

    if (result.records.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Course not found or no students" }),
      };
    }

    const record = result.records[0];
    const course = record.get("c").properties;
    const students = record.get("students").map((studentNode) => studentNode.properties);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course, students }),
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
