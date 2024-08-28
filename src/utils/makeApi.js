// src/utils/makeApi.js
import axios from 'axios';

const makeApi = axios.create({
  baseURL: `${process.env.MAKE_BASE_URL}${process.env.MAKE_API_VERSION}`,
  headers: {
    Authorization: `Token ${process.env.MAKE_API_KEY}`,
  },
});

// Intercepting the request to log only the body
makeApi.interceptors.request.use((config) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Request Body:', config.data);  // Log only the request body
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Intercepting the response to log only the body
makeApi.interceptors.response.use((response) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Response Body:', response.data);  // Log only the response body
  }
  return response;
}, (error) => {
  if (process.env.NODE_ENV !== 'production') {
    if (error.response) {
      console.error('Error Response Body:', error.response.data);  // Log only the error response body
    } else {
      console.error('Error:', error.message);
    }
  }
  return Promise.reject(error);
});

// Make API functions

// Function to create a team in Make API
export async function createTeam(name, organizationId) {
  const response = await makeApi.post('/teams', { name, organizationId });
  return response.data;
}

const redirectUri = `${process.env.APPLICATION_URL}/callback`;

// Function to initiate a flow in Make API
export async function initiateFlow(templateId, teamId) {
  const response = await makeApi.post('/instances/flow/init/template', {
    templateId,
    teamId,
    redirectUri,
  });
  return response.data;
}

// Function to process a flow in Make API
export async function processFlow(flowId) {
  const response = await makeApi.get(`/flows/${flowId}`);
  return response.data;
}

// Function to trigger a webhook
export async function triggerWebhook(url, action) {
  const response = await makeApi.post(url, { action });
  return response.data;
}
