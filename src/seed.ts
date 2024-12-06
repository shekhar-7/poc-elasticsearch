import { AppDataSource } from "./data-source";
import { Agency } from "./entities/Agency";
import { User } from "./entities/User";
import { esClient } from "./elasticsearch";
import { faker } from "@faker-js/faker";
import { updateElasticsearchMapping } from "./elasticsearch";  // Import the function
import { Project } from "./entities/Project";
// import { UserAgency } from "./entities/UserAgency";
import { kafkaProducer } from './utils/kafkaClient'
import { getRandomNumber, getRandomRole, generateRandomString } from "./utils/myutils";


const seedDatabase = async () => {
  try {
    // First, ensure the mappings are up-to-date
    // await updateElasticsearchMapping();

    await AppDataSource.initialize();
    console.log("Database connection established!");

    const agencyRepository = AppDataSource.getRepository(Agency);
    const userRepository = AppDataSource.getRepository(User);
    const projectRepository = AppDataSource.getRepository(Project);
    // const userAgencyRepository = AppDataSource.getRepository(UserAgency);

    // Create 5 agencies
    const agencies: Agency[] = [];
    const allAgencies = await agencyRepository.count()
    // for (let i = 0; i < 5; i++) {
    //   const agency = agencyRepository.create({
    //     name: faker.company.name(),
    //     address: faker.location.streetAddress(),
    //   });
    //   agencies.push(await agencyRepository.save(agency));
    // }

    // Create 20 users and index them in Elasticsearch
    for (let i = 0; i < 10; i++) {
      // const userAgency = userAgencyRepository.create({
      //   user: getRandomNumber(1, 500),
      //   agency: getRandomNumber(1, 35)
      // })
      // const saveUserAgency = await userAgencyRepository.save(userAgency)
      const user = userRepository.create({
        // name: faker.person.fullName() + 'v',
        name: generateRandomString(),
        // email: faker.internet.email(),
        email: generateRandomString()+'@gmail.com',
        // agency: agencies[Math.floor(Math.random() * agencies.length)],
        agency: getRandomNumber(1, allAgencies)
      });

      const savedUser = await userRepository.save(user);

      if(i%2===0) {
        const project = projectRepository.create({
            // projectName: faker.company.name(),
            projectName: generateRandomString(),
            type: getRandomRole(),
            // agency: agencies[Math.floor(Math.random() * agencies.length)],
            agency: getRandomNumber(1, allAgencies)
        });
        const savedProject = await projectRepository.save(project);

        // // Send event to Kafka (fire-and-forget)
        // kafkaProducer.send(
        //   [{
        //     topic: 'postgres_records',
        //     messages: [{
        //       value: JSON.stringify({
        //         type: 'project', 
        //         data: { savedProject, savedUser }
        //       })
        //     }]
        //   }],
        //   (err:any, data:any) => {
        //     if (err) {
        //       console.error('Error sending message to Kafka:', err);
        //     } else {
        //       console.log('Project sent to Kafka:', data);
        //     }
        //   }
        // );

        // await esClient.index({
        //     index: "projects",
        //     id: savedProject.id.toString(),
        //     document: {
        //         id: savedProject.id,
        //         name: savedProject.projectName,
        //         type: savedProject.type,
        //         agency: {
        //             id: savedUser.agency.id,
        //             name: savedUser.agency.name,
        //             address: savedUser.agency.address,
        //         },
        //     },
        // });

        console.log(`Project ${savedUser.id} indexed in Elasticsearch`);
      }


      // // Index user in Elasticsearch
      await esClient.index({
        index: "users",
        id: savedUser.id.toString(),
        document: {
          id: savedUser.id,
          name: savedUser.name,
          email: savedUser.email,
          agency: {
            id: savedUser.agency.id,
            name: savedUser.agency.name,
            address: savedUser.agency.address,
          },
        },
      });

      console.log(`User ${savedUser.id} indexed in Elasticsearch`);
    }

    console.log("Database and Elasticsearch seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database and Elasticsearch:", error);
    process.exit(1);
  }
};

seedDatabase();
