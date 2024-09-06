//src/api/callback.js
import prisma from '../utils/db.js';
import { processFlow, getWebhook } from '../utils/makeApi.js';

export default async function callbackHandler(req, res) {
  const { flowId } = req.query;

  if (!flowId) {
    return res.status(400).json({ error: 'Missing flowId parameter' });
  }

  try {
    // Find the flow from the database
    const flow = await prisma.flow.findUnique({ where: { flowId } });

    if (!flow) {
      return res.status(404).json({ error: 'Flow not found' });
    }

    // Fetch the flow data from the external API
    const flowData = await processFlow(flow.flowId);
    console.log('Flow data received:', JSON.stringify(flowData));

    // Extract scenarioId and webhookId from the response
    const scenarioId = flowData.flow.result?.scenarios?.[0]?.id || null; // Extract scenario ID
    const webhookId = flowData.flow.result?.hooks?.[0]?.id || null;      // Extract webhook ID

    let webhookUrl = null;

    // If webhookId exists, fetch the webhook details
    if (webhookId) {
      try {
        const webhookData = await getWebhook(webhookId);
        webhookUrl = webhookData.hook?.url || null;
        console.log('Webhook URL:', webhookUrl);

        // Check if a webhook already exists in the database with the same flowId and webhookId
        const existingWebhook = await prisma.webhook.findFirst({
          where: {
            flowId: flow.id,
            webhookId: webhookId
          }
        });

        // If webhook doesn't exist, create a new one
        if (!existingWebhook) {
          await prisma.webhook.create({
            data: {
              flowId: flow.id,
              actionId: null,  // Assuming you'll update this later based on your use case
              userId: flow.userId,  // Assuming the flow is linked to a user
              scenarioId: scenarioId ? scenarioId.toString() : null, // Store scenarioId as a string
              webhookId: webhookId,                                 // Store webhookId as an integer
              url: webhookUrl || null,                              // Store the webhook URL
              isActive: true
            }
          });
          console.log('Webhook created successfully.');
        } else {
          console.log('Webhook already exists, skipping creation.');
        }

      } catch (error) {
        console.error('Error fetching webhook details:', error);
      }
    }

    // Update the flow's status to complete
    await prisma.flow.update({
      where: { id: flow.id },
      data: { status: 'complete' },
    });

    // Respond with success status for the frontend to handle
    res.status(200).json({ status: 'Flow completed' });
  } catch (error) {
    console.error('Error in callbackHandler:', error);
    res.status(500).json({ error: 'An error occurred while processing the flow' });
  }
}