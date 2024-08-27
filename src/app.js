// src/app.js

import express from 'express';
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
app.post('/api/flow/callback', processFlowHandler);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
