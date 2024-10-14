const https = require('https');
const axios = require('axios');
const Joi = require('joi');
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

const shopGuid = '99fb9f59-4c2d-495f-8af9-8188b531782d';
const projectGuid = '68dd9e02-5217-42da-aa0b-2bf7ab4b8672';
const winnerApiKey = process.env.WINNER_FLEX_API_KEY;
const vectaBaseUrl = 'https://api.vecta.net/api'; // Updated base URL
const vectaApiKey = process.env.VECTA_API_KEY; // Use the API key from the environment variable

// Middleware
app.use(bodyParser.json());

// Webhook endpoint
app.post('/webhook', (req, res) => {
    const webhookData = req.body;

    // Process the incoming data here
    console.log('Webhook data received:', webhookData);

    // Respond to the webhook request
    res.status(200).send('Webhook received successfully');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

if (!winnerApiKey) {
  console.error('Winner API key is missing. Please check your .env file.');
  process.exit(1);
}

// Joi schema for validating Winner project data
const projectSchema = Joi.object({
  name: Joi.string().required(),
  // Add more fields based on the Winner API response
});

const options = {
  hostname: 'flex.compusoftgroup.com',
  path: `/eapi/v1/projects/${projectGuid}?shopGuid=${shopGuid}`,
  method: 'GET',
  headers: {
    'apiKey': winnerApiKey,
    'Content-Type': 'application/json',
  },
};

console.log('Winner API Key:', winnerApiKey); // Log the API key to verify it's being read correctly

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', async () => {
    if (res.statusCode === 200) {
      const projectData = JSON.parse(data);
      console.log('Project Data from Winner:', projectData);

      // Validate and transform project data
      const { error, value } = projectSchema.validate({
        name: projectData.projectName,
        // Include other fields if needed
      });

      if (error) {
        console.error('Validation error:', error.details);
        return;
      }

      console.log('Validated Project Data:', value);
      await sendToVecta(value);
    } else {
      console.error(`Failed to fetch project data. Status code: ${res.statusCode}`);
      console.error('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();

// Function to authenticate and send data to Vecta API
async function sendToVecta(projectData) {
  const loginData = {
    account: process.env.VECTA_COMPANY,
    password: process.env.VECTA_PASSWORD,
    username: process.env.VECTA_USERNAME,
    restrictedAccess: true,
  };

  try {
    // Step 1: Login and retrieve the JWT token
    const loginResponse = await axios.post(`${vectaBaseUrl}/auth`, loginData, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': vectaApiKey, // Include the API key
      },
    });

    const token = loginResponse.data.token; // Assuming the token is returned in 'token' field
    console.log('Login successful, token received:', token);

    // Step 2: Use the token for a subsequent API call
    const vectaResponse = await axios.post(`${vectaBaseUrl}/projects`, {
      name: projectData.name,
      description: projectData.description,
      workflowId: process.env.VECTA_GUID_DESIGN_WORKFLOW,
      ownerId: process.env.VECTA_GUID_IT_USER,
      assignedToId: process.env.VECTA_GUID_IT_USER,
    }, {
      headers: {
        'Authorization': `Bearer ${token}`, // Include the bearer token
        'x-api-key': vectaApiKey, // Include the API key
      },
    });

    console.log('API call to Vecta successful:', vectaResponse.data);
  } catch (error) {
    console.error('Error making API call to Vecta:', error.response ? error.response.data : error.message);
  }
}
