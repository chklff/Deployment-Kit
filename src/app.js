// src/app.js
import express from 'express';
import path from 'path';
import 'dotenv/config';
import getTemplates from './api/templates.js';
import initiateFlowHandler from './api/initiate-flow.js';
import triggerActionHandler from './api/trigger-action.js';
import processFlowHandler from './api/callback.js';

const app = express();

app.use(express.json());

// Define API routes
app.get('/api/templates', getTemplates);
app.post('/api/flow/initiate', initiateFlowHandler);
app.post('/api/action/trigger', triggerActionHandler);
app.get('/api/flow/callback', processFlowHandler);

// Serve the callback HTML file
app.get('/callback', (req, res) => {
    res.sendFile(path.join(__dirname, 'callback.html'));
});


app.get('/templates', async (req, res) => {
  try {
    // Fetch integrations and scenarios
    const [integrations, scenarios] = await Promise.all([
      prisma.integration.findMany(),
      prisma.scenario.findMany()
    ]);

    // Map scenarios to their respective templateId for easy lookup
    const scenarioMap = scenarios.reduce((map, scenario) => {
      if (scenario.templateId) {
        map[scenario.templateId] = scenario;
      }
      return map;
    }, {});

    res.send(generateTemplatesPage(integrations, scenarioMap));
  } catch (error) {
    res.status(500).send('Error retrieving templates');
  }
});
function generateTemplatesPage(integrations, scenarioMap) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Templates</title>
        <style>
          body {
            background-color: #f7f7f7;
            font-family: Arial, sans-serif;
          }
          .container {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            padding: 20px;
          }
          .card {
            width: 200px;
            background-color: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            margin: 10px;
            padding: 15px;
            text-align: center;
            cursor: pointer;
          }
          .card img {
            width: 96px;
            height: 96px;
            margin-bottom: 10px;
          }
          .card h5 {
            font-size: 18px;
            margin-bottom: 10px;
            font-weight: bold;
            color: #333;
          }
          .card p {
            color: #666;
            margin-bottom: 10px;
          }
          .toggle {
            background-color: red;
            width: 20px;
            height: 20px;
            display: inline-block;
            border-radius: 50%;
            margin-left: 10px;
          }
          .toggle.active {
            background-color: green;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${integrations.map(integration => {
            const scenario = scenarioMap[integration.templateId];
            const isActive = scenario?.status === 'running'; // Check if scenario is active
            const toggleClass = isActive ? 'toggle active' : 'toggle';

            return `
              <div class="card" onclick="initiateFlow(${integration.versionId}, ${integration.templateId})">
                <img src="${integration.imageUrl}" alt="${integration.name}" />
                <h5>${integration.name}</h5>
                <p>${integration.description || 'No description provided'}</p>
                <div>
                  <span>${isActive ? 'Active' : 'Inactive'}</span>
                  <div class="${toggleClass}"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <script>
          // Function to initiate flow when clicking on a tile
          async function initiateFlow(versionId, templateId) {
            console.log('Initiating flow with versionId:', versionId, 'templateId:', templateId);
            try {
              const response = await fetch('/api/flow/initiate', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  templateId: templateId,
                  userId: 'user-334',
                  versionId: versionId
                })
              });

              if (response.ok) {
                const data = await response.json();
                if (data.publicUrl) {
                  window.open(data.publicUrl, '_blank');
                } else {
                  alert('Failed to retrieve the public URL.');
                }
              } else {
                alert('Failed to initiate flow. Please try again.');
              }
            } catch (error) {
              console.error('Error initiating flow:', error);
              alert('An error occurred while initiating the flow.');
            }
          }

          // Function to handle checkbox toggle
          function handleToggle(event, versionId) {
            const isChecked = event.target.checked;
            alert('Toggled version ID: ' + versionId + ' to ' + (isChecked ? 'Active' : 'Inactive'));
            // Implement AJAX request to update the status here if needed
          }
        </script>
      </body>
    </html>
  `;
}

  
  

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
