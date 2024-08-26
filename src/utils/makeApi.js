import axios from 'axios';

const makeApi = axios.create({
  baseURL: process.env.MAKE_BASE_URL,
  headers: {
    Authorization: `Token ${process.env.MAKE_API_KEY}`,
  },
});

export async function createTeam(name) {
  const response = await makeApi.post('/teams', { name });
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