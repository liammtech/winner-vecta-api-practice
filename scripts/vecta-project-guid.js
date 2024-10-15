const axios = require('axios');
require('dotenv').config();
const vectaBaseUrl = 'https://api.vecta.net/api';
const vectaApiKey = process.env.VECTA_API_KEY;

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjBmZWU5YjFiLTQ5NDktNDIzOS1hNGZhLWEwMTIzMzIxZjExMiIsInN1YiI6Iml0IiwiY29uX3VzZXJfbmFtZSI6Iml0IiwiY29uX3VzZXJfaWQiOiIwZmVlOWIxYi00OTQ5LTQyMzktYTRmYS1hMDEyMzMyMWYxMTIiLCJjb25fZ3JvdXBfaWQiOiIyZWQ2N2MwYS1jZTdhLTRkZTktOGU1OS0zYTY4MjVmNGU4NDMiLCJjb25fcmVxdWVzdF9yZXN0cmljdGVkIjoiVHJ1ZSIsImNvbl9lZGl0X215X3ZlY3RhIjoiVHJ1ZSIsImNvbl9wcml2aWxlZ2UiOiI5IiwiY29uX3Nlc3Npb25faWQiOiJhOTllNTM0Mi0xNjIyLTQwNjktODQxZS00MDljM2FiOTU1NjkiLCJjb25fZGF0YWJhc2VfaWQiOiIwMDAwNjBhOC1jOGNiLTQ1YjMtOWNjMC0xOWFkODNiYzcwOTciLCJleHAiOjE3MjkwNTgxNDgsImlzcyI6Imh0dHBzOi8vYXBpLnZlY3RhLm5ldC8ifQ.IqRZy2FS4SJ5uKBik495bEpQ_3TxhrhMvSeRY67ahaE`,
    'x-api-key': vectaApiKey
};

// Function to create a new Vecta project
const createVectaProject = async () => {
    const url = `${vectaBaseUrl}/projects`;
    
    const data = {
        name: "API Test - Descriptive Project ID 2",
        ownerId: "0fee9b1b-4949-4239-a4fa-a0123321f112",
        workflowId: "ad14bd95-96ea-4972-8081-83b8790b36d6",
        assignedToId: "0fee9b1b-4949-4239-a4fa-a0123321f112",
        primaryCompanyId: "898ceb64-01e2-4781-8892-467d5bbda740"
    };

    try {
        const response = await axios.post(url, data, { headers });
        const projectGUID = response.data.id;  // Assuming 'id' is the GUID of the created project
        console.log(`Project GUID: ${projectGUID}`);
        return projectGUID;
    } catch (error) {
        console.error('Error creating project:', error.response ? error.response.data : error.message);
        throw error;
    }
};

// Function to fetch project details using the GUID
const getVectaProjectDetails = async (projectGUID) => {
    const url = `${vectaBaseUrl}/projects/${projectGUID}`;

    try {
        const response = await axios.get(url, { headers });
        const projectNo = response.data.projectNo;  // Assuming 'projectNo' is the field we need
        console.log(`Project Number: ${projectNo}`);
        return projectNo;
    } catch (error) {
        console.error('Error fetching project details:', error.response ? error.response.data : error.message);
        throw error;
    }
};

// Main function to create project and fetch project number
const main = async () => {
    try {
        const projectGUID = await createVectaProject();
        const projectNo = await getVectaProjectDetails(projectGUID);
        console.log(`Created Project Number: ${projectNo}`);
    } catch (error) {
        console.error('Error in main function:', error.message);
    }
};

// Execute the main function
main();
