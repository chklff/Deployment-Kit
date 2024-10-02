//src/api/callback.js
import prisma from '../utils/db.js';
import { processFlow, getWebhook, getScenario } from '../utils/makeApi.js';

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

    // Fetch the scenario details if scenarioId exists
    let scenarioDetails = null;
    if (scenarioId) {
      try {
        scenarioDetails = await getScenario(scenarioId);
        console.log('Scenario details received:', JSON.stringify(scenarioDetails));
      } catch (error) {
        console.error('Error fetching scenario details:', error);
      }
    }

    // Build the URL for the scenario
    let scenarioUrl = null;
    if (scenarioDetails) {
      scenarioUrl = `${process.env.MAKE_BASE_URL}/${flowData.flow.teamId}/scenarios/${scenarioDetails.scenario.id}/edit`;
    }

    // Check if a scenario already exists
    const existingScenario = await prisma.scenario.findUnique({
      where: { scenarioId: scenarioId }
    });

    // Log existing scenario check
    console.log('Existing scenario:', existingScenario);

    let scenarioRecord;
    if (!existingScenario) {
      // Log before creating scenario
      console.log('Attempting to create scenario with data:', {
        scenarioId: scenarioId,
        name: scenarioDetails.scenario.name || 'Unknown Scenario',
        templateId: flow.templateId,
        versionId: flow.versionId,
        status: 'running',
        url: scenarioUrl,
        teamId: scenarioDetails.scenario.teamId || flowData.flow.teamId,
        flowId: flow.id,
        createdAt: new Date(scenarioDetails.scenario.created),
        updatedAt: new Date(),
      });

      try {
        // Create a new scenario record

        console.log('HERE IS Flow templateId>>>>>>>>>:', flow.templateId);

        scenarioRecord = await prisma.scenario.create({
          data: {
            scenarioId: scenarioId, // Scenario ID from the API
            name: scenarioDetails.scenario.name || 'Unknown Scenario', // Scenario name from API
            templateId: flow.templateId, // Get templateId from flow
            versionId: flow.versionId, // Get versionId from flow
            status: 'running', // Default to running, this can be updated later
            url: scenarioUrl, // Constructed URL for editing the scenario
            teamId: scenarioDetails.scenario.teamId || flowData.flow.teamId, // Team ID from the scenario or flow
            flowId: flow.id, // Link the scenario to the flow
            createdAt: new Date(scenarioDetails.scenario.created), // Created date from the scenario API
            updatedAt: new Date(), // Set updatedAt to now
          }
        });
        console.log('Scenario created successfully:', scenarioRecord);
      } catch (error) {
        console.error('Error creating scenario:', error);
      }
    } else {
      scenarioRecord = existingScenario;
      console.log('Scenario already exists, skipping creation.');
    }

    // Continue with webhook creation and linking logic...
    // If webhookId exists, fetch the webhook details, create it if needed, and link it to the scenario
    
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

    
    // Then, update the flow's status to complete
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