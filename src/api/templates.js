// src/api/templates.js
import { createTeam, getTeamTemplates, getOrgScenarios } from '../utils/makeApi.js';
import prisma from '../utils/db.js';

export default async function getTemplates(req, res) {
  const userId = req.query.userId;

  const orgId = process.env.MAKE_ORG_ID
  console.log(process.env.MAKE_ORG_ID);
   
  // Find or create user
  let user = await prisma.user.findUnique({ where: { userId } });
  
  if (!user) {
    // User does not exist, create a new team and user
    const team = await createTeam(`Team for ${userId}`, orgId);
    // console.log(JSON.stringify(team, null, 2));

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

  const orgScenarios = await getOrgScenarios(orgId)

  // Fetch all records from the Integration table
  const integrations = await prisma.integration.findMany();

  // Process templates and update Integration table
  for (const template of teamTemplates) {
    const existingIntegration = integrations.find(integration => integration.templateId === template.id);

    // Safely extract hookId if it exists
    let hookId = null;
    if (template.controller && template.controller.hooks && typeof template.controller.hooks === 'object') {
      const hookKeys = Object.keys(template.controller.hooks);
      if (hookKeys.length > 0) {
        hookId = hookKeys[0];  // Get the first hookId
      }
    }

    if (existingIntegration) {
      const isChanged = existingIntegration.versionId !== (template.isInstanceable ? 1 : 0) || 
                        existingIntegration.name !== template.name.en || 
                        existingIntegration.hookId !== hookId;

      if (isChanged) {
        await prisma.integration.update({
          where: { id: existingIntegration.id },
          data: {
            name: template.name.en,
            versionId: template.instanceableId,
            description: template.description.en || existingIntegration.description,
            hookId: hookId,  // Add hookId to the update
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
            imageUrl: 'https://x.com/..',  // Replace with actual image URL or logic to fetch it
            hookId: hookId,  // Add hookId to the creation
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


  try {
    // Fetch all scenarios from the API
    for (const scenario of orgScenarios) {

        // Determine the status based on 'isinvalid' and 'isPaused'
      let status;
      if (!scenario.islinked) {
        status = 'stopped';
      } else if (scenario.islinked) {
        status = 'active';
      } else {
        status = 'unknown'; // Default if other conditions are not met
      }

      let url = `${process.env.MAKE_BASE_URL}/${scenario.teamId}/scenarios/${scenario.id}/edit`

      // Scenario data for creation (including templateId and versionId)
      const createScenarioData = {
        scenarioId: scenario.id, // Unique identifier from the API
        name: scenario.name,  // Scenario name
        templateId: null, // Set on creation only
        versionId: null,   // Set on creation only
        status: status,    // Status of the scenario
        errors: scenario.errors || null, 
        url: url,  
        teamId:scenario.teamId,       // Optional errors (JSON format)
        userId: null, // Optional userId (creator's ID)
        flowId: null,                             // Flow ID if available
        updatedAt: new Date(),                    // Updated timestamp from API or current time
        createdAt: new Date(scenario.created) || new Date(), // Created timestamp from API
      };
  
      // Scenario data for update (excluding templateId and versionId)
      const updateScenarioData = {
        name: scenario.name,  // Scenario name
        status: status,    // Status of the scenario
        errors: scenario.errors || null,         // Optional errors (JSON format)
        updatedAt: new Date(),                    // Updated timestamp
      };
  
      // Upsert the scenario to create it if it doesn't exist or update it (without overriding templateId/versionId)
      await prisma.scenario.upsert({
        where: { scenarioId: scenario.id }, // Check if scenario exists by scenarioId
        update: updateScenarioData,         // Update without changing templateId/versionId
        create: createScenarioData,         // Create with all fields
      });
  
      console.log(`Scenario ${scenario.name} synced successfully.`);
    }
  } catch (error) {
    console.error('Error syncing scenarios:', error);
  }


  async function syncScenariosWithApi(orgScenarios) {
    try {
      // Extract scenario IDs from API
      const apiScenarioIds = orgScenarios.map(scenario => scenario.id);
  
      // Step 2: Fetch all scenarios from your database
      const dbScenarios = await prisma.scenario.findMany({
        select: { scenarioId: true }
      });
  
      // Extract scenario IDs from DB
      const dbScenarioIds = dbScenarios.map(scenario => scenario.scenarioId);
  
      // Step 3: Identify scenarios to delete (exist in DB but not in API)
      const scenariosToDelete = dbScenarioIds.filter(dbId => !apiScenarioIds.includes(dbId));
  
      if (scenariosToDelete.length > 0) {
        // Step 4: Delete the scenarios from the database
        await prisma.scenario.deleteMany({
          where: { scenarioId: { in: scenariosToDelete } }
        });
  
        console.log(`Deleted ${scenariosToDelete.length} scenarios from the database.`);
      } else {
        console.log('No scenarios to delete.');
      }
  
    } catch (error) {
      console.error('Error syncing scenarios:', error);
    }
  }

  try {
    await syncScenariosWithApi(orgScenarios);
  } catch (error) {
    console.error('Error syncing scenarios with API:', error);
  }

  // Fetch updated list of integrations
  const updatedIntegrations = await prisma.integration.findMany();
  res.status(200).json(updatedIntegrations);
}