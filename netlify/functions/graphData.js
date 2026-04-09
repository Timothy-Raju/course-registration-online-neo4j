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

  const session = driver.session();
  try {
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nodes: Array.from(allNodes.values()),
        edges,
      }),
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
