// src/api/callback.js
import prisma from '../utils/db.js';
import { processFlow } from '../utils/makeApi.js';

export default async function callbackHandler(req, res) {
  const { flowId } = req.query;

  const flow = await prisma.flow.findUnique({ where: { flowId } });

  if (!flow) {
    return res.status(404).json({ error: 'Flow not found' });
  }

  const flowData = await processFlow(flow.flowId);

  await prisma.flow.update({
    where: { id: flow.id },
    data: { status: 'complete' },
  });

  res.status(200).json({ status: 'Flow completed' });
}
