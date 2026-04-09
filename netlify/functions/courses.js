const neo4j = require("neo4j-driver");

const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USER;
const password = process.env.NEO4J_PASSWORD;

if (!uri || !user || !password) {
  throw new Error("Missing Neo4j environment variables");
}

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

exports.handler = async (event, context) => {
  const session = driver.session();
  
  try {
    if (event.httpMethod === "GET") {
      const query = `
        MATCH (c:Course)
        RETURN c
        ORDER BY c.courseCode
      `;
      const result = await session.run(query);
      const courses = result.records.map((record) => record.get("c").properties);

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courses),
      };
    } else if (event.httpMethod === "POST") {
      const { title, courseCode } = JSON.parse(event.body);

      if (!title || !courseCode) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "title and courseCode are required" }),
        };
      }

      const query = `
        MERGE (c:Course {courseCode: $courseCode})
        SET c.title = $title
        RETURN c
      `;
      const result = await session.run(query, { title, courseCode });
      const course = result.records[0].get("c").properties;

      return {
        statusCode: 201,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(course),
      };
    } else {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: "Method not allowed" }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message }),
    };
  } finally {
    await session.close();
  }
};
