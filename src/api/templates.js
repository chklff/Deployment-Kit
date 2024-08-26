import prisma from '../utils/db.js'; // Note the .js extension
import { createTeam } from '../utils/makeApi.js'; // Note the .js extension

export default async function getTemplates(req, res) {
  const userId = req.query.userId;

  let user = await prisma.user.findUnique({ where: { userId } });

  if (!user) {
    // If user doesn't exist, create a new user and team in Make
    const team = await createTeam(`Team for ${userId}`);
    user = await prisma.user.create({
      data: { userId, teamId: team.id },
    });
  }

  // Fetch templates from the database or external API if necessary
  const templates = await prisma.template.findMany();
  res.status(200).json(templates);
}
