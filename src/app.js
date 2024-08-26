//src/app.js

import express from 'express';
import getTemplates from './api/templates.js';
import initiateFlowHandler from './api/initiate-flow.js';
import callbackHandler from './api/callback.js';
import triggerActionHandler from './api/trigger-action.js';

const app = express();

app.use(express.json());

app.get('/api/templates', getTemplates);
app.post('/api/initiate-flow', initiateFlowHandler);
app.get('/api/callback', callbackHandler);
app.post('/api/trigger-action', triggerActionHandler);

export default app;
