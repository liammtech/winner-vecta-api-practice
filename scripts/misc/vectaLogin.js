const axios = require('axios');
require('dotenv').config();

const vectaBaseUrl = 'https://api.vecta.net/api'; // Updated base URL
const apiKey = process.env.VECTA_API_KEY; // Use the API key from the environment variable

async function loginVecta() {
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
        'x-api-key': process.env.VECTA_API_KEY, // Include the API key
      },
    });

    const token = loginResponse.data.token; // Assuming the token is returned in 'token' field
    console.log('Login successful, token received:', token);

    // Step 2: Use the token for a subsequent API call
    await makeApiCall(token);
  } catch (error) {
    console.error('Error logging in to Vecta:', error.response ? error.response.data : error.message);
  }
}

async function makeApiCall(token) {
  try {
    // Example of making a subsequent API call using the JWT token
    const response = await axios.post(`${vectaBaseUrl}/projects`, {
      name: "API TEST IMPORT",
      description: "This project imported within Vecta Login sync call",
      workflowId: process.env.VECTA_GUID_DESIGN_WORKFLOW,
      ownerId: process.env.VECTA_GUID_IT_USER,
      assignedToId: process.env.VECTA_GUID_IT_USER,
    }, {
      headers: {
        'Authorization': `Bearer ${token}`, // Include the bearer token
        'x-api-key': process.env.VECTA_API_KEY, // Include the API key
      },
    });

    console.log('API call successful:', response.data);
  } catch (error) {
    console.error('Error making API call:', error.response ? error.response.data : error.message);
  }
}

// Call the login function
loginVecta();
