const kafka = require('kafka-node');
const { Consumer } = kafka;
import { esClient } from "../elasticsearch";
const Admin = kafka.Admin;

const kafkaClient = new kafka.KafkaClient({ kafkaHost: 'localhost:9092', autoCreateTopics: true });


// Initialize Kafka Admin to create topic if it doesn't exist
// Create an Admin instance
const admin = new Admin(kafkaClient);

export async function createTopicIfNotExists() {
  // await admin.connect();

  const topicExists = await admin.listTopics();
  console.log('topsic', await admin.listTopics())
  if (!topicExists.includes('postgres_records')) {
    await admin.createTopics({
      topics: [{ topic: 'postgres_records', numPartitions: 1, replicationFactor: 1 }],
    });
    console.log("Created topic: postgres_records");
  }

  await admin.disconnect();
}

createTopicIfNotExists()

// Kafka Setup
export const kafkaProducer = new kafka.Producer(kafkaClient);

// Kafka Consumer Setup
export const kafkaConsumer = new Consumer(
    kafkaClient,
    [{ topic: 'postgres_records', partition: 0 }],
    {
      autoCommit: true,
      
    }
);


// Handle incoming messages
kafkaConsumer.on('message', async (message:any) => {
  try {
    const parsedMessage = JSON.parse(message.value);
    console.log('Received message:', parsedMessage);

    // Process the message (for example, update Elasticsearch or PostgreSQL)
    if (parsedMessage.type === 'project') {
      const projectData = parsedMessage.data;

      // Example of handling project data
      // Save project data to Elasticsearch or database, etc.
      console.log(`Processing project data: ${projectData}`);

      // Perform necessary actions such as saving to Elasticsearch, updating a database, etc.

      // await esClient.index({
      //       index: "projects",
      //       id: projectData.id.toString(),
      //       document: {
      //           id: projectData.savedProject.id,
      //           name: projectData.savedProject.projectName,
      //           type: projectData.savedProject.type,
      //           agency: {
      //               id: projectData.savedUser.agency.id,
      //               name: projectData.savedUser.agency.name,
      //               address: projectData.savedUser.agency.address,
      //           },
      //     },
      // });
    }

    // You can also log successful processing or send success status back to Kafka or another system
    // kafkaProducer.send([{ topic: 'status_topic', messages: ['Message processed successfully'] }]);

  } catch (error) {
    console.error('Error processing message:', error);
  }
});

// Handle consumer errors
kafkaConsumer.on('error', (err:any) => {
  console.error('Error in Kafka consumer:', err);
});

// Handle producer errors
kafkaProducer.on('error', (err:any) => {
  console.error('Error in Kafka producer:', err);
});



// module.exports = { kafkaConsumer, kafkaProducer };