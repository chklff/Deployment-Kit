
// src/api/templates.js
// import prisma from '../utils/db.js';
// import { createTeam } from '../utils/makeApi.js';

// export default async function getTemplates(req, res) {
//   const userId = req.query.userId;

//   let user = await prisma.user.findUnique({ where: { userId } });

//   if (!user) {
//     // If user doesn't exist, create a new user and team in Make
//     const team = await createTeam(`Team for ${userId}`);
//     user = await prisma.user.create({
//       data: { userId, teamId: team.id },
//     });
//   } else {
//     // If user already exists, fetch their team
//     user = await prisma.integration.findMany({
//       where: { userId },
//       data: { teamId: user.teamId },
//     });
//   } 

//   // Fetch templates from the database or external API if necessary
//   const templates = await prisma.template.findMany();
//   res.status(200).json(templates);
// }



// import { createTeam } from '../utils/makeApi.js';

// import prisma from '../utils/db.js';


// export default async function getTemplates(req, res) {
//   const userId = req.query.userId;

//   console.log(process.env.MAKE_ORG_ID)

//   let user = await prisma.user.findUnique({ where: { userId } });
  
//   if (!user) {

//     // Creating a new team
//     const team = await createTeam(`Team for ${userId}`, process.env.MAKE_ORG_ID);
//     console.log(JSON.stringify(team, null, 2));

//     // Extracting the team ID correctly
//     const teamId = team.team.id;

//     // Creating a new user with the correct team ID
//     user = await prisma.user.create({
//       data: { userId, teamId },
//     });

//     console.log(`User created successfully: ${JSON.stringify(user)}`);
//   } else {
//     console.log(`Found user: ${JSON.stringify(user, null, 2)}`);
//   }

//   // Fetch all records from the Integration table
//   const integrations = await prisma.integration.findMany();
//   console.log(`Found integrations: ${JSON.stringify(integrations, null, 2)}`);

//   res.status(200).json(integrations);
// }

import { createTeam, getTeamTemplates } from '../utils/makeApi.js';
import prisma from '../utils/db.js';

export default async function getTemplates(req, res) {
  const userId = req.query.userId;

  console.log(process.env.MAKE_ORG_ID);

  // Find or create user
  let user = await prisma.user.findUnique({ where: { userId } });
  
  if (!user) {
    // User does not exist, create a new team and user
    const team = await createTeam(`Team for ${userId}`, process.env.MAKE_ORG_ID);
    console.log(JSON.stringify(team, null, 2));

    // Extract the team ID
    const teamId = team.team.id;

    // Create a new user with the correct team ID
    user = await prisma.user.create({
      data: { userId, teamId },
    });

    console.log(`User created successfully: ${JSON.stringify(user)}`);
  } else {
    console.log(`Found user: ${JSON.stringify(user, null, 2)}`);
  }
// Fetch templates for the user's team
const teamTemplates = await getTeamTemplates(user.teamId);
console.log(`Fetched templates: ${JSON.stringify(teamTemplates, null, 2)}`);

// Fetch all records from the Integration table
const integrations = await prisma.integration.findMany();
console.log(`Found integrations: ${JSON.stringify(integrations, null, 2)}`);

// Process templates and update Integration table
for (const template of teamTemplates) {
  const existingIntegration = integrations.find(integration => integration.templateId === template.id);

  if (existingIntegration) {
    const isChanged = existingIntegration.versionId !== (template.isInstanceable ? 1 : 0) || 
                      existingIntegration.name !== template.name.en;

    if (isChanged) {
      await prisma.integration.update({
        where: { id: existingIntegration.id },
        data: {
          name: template.name.en,
          versionId:  template.instanceableId,
          description: template.description.en || existingIntegration.description,
          updatedAt: new Date(),
        },
      });
      console.log(`Updated integration: ${existingIntegration.name}`);
    }
  } else {
    try {
      // Create a new integration record
      await prisma.integration.create({
        data: {
          name: template.name.en,
          templateId: template.id,
          versionId: template.instanceableId,
          description: template.description.en || 'No description provided',
          imageUrl: 'https://x.com/..', // Replace with actual image URL or logic to fetch it
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`Created new integration: ${template.name.en}`);
    } catch (error) {
      console.error(`Error creating integration for template ${template.id}:`, error.message);
    }
  }
}

// Fetch updated list of integrations
const updatedIntegrations = await prisma.integration.findMany();
res.status(200).json(updatedIntegrations);
}