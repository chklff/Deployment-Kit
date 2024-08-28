// src/api/initiate-flow.js
import prisma from '../utils/db.js';
import { initiateFlow } from '../utils/makeApi.js';

export default async function initiateFlowHandler(req, res) {
  const { templateId, userId } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { teamId } = user;

    const flowData = await initiateFlow(templateId, teamId);

    const flow = await prisma.flow.create({
      data: {
        flowId: flowData.flow.id,
        templateId,
        userId: user.id,
        publicUrl: flowData.publicUrl,
        status: 'initialized',
      },
    });

    res.status(200).json({ publicUrl: flow.publicUrl });
  } catch (error) {
    console.error('Error in initiateFlowHandler:', error);
    res.status(500).json({ error: 'An error occurred while initiating the flow' });
  }
}