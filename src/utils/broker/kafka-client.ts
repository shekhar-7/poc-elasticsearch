import { Consumer, Kafka, logLevel, Partitioners, Producer } from "kafkajs";

// types
export enum UserEvent {
  CREATE_USER = "create_user",
  DELETE_USER = "delete_user",
}

export type TOPIC_TYPE = "UserEvents" | "ProjectEvents";

export interface MessageType {
  headers?: Record<string, any>;
  event: UserEvent;
  data: Record<string, any>;
}

export interface PublishType {
  // headers: Record<string, any>;
  topic: TOPIC_TYPE;
  event: UserEvent;
  message: Record<string, any>;
}

export type MessageHandler = (input: MessageType) => void;

export type MessageBrokerType = {
  // producer
  connectProducer: <T>() => Promise<T>;
  disconnectProducer: () => Promise<void>;
  publish: (data: PublishType) => Promise<boolean>;

  // consumer
  connectConsumer: <T>() => Promise<T>;
  disconnectConsumer: () => Promise<void>;
  subscribe: (
    messageHandler: MessageHandler,
    topic: TOPIC_TYPE
  ) => Promise<void>;
};

// configuration properties
const CLIENT_ID = process.env.CLIENT_ID || "user-service";
const GROUP_ID = process.env.GROUP_ID || "user-service-group";
const BROKERS = [process.env.BROKER_1 || "localhost:9092"];

const kafka = new Kafka({
  clientId: CLIENT_ID,
  brokers: BROKERS,
  logLevel: logLevel.INFO,
});

let producer: Producer;
let consumer: Consumer;

const createTopic = async (topic: string[]) => {
  const topics = topic.map((t) => ({
    topic: t,
    numPartitions: 2,
    replicationFactor: 1, // based on available brokers
  }));

  const admin = kafka.admin();
  await admin.connect();
  const topicExists = await admin.listTopics();
  console.log("topicExists", topicExists);
  for (const t of topics) {
    if (!topicExists.includes(t.topic)) {
      await admin.createTopics({
        topics: [t],
      });
    }
  }
  await admin.disconnect();
};

const connectProducer = async <T>(): Promise<T> => {
  await createTopic(["UserEvents"]);

  if (producer) {
    console.log("producer already connected with existing connection");
    return producer as unknown as T;
  }

  producer = kafka.producer({
    createPartitioner: Partitioners.DefaultPartitioner,
  });

  await producer.connect();
  console.log("producer connected with a new connection");
  return producer as unknown as T;
};

const disconnectProducer = async (): Promise<void> => {
  if (producer) {
    await producer.disconnect();
  }
};

const publish = async (data: PublishType): Promise<boolean> => {
  const producer = await connectProducer<Producer>();
  const result = await producer.send({
    topic: data.topic,
    messages: [
      {
        // headers: data.headers,
        key: data.event,
        value: JSON.stringify(data.message),
      },
    ],
  });
  console.log("publishing result", result);
  return result.length > 0;
};

// Consumer functionality
const connectConsumer = async <T>(): Promise<T> => {
  if (consumer) {
    return consumer as unknown as T;
  }

  consumer = kafka.consumer({
    groupId: GROUP_ID,
  });

  await consumer.connect();
  return consumer as unknown as T;
};

const disconnectConsumer = async (): Promise<void> => {
  if (consumer) {
    await consumer.disconnect();
  }
};

const subscribe = async (
  messageHandler: MessageHandler,
  topic: TOPIC_TYPE
): Promise<void> => {
  try {
    console.log('subscribing cosnsumer')
    const consumer = await connectConsumer<Consumer>();
    await consumer.subscribe({ topic: topic, fromBeginning: true });

    consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        // console.log("message----->", message);
        if (topic !== "UserEvents") {
          return;
        }

        if (message.key && message.value) {
          const inputMessage: MessageType = {
            headers: message.headers,
            event: message.key.toString() as UserEvent,
            data: message.value ? JSON.parse(message.value.toString()) : null,
          };
          await messageHandler(inputMessage);
          await consumer.commitOffsets([
            {
              topic,
              partition,
              offset: (Number(message.offset) + 1).toString(),
            },
          ]);
        }
      },
    });
  } catch (error) {
    console.log("error in subscring the cosumer", error);
  }
};

export const MessageBroker: MessageBrokerType = {
  connectProducer,
  disconnectProducer,
  publish,
  connectConsumer,
  disconnectConsumer,
  subscribe,
};
