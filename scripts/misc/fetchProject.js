const https = require('https');
require('dotenv').config();

const shopGuid = '99fb9f59-4c2d-495f-8af9-8188b531782d';
const projectGuid = '68dd9e02-5217-42da-aa0b-2bf7ab4b8672';
const apiKey = process.env.WINNER_FLEX_API_KEY;
const baseUrl = 'https://flex.compusoftgroup.com';

if (!apiKey) {
  console.error('API key is missing. Please check your .env file.');
  process.exit(1);
}

const options = {
  hostname: 'flex.compusoftgroup.com',
  path: `/eapi/v1/projects/${projectGuid}?shopGuid=${shopGuid}`,
  method: 'GET',
  headers: {
    'apiKey': `${apiKey}`,
    'Content-Type': 'application/json',
  },
};

console.log('API Key:', apiKey); // Log the API key to verify it's being read correctly

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('Project Data:', JSON.parse(data));
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
