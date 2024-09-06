// src/api/initiate-flow.js
import prisma from '../utils/db.js';
import { initiateFlow, createWebhook } from '../utils/makeApi.js';

export default async function initiateFlowHandler(req, res) {
  const { templateId, versionId, userId } = req.body;

  try {
    // Find the user
    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { teamId } = user;
    
    console.log('team found: ', teamId);

    // Retrieve the integration record by templateId
    const integration = await prisma.integration.findUnique({ where: { templateId } });
    if (!integration) {
      return res.status(404).json({ error: 'Integration not found for the given templateId' });
    }
    console.log('integration found: ', JSON.stringify(integration));

    let prefill = { hard: {}, soft: {} };  // Prefill will be used only if hookId exists

    // Step 1: If hookId exists, create a webhook
    let webhookResponse = null;
    if (integration.hookId) {
      const webhookData = {
        name: `${integration.name}-${userId}`,  // Template name + userId
        method: false,
        teamId: teamId,  // Use the teamId from the integration
        headers: false,
        typeName: 'gateway-webhook',
        stringify: false,
      };

      webhookResponse = await createWebhook(webhookData);

      // Update the prefill object with the newly created webhook ID
      prefill.hard[integration.hookId] = webhookResponse.hook.id;  // Assign the webhook ID to prefill
    }
    
    const webhookId = webhookResponse?.hook?.id || null;  // Ensure webhookId is handled properly

    // Step 2: Initiate the flow (with prefill if hookId exists, otherwise without prefill)
    const flowData = await initiateFlow(versionId, teamId, webhookId ? prefill : {});  // Use prefill if webhookId exists
    const flowId = flowData.flow.id;
    

    // Step 4: Save the flow information to the database
    const flow = await prisma.flow.create({
      data: {
        flowId: flowId,  // Use the flowId from flowData
        templateId,
        versionId,
        userId: user.id,
        publicUrl: flowData.publicUrl,
        status: 'initialized',
      },
    });

    // Step 4: Insert the new webhook record into the Webhook table (WITHOUT `actionId` for now)
    if (webhookId) {
      await prisma.webhook.create({
        data: {
          flow: {
            connect: { flowId: flowId },  // Connect the existing flow using the flowId
          },
          user: {
            connect: { userId: userId },  // Connect the existing user using the user.id
          },    
          url: webhookResponse.hook.url,  // Webhook URL from response
          scenario: undefined,  // Use the scenario relation properly
          webhookId: webhookId,  // ID of the created webhook
          isActive: true,
          // Skip the actionId and action relation for now
        },
      });

      console.log(`Webhook record created for flow: ${flowId}`);
    }


    // Step 5: Return the public URL to the client
    res.status(200).json({ publicUrl: flow.publicUrl });
  } catch (error) {
    console.error('Error in initiateFlowHandler:', error);
    res.status(500).json({ error: 'An error occurred while initiating the flow' });
  }
}