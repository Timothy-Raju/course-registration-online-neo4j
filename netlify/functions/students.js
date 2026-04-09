const neo4j = require("neo4j-driver");

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
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

  let driver, session;
  try {
    driver = createDriver();
    session = driver.session();

    if (event.httpMethod === "GET") {
      const result = await session.run(`
        MATCH (s:Student)
        RETURN s
        ORDER BY s.name
      `);
      const students = result.records.map((record) => record.get("s").properties);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(students),
      };
    } else if (event.httpMethod === "POST") {
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

      const { name, studentId } = payload;

      if (!name || !studentId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: "name and studentId are required" }),
        };
      }

      const result = await session.run(
        `MERGE (s:Student {studentId: $studentId})
         SET s.name = $name
         RETURN s`,
        { name, studentId }
      );
      const student = result.records[0].get("s").properties;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(student),
      };
    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ message: "Method not allowed" }),
      };
    }
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
