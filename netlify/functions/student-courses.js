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

  const studentId = event.path.split("/").pop();
  const session = driver.session();

  try {
    const query = `
      MATCH (s:Student {studentId: $studentId})-[:ENROLLED_IN]->(c:Course)
      RETURN s, collect(c) AS courses
    `;
    const result = await session.run(query, { studentId });

    if (result.records.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Student not found or no courses" }),
      };
    }

    const record = result.records[0];
    const student = record.get("s").properties;
    const courses = record.get("courses").map((courseNode) => courseNode.properties);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student, courses }),
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
