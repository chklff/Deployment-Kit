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
      const integrations = await prisma.integration.findMany();
      res.send(generateTemplatesPage(integrations));
    } catch (error) {
      res.status(500).send('Error retrieving templates');
    }
  });
  function generateTemplatesPage(integrations) {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Templates</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.0.4/dist/tailwind.min.css" rel="stylesheet">
        </head>
        <body class="bg-gray-100">
          <div class="w-full flex justify-center items-center flex-wrap p-4">
            ${integrations.map(integration => `
              <div class="m-4" style="width: 14rem;">
                <div 
                  class="flex flex-col items-center justify-center p-6 mx-auto bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100 cursor-pointer"
                  onclick="initiateFlow(${integration.versionId}, ${integration.templateId})"
                >
                  <img src="${integration.imageUrl}" alt="${integration.name}" width="96" height="96" class="mb-3" />
                  <h5 class="mb-2 text-xl font-bold tracking-tight text-gray-900 text-center">${integration.name}</h5>
                  <p class="font-normal text-gray-700 text-center">${integration.description}</p>
                  <div class="flex items-center mt-2" onclick="event.stopPropagation();">
                    <span class="mr-2 text-gray-700">${integration.isActive ? 'Active' : 'Inactive'}</span>
                    <input 
                      type="checkbox" 
                      ${integration.isActive ? 'checked' : ''} 
                      onclick="handleToggle(event, ${integration.versionId})" 
                    />
                  </div>
                </div>
              </div>
            `).join('')}
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
