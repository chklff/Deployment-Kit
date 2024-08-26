// src/utils/makeApi.js
import axios from 'axios';

const makeApi = axios.create({
  baseURL: `${process.env.MAKE_BASE_URL}${process.env.MAKE_API_VERSION}`,
  headers: {
    Authorization: `Token ${process.env.MAKE_API_KEY}`,
  },
});

export async function createTeam(name, organizationId) {
  const response = await makeApi.post('/teams', { name, organizationId });
  return response.data;
}

export async function initiateFlow(templateId, teamId, redirectUri) {
  const response = await makeApi.post('/instances/flow/init/template', {
    templateId,
    teamId,
    redirectUri,
  });
  return response.data;
}

export async function processFlow(flowId) {
  const response = await makeApi.get(`/flows/${flowId}`);
  return response.data;
}

// Add the triggerWebhook function
export async function triggerWebhook(url, action) {
  const response = await axios.post(url, { action });
  return response.data;
}