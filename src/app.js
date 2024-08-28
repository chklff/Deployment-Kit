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

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
