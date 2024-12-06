import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./data-source";
import { Agency } from "./entities/Agency";
import { User } from "./entities/User";
import { esClient } from "./elasticsearch";
// import { UserAgency } from "./entities/UserAgency";
const { Pool } = require("pg");
import redisClient from './utils/broker/redis-client'
// import './utils/kafkaClient'
import { MessageBroker, UserEvent } from "./utils/broker/kafka-client";
import { Producer, Consumer } from "kafkajs";
import { faker } from "@faker-js/faker";
import { getRandomNumber } from "./utils/myutils";

// Set up the PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432, // Default PostgreSQL port
});




const app = express();
const PORT = 3000;

app.use(express.json());

// Function to fetch data
// async function fetchData(query:any, params:any) {
//   const cacheKey = `query:${query}:${JSON.stringify(params)}`;

//   // Check Redis cache
//   const cachedData = await redisClient.get(cacheKey);
//   if (cachedData) {
//     console.log('Cache hit');
//     return JSON.parse(cachedData); // Return cached result
//   }

//   console.log('Cache miss. Fetching from PostgreSQL...');
//   const result = await pool.query(query, params);

//   // Cache the result in Redis (set expiry as needed, e.g., 60 seconds)
//   await redisClient.setEx(cacheKey, 60, JSON.stringify(result.rows));

//   return result.rows;
// }

AppDataSource.initialize()
  .then(async () => {
    app.use(express.json());

    console.log("Connected to the database!");
    // 1st step: connect to the producer and consumer
    const producer = await MessageBroker.connectProducer<Producer>();
    producer.on("producer.connect", () => {
      console.log("producer connected");
    });

    const consumer = await MessageBroker.connectConsumer<Consumer>();
    consumer.on("consumer.connect", () => {
      console.log("consumer connected");
    });

    // 2nd step: subscribe to the topic or publish the message
    MessageBroker.subscribe(async (message) => {
      console.log("Consumer received the message");
      console.log("Message received", message);

      const userRepository = AppDataSource.getRepository(User);

      const { savedUser } = message.data;

      const user = await userRepository.findOne({
        where: { id: savedUser.id },
        relations: ["agency"],
      });

      if (user) {
        // Index user in Elasticsearch
        esClient.index({
          index: "users",
          id: user.id.toString(),
          document: {
            id: user.id,
            name: user.name,
            email: user.email,
            agency: {
              id: user.agency.id,
              name: user.agency.name,
              address: user.agency.address,
            },
          },
        });

        // console.log(`${user.id} User saved in elasticsearch`)
      }
    }, "UserEvents");

    // Get all users
    app.get("/users", async (req, res) => {
      const userRepository = AppDataSource.getRepository(User);
      const users = await userRepository.find({ relations: ["agency"] });

      res.json(users);
    });

    // Create a user
    app.post("/users", async (req, res) => {
      try {
        const userRepository = AppDataSource.getRepository(User);
        const user = userRepository.create({
          name: faker.person.fullName(),
          email: faker.internet.email(),
          agency: getRandomNumber(1, 35),
        });

        const savedUser = await userRepository.save(user);

        // 3rd step: publish the message
        await MessageBroker.publish({
          topic: "UserEvents",
          // headers: { token: req.headers.authorization },
          event: UserEvent.CREATE_USER,
          message: {
            savedUser,
          },
        });

        res.json(savedUser);
      } catch (error) {
        console.log("eror in creating users", error);
      }
    });

    // Get user by name
    app.get("/users/:name", async (req, res) => {
      try {
        const client = await pool.connect();
        // console.log('clinet', client)
        const { name } = req.params;
        const userRepository = AppDataSource.getRepository(User);
        const users = await userRepository.find({
          where: { name: name },
          relations: ["agency"],
        });
        // const query = `
        // SELECT
        //   t.*,
        //   a.*
        //   FROM "user" t
        //   INNER JOIN agency a
        //   ON "t.agencyId" = a.Id
        //   WHERE t.name LIKE $1
        // `;
        // const query = `
        //   SELECT column_name
        //   FROM information_schema.columns
        //   WHERE table_name = 'user'
        //   ORDER BY ordinal_position;

        // `;
        // const values:any = []; // Search term with wildcards

        // const result = await client.query(query, values);
        // res.json(result.rows);
        res.json(users);
      } catch (error) {
        console.log("error", error);
      }
    });

    // Get all agencies
    app.get("/agencies", async (req, res) => {
      const agencyRepository = AppDataSource.getRepository(Agency);
      const agencies = await agencyRepository.find({ relations: ["users"] });
      res.json(agencies);
    });

    // Get users by agency
    app.get("/agencies/:id/users", async (req, res) => {
      const { id } = req.params;
      const userRepository = AppDataSource.getRepository(User);
      const users = await userRepository.find({
        where: { agency: { id: <any>id } },
      });
      res.json(users);
    });

    const getUsersFromElastic = async (
      req: { body: any },
      res: { body: { hits: { hits: any } } }
    ) => {
      try {
        console.log("req from elastic", req.body);
        // Fetch data from the 'users' index
        const response = await esClient.search({
          index: "users",
          body: {
            query: {
              match_all: {}, // This will fetch all documents
            },
          },
        });

        // Output the result
        console.log("Fetched data from 'users' index:", res.body.hits.hits);
        return res.body.hits.hits;
      } catch (error) {
        console.error("Error fetching data from Elasticsearch:", error);
      }
    };

    app.get("/get-users-from-elastic", getUsersFromElastic);

    // const postUser = async (req: { body: { name: any; email: any; agencyId: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: User): void; new(): any; }; }; }) => {
    //     try {
    //             const { name, email, agencyId } = req.body;  // Accept phoneNumber now

    //             const userRepository = AppDataSource.getRepository(User);
    //             const agencyRepository = AppDataSource.getRepository(Agency);

    //             // Find the associated agency
    //             const agency = await agencyRepository.findOneBy({ id: agencyId });
    //             if (!agency) {
    //                 return res.status(404).json({ error: "Agency not found" });
    //             }

    //             // Save user in PostgreSQL
    //             const user = userRepository.create({ name, email, agency });
    //             const savedUser = await userRepository.save(user);

    //             // Index user in Elasticsearch
    //             await esClient.index({
    //                 index: "users",
    //                 id: savedUser.id.toString(),
    //                 document: {
    //                 id: savedUser.id,
    //                 name: savedUser.name,
    //                 email: savedUser.email,
    //                 agency: {
    //                     id: agency.id,
    //                     name: agency.name,
    //                     address: agency.address,
    //                 },
    //                 // phoneNumber, // Index the phoneNumber in Elasticsearch
    //                 },
    //             });

    //             console.log(`User ${savedUser.id} indexed in Elasticsearch`);
    //             res.status(201).json(savedUser);
    //             } catch (error) {
    //                 console.error("Error saving user:", error);
    //                 res.status(500).json({ error: "An error occurred" });
    //             }
    //   }

    // app.post("/users", postUser);

    // Create a new user
    // app.post("/users", async (req, res) => {
    //     try {
    //     const { name, email, agencyId, phoneNumber } = req.body;  // Accept phoneNumber now

    //     const userRepository = AppDataSource.getRepository(User);
    //     const agencyRepository = AppDataSource.getRepository(Agency);

    //     // Find the associated agency
    //     const agency = await agencyRepository.findOneBy({ id: agencyId });
    //     if (!agency) {
    //         return res.status(404).json({ error: "Agency not found" });
    //     }

    //     // Save user in PostgreSQL
    //     const user = userRepository.create({ name, email, agency });
    //     const savedUser = await userRepository.save(user);

    //     // Index user in Elasticsearch
    //     await esClient.index({
    //         index: "users",
    //         id: savedUser.id.toString(),
    //         document: {
    //         id: savedUser.id,
    //         name: savedUser.name,
    //         email: savedUser.email,
    //         agency: {
    //             id: agency.id,
    //             name: agency.name,
    //             address: agency.address,
    //         },
    //         phoneNumber, // Index the phoneNumber in Elasticsearch
    //         },
    //     });

    //     console.log(`User ${savedUser.id} indexed in Elasticsearch`);
    //     res.status(201).json(savedUser);
    //     } catch (error) {
    //         console.error("Error saving user:", error);
    //         res.status(500).json({ error: "An error occurred" });
    //     }
    // });

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => console.error("Database connection error:", error));
