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
        MATCH (c:Course)
        RETURN c
        ORDER BY c.courseCode
      `);
      const courses = result.records.map((record) => record.get("c").properties);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(courses),
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

      const { title, courseCode } = payload;

      if (!title || !courseCode) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: "title and courseCode are required" }),
        };
      }

      const result = await session.run(
        `MERGE (c:Course {courseCode: $courseCode})
         SET c.title = $title
         RETURN c`,
        { title, courseCode }
      );
      const course = result.records[0].get("c").properties;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(course),
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
