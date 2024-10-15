const https = require('https');
const axios = require('axios');
const Joi = require('joi');
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

const winnerApiKey = process.env.WINNER_FLEX_API_KEY;
const vectaBaseUrl = 'https://api.vecta.net/api';
const vectaApiKey = process.env.VECTA_API_KEY;

// Middleware
app.use(bodyParser.json());

function extractFields(source, fields) {
    const result = {};

    fields.forEach(field => {
        const keys = field.split('.');
        let value = source;

        for (const key of keys) {
            if (value[key] !== undefined) {
                value = value[key];
            } else {
                value = undefined;
                break;
            }
        }

        if (value !== undefined) {
            // Set the value in the result using the last key
            const lastKey = keys.pop();
            const nestedResult = keys.reduce((acc, key) => {
                if (!acc[key]) {
                    acc[key] = {};
                }
                return acc[key];
            }, result);
            nestedResult[lastKey] = value;
        }
    });

    return result;
}

async function fetchProjectFromWinner(projectGuid, shopGuid) {
    const options = {
        hostname: 'flex.compusoftgroup.com',
        path: `/eapi/v1/projects/${projectGuid}?shopGuid=${shopGuid}`,
        method: 'GET',
        headers: {
            'apiKey': `${winnerApiKey}`,
            'Content-Type': 'application/json',
        },
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                    console.log(data);
                } else {
                    reject(`Failed to fetch project data. Status code: ${res.statusCode}`);
                }
            });
        });

        req.on('error', (e) => {
            reject(`Problem with request: ${e.message}`);
        });

        req.end();
    });
}

async function transferProjectToVecta(projectData) {
    const token = await loginVecta();

    const allowedFields = ['projectName', 'projectId']; // UPDATE WINNER DATA FIELDS HERE
    const filteredProjectData = extractFields(projectData, allowedFields);

    const validationResult = validateNewWinnerData(filteredProjectData);

    if (validationResult.error) {
        throw new Error(`Validation error: ${validationResult.error}`);
    }

    const vectaProjectData = { // UPDATE VECTA DATA FIELDS HERE
        name: filteredProjectData.projectName,
        primaryCompany: { accountNo: filteredProjectData.externalReference },
        description: `Winner project no. ${filteredProjectData.projectId}`,
        workflowId: process.env.VECTA_GUID_DESIGN_WORKFLOW,
        ownerId: process.env.VECTA_GUID_IT_USER,
        assignedToId: process.env.VECTA_GUID_IT_USER,
    };

    const response = await axios.post(`${vectaBaseUrl}/projects`, vectaProjectData, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'x-api-key': vectaApiKey,
        },
    });

    return response.data;
}

async function updateVectaProject(projectData) {
    const token = await loginVecta();

    // Filter out fields that are not expected by Vecta API
    const allowedFields = ['projectName', 'externalReference', 'projectId']; // UPDATE WINNER DATA FIELDS HERE
    const filteredProjectData = {};
    allowedFields.forEach(field => {
        if (projectData[field]) {
            filteredProjectData[field] = projectData[field];
        }
    });

    const validationResult = validateUpdatedWinnerData(filteredProjectData);

    if (validationResult.error) {
        throw new Error(`Validation error: ${validationResult.error}`);
    }

    const vectaProjectData = { // UPDATE VECTA DATA FIELDS HERE
        name: filteredProjectData.projectName,
        primaryCompany: { accountNo: getVectaCompanyIdByAccountNo(filteredProjectData.externalReference, token) },
        description: `Winner project no. ${filteredProjectData.projectId}`,
        workflowId: process.env.VECTA_GUID_DESIGN_WORKFLOW,
        ownerId: process.env.VECTA_GUID_IT_USER,
        assignedToId: process.env.VECTA_GUID_IT_USER,
    };

    const response = await axios.put(`${vectaBaseUrl}/projects`, vectaProjectData, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'x-api-key': vectaApiKey,
        },
    });
}

async function loginVecta() {
    const loginData = {
        account: process.env.VECTA_COMPANY,
        password: process.env.VECTA_PASSWORD,
        username: process.env.VECTA_USERNAME,
        restrictedAccess: true,
    };

    const response = await axios.post(`${vectaBaseUrl}/auth`, loginData, {
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': vectaApiKey,
        },
    });

    return response.data.token;
}

const getVectaCompanyIdByAccountNo = async (accountNo, token) => {
    const url = `https://api.vecta.net/api/companies/accountno/${accountNo}`;
    const headers = {
        'Authorization': `Bearer ${token}`,
        'x-api-key': vectaApiKey
    };

    try {
        const response = await axios.get(url, { headers });
        return response.data.id; // Adjust based on the actual response structure
    } catch (error) {
        console.error(`Error fetching company ID: ${error.message}`);
        throw error;
    }
};

function validateNewWinnerData(data) {
    const schema = Joi.object({
        projectName: Joi.string().required(),
        projectId: Joi.required(),
    });

    return schema.validate(data);
}

function validateUpdatedWinnerData(data) {
    const schema = Joi.object({
        projectName: Joi.string().required(),
        projectId: Joi.required(),
        externalReference: Joi.allow()
    });

    return schema.validate(data);
}


// Webhook endpoint - CREATE PROJECT
app.post('/create-project', async (req, res) => {
    const webhookData = req.body;
    console.log('Create Project | Webhook data received:', webhookData);

    const subjectParts = webhookData.subject.split('/');
    const projectGuid = subjectParts[2];
    const shopGuid = subjectParts[1];

    try {
        const projectData = await fetchProjectFromWinner(projectGuid, shopGuid);
        await transferProjectToVecta(projectData);
        res.status(200).send('CREATE PROJECT Webhook processed successfully');
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Webhook endpoint - UPDATE PROJECT
app.post('/update-project', async (req, res) => {
    const webhookData = req.body;
    console.log('Update Project | Webhook data received:', webhookData);
    
    const subjectParts = webhookData.subject.split('/');
    const projectGuid = subjectParts[2];
    const shopGuid = subjectParts[1];

    try {
        const projectData = await fetchProjectFromWinner(projectGuid, shopGuid);
        await updateVectaProject(projectData);
        res.status(200).send('CREATE PROJECT Webhook processed successfully');
    } catch (error) {
        // console.error('Error processing webhook:', error);
        res.status(500).send('Internal Server Error');
    }
})


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

if (!winnerApiKey) {
    console.error('Winner API key is missing. Please check your .env file.');
    process.exit(1);
}
