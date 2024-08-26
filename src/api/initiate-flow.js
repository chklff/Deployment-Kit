// src/api/initiate-flow.js

import prisma from '../utils/db.js';
import { initiateFlow } from '../utils/makeApi.js';

export default async function initiateFlowHandler(req, res) {
  const { templateId, userId, redirectUri } = req.body;

  const user = await prisma.user.findUnique({ where: { userId } });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const flowData = await initiateFlow(templateId, user.teamId, redirectUri);

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
}
