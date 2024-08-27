
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

import { createTeam } from '../utils/makeApi.js';

import prisma from '../utils/db.js';


export default async function getTemplates(req, res) {
  const userId = req.query.userId;

  console.log(process.env.MAKE_ORG_ID)

  let user = await prisma.user.findUnique({ where: { userId } });
  
  if (!user) {

    // Creating a new team
    const team = await createTeam(`Team for ${userId}`, process.env.MAKE_ORG_ID);
    console.log(JSON.stringify(team, null, 2));

    // Extracting the team ID correctly
    const teamId = team.team.id;

    // Creating a new user with the correct team ID
    user = await prisma.user.create({
      data: { userId, teamId },
    });

    console.log(`User created successfully: ${JSON.stringify(user)}`);
  } else {
    console.log(`Found user: ${JSON.stringify(user, null, 2)}`);
  }

  // Fetch all records from the Integration table
  const integrations = await prisma.integration.findMany();
  console.log(`Found integrations: ${JSON.stringify(integrations, null, 2)}`);

  res.status(200).json(integrations);
}
