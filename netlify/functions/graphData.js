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
    driver = createDriver();
    session = driver.session();

    const result = await session.run(`
      MATCH (n) 
      OPTIONAL MATCH (n)-[r]-(m) 
      RETURN collect(DISTINCT n) AS nodes, collect(r) AS relationships, collect(DISTINCT m) AS relatedNodes
    `);

    const allNodes = new Map();
    const edges = [];

    if (result.records.length > 0) {
      const record = result.records[0];
      const nodes = record.get("nodes");
      const relationships = record.get("relationships");

      nodes.forEach((node) => {
        const labels = node.labels[0] || "Node";
        const props = node.properties;
        const id = node.identity.toNumber();

        let label = "";
        let color = "#999";

        if (labels === "Student") {
          label = props.name || "Unknown";
          color = "#c46a2a";
        } else if (labels === "Course") {
          label = props.courseCode || "Unknown";
          color = "#5c6bc0";
        }

        allNodes.set(id, {
          id,
          label,
          color,
          title: `${labels}: ${Object.entries(props)
            .map(([k, v]) => `${k}=${v}`)
            .join(", ")}`,
        });
      });

      relationships.forEach((rel) => {
        if (rel) {
          edges.push({
            from: rel.start.toNumber(),
            to: rel.end.toNumber(),
            label: rel.type,
            arrows: "to",
          });
        }
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        nodes: Array.from(allNodes.values()),
        edges,
      }),
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
