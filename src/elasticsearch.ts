import { Client } from "@elastic/elasticsearch";

export const esClient = new Client({
    node: process.env.ELASTICSEARCH_NODE,  // URL of your Elasticsearch cluster
    auth: {
      username: process.env.ELASTICSEARCH_USERNAME || "elastic",  // Your Elasticsearch username
      password: process.env.ELASTICSEARCH_PASSWORD || "nm5cEWcc",  // Your Elasticsearch password
    },
    // ssl: { ̰
    //   rejectUnauthorized: false,  // If using self-signed certificates, set this to false
    // },
  });

// Function to update mappings programmatically
export const updateElasticsearchMapping = async () => {
  try {
    // Check if the 'users' index exists
    const indexExists = await esClient.indices.exists({ index: "users" });
    console.log('checking if index exists', indexExists)
    if (indexExists) {
      // Index exists, update mappings
      console.log("Updating Elasticsearch mappings for the 'users' index...");

      const mappingResponse = await esClient.indices.putMapping({
        index: "users",
        body: {
          properties: {
            name: { type: "keyword" }, // Example of adding a new field (phoneNumber)
            email: { type: "keyword" }, // Example of adding a new field (phoneNumber)
            agency: {
              properties: {
                name: { type: "keyword" }, // Example of adding a new field (phoneNumber)
                address: { type: "keyword" },
              },
            },
          },
        },
      });

      console.log("Mappings updated:", mappingResponse);
    } else {
    //   console.log("Index 'users' does not exist.");
    const mappingResponse = await esClient.indices.create({
        index: "users",
        body: {
            settings: {
              number_of_shards: 1,
              number_of_replicas: 1,
            },
            mappings: {
                properties: {
                  name: { type: "keyword" }, // Example of adding a new field (phoneNumber)
                  email: { type: "keyword" }, // Example of adding a new field (phoneNumber)
                  agency: {
                    properties: {
                      name: { type: "keyword" }, // Example of adding a new field (phoneNumber)
                      address: { type: "keyword" },
                    },
                  },
                },
            },
        } 
      });
    }



    // Check if the 'project' index exists
    const projectIndexExists = await esClient.indices.exists({ index: "projects" });
    console.log('checking if project index exists', projectIndexExists)
    if (projectIndexExists) {
      // Index exists, update mappings
      console.log("Updating Elasticsearch mappings for the 'projects' index...");

      const mappingResponse = await esClient.indices.putMapping({
        index: "projects",
        body: {
            properties: {
                projectName: { type: "keyword" }, // Example of adding a new field (phoneNumber)
                type: { type: "keyword" }, // Example of adding a new field (phoneNumber)
                agency: {
                  properties: {
                    name: { type: "keyword" }, // Example of adding a new field (phoneNumber)
                    address: { type: "keyword" },
                  },
                },
            },
        },
      });

      console.log("Mappings updated:", mappingResponse);
    } else {
    //   console.log("Index 'users' does not exist.");
        const mappingResponse = await esClient.indices.create({
            index: "projects",
            body: {
                settings: {
                  number_of_shards: 1,
                  number_of_replicas: 1,
                },
                mappings: {
                    properties: {
                        projectName: { type: "keyword" }, // Example of adding a new field (phoneNumber)
                        type: { type: "keyword" }, // Example of adding a new field (phoneNumber)
                        agency: {
                        properties: {
                            name: { type: "keyword" }, // Example of adding a new field (phoneNumber)
                            address: { type: "keyword" },
                        },
                        },
                    },
                },
              }
        });
    }
  } catch (error) {
    console.error("Error updating Elasticsearch mappings:", error);
  }
};
