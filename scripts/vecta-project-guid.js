const axios = require('axios');
require('dotenv').config();
const vectaBaseUrl = 'https://api.vecta.net/api';
const vectaApiKey = process.env.VECTA_API_KEY;

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${bearerToken}`,
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
