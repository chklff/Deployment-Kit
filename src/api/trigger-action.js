import prisma from '../utils/db.js';
import { triggerWebhook } from '../utils/makeApi.js';

export default async function triggerActionHandler(req, res) {
  const { action, userId } = req.body;

  // Find the relevant flow/scenario and trigger the webhook
  const flow = await prisma.flow.findFirst({ where: { userId, status: 'complete' } });

  if (!flow) {
    return res.status(404).json({ error: 'Flow not found' });
  }

  const webhook = await prisma.webhook.findUnique({ where: { flowId: flow.id } });

  if (!webhook) {
    return res.status(404).json({ error: 'Webhook not found' });
  }

  await triggerWebhook(webhook.url, action);

  res.status(200).json({ status: 'Action triggered' });
}