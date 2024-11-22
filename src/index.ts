import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./data-source";
import { Agency } from "./entities/Agency";
import { User } from "./entities/User";
import { esClient } from "./elasticsearch";

const app = express();
const PORT = 3000;

app.use(express.json());

AppDataSource.initialize()
  .then(() => {
    console.log("Connected to the database!");

    // Get all users
    app.get("/users", async (req, res) => {
      const userRepository = AppDataSource.getRepository(User);
      const users = await userRepository.find({ relations: ["agency"] });
      res.json(users);
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

    const getUsersFromElastic = async (req: { body: any; }, res: { body: { hits: { hits: any; }; }; }) => {
        try {
          console.log('req from elastic', req.body)
          // Fetch data from the 'users' index
          const response = await esClient.search({
            index: "users",
            body: {
              query: {
                match_all: {}  // This will fetch all documents
              }
            }
          });
      
          // Output the result
          console.log("Fetched data from 'users' index:", res.body.hits.hits);
          return res.body.hits.hits
        } catch (error) {
          console.error("Error fetching data from Elasticsearch:", error);
        }
    };

    app.get('/get-users-from-elastic', getUsersFromElastic)

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
