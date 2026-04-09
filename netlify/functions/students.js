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
        MATCH (s:Student)
        RETURN s
        ORDER BY s.name
      `;
      const result = await session.run(query);
      const students = result.records.map((record) => record.get("s").properties);

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(students),
      };
    } else if (event.httpMethod === "POST") {
      const { name, studentId } = JSON.parse(event.body);

      if (!name || !studentId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "name and studentId are required" }),
        };
      }

      const query = `
        MERGE (s:Student {studentId: $studentId})
        SET s.name = $name
        RETURN s
      `;
      const result = await session.run(query, { name, studentId });
      const student = result.records[0].get("s").properties;

      return {
        statusCode: 201,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student),
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
