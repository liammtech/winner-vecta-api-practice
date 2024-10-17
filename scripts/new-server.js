const express = require('express');
const https = require('https');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config()
const rateLimit = require('express-rate-limit');
const { Console } = require('console');

const app = express();
app.use(express.json());

const vectaBaseUrl = "https://api.vecta.net/api";
const vectaApiKey = process.env.VECTA_API_KEY;
const winnerApiKey = process.env.WINNER_API_KEY;
const vectaItUserId = process.env.IT_VECTA_USER_ID;

const PORT = process.env.PORT || 3000;

// Limiter - stops the app going ping ping ping ping
app.set('trust proxy', 1); // '1' to trust the first proxy
const limiter = rateLimit({
    windowMs: 1 * 5 * 1000, // 1 minute
    max: 1, // limit each IP to 1 request per windowMs
    message: 'Too many requests, please try again later.'
});
app.use(limiter);

const getHeaders = () => ({
    'apiKey': `${winnerApiKey}`,
    'Content-Type': 'application/json',
});

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

// Function to fetch project data from Winner API using projectGuid and shopGuid
async function getWinnerProjectData(projectGuid, shopGuid) {
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
                    reject(`Failed to fetch Winner project data. Status code: ${res.statusCode}`);
                }
            });
        });

        req.on('error', (e) => {
            reject(`Problem with request: ${e.message}`);
        });

        req.end();
    });
}


async function getWinnerUserName(userGuid) {
    const options = {
        hostname: 'flex.compusoftgroup.com',
        path: `/eapi/v1/users/${userGuid}`,
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
                    const userData = JSON.parse(data);
                    resolve(userData.fullName);  // Change here to 'fullName'
                    console.log(data);
                } else {
                    reject(`Failed to fetch Winner user data. Status code: ${res.statusCode}`);
                }
            });
        });

        req.on('error', (e) => {
            reject(`Problem with request: ${e.message}`);
        });

        req.end();
    });
}

function getVectaUserGuid(userName, vectaToken) {
    console.log(`Fetching Vecta user data for userName: ${userName}`);
    console.log(`Vecta token: ${vectaToken}`);

    return new Promise((resolve, reject) => {
        axios.get(`${vectaBaseUrl}/users`, {
            headers:  {
                'Authorization': `Bearer ${vectaToken}`,
                'x-api-key': vectaApiKey
            },
            params: { name: userName }
        })
        .then(response => {
            if (response.data.length > 0) {
                resolve(response.data[0].id); // Return the user ID
            } else {
                console.log(`User not found for userName: ${userName}, skipping...`);
                resolve(vectaItUserId); // Skip the user by resolving with null
            }
        })
        .catch(error => {
            console.error('Error fetching Vecta user data:', error.message);
            resolve(vectaItUserId); // Skip the user if there's an error
        });
    });
}

function createVectaProject(projectData, vectaToken) {
    console.log('Creating project in Vecta with data:', projectData);

    return new Promise((resolve, reject) => {
        axios.post(`${vectaBaseUrl}/projects`, projectData, {
            headers: {
                'Authorization': `Bearer ${vectaToken}`,
                'x-api-key': vectaApiKey
            }
        })
        .then(response => {
            resolve(response.data); // Return the response data
        })
        .catch(error => {
            console.error('Error creating project in Vecta:', error.message);
            reject(error); // Reject the promise with the error
        });
    });
}

function getVectaProject(vectaProjectId, vectaToken) {
    console.log(`Fetching Vecta project data for projectId: ${vectaProjectId}`);
    
    const options = {
        hostname: 'api.vecta.net',
        path: `/api/projects/${vectaProjectId}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${vectaToken}`,
            'x-api-key': vectaApiKey,
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
                } else {
                    reject(`Failed to fetch Vecta project data. Status code: ${res.statusCode}`);
                }
            });
        });

        req.on('error', (e) => {
            reject(`Problem with request: ${e.message}`);
        });

        req.end();
    });
}

function updateWinnerProject(projectGuid, shopGuid, projectNo, ourRefGuid, projectName, projectAddresses) {
    const data = JSON.stringify({
        projectGuid: projectGuid,
        ourRefGuid: ourRefGuid,
        shopGuid: shopGuid,
        projectName: projectName,
        externalUniqueID: projectNo,
        projectAddresses: projectAddresses
    });

    const options = {
        hostname: 'flex.compusoftgroup.com',
        path: `/eapi/v1/projects/${projectGuid}?shopGuid=${shopGuid}`, // Ensure projectGuid is in the path and shopGuid is a query parameter
        method: 'PUT',
        headers: {
            'apiKey': `${winnerApiKey}`,
            'Content-Type': 'application/json'
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseBody = '';

            res.on('data', (chunk) => {
                responseBody += chunk;
            });

            res.on('end', () => {
                console.log(`Updating Winner project...\n${data}`);
                if (res.statusCode === 200) {
                    resolve(JSON.parse(responseBody));
                } else {
                    console.error(`Failed to update Winner project data. Status code: ${res.statusCode}`);
                    console.error(`Response body: ${responseBody}`);
                    reject(`Failed to update Winner project data. Status code: ${res.statusCode}, Response body: ${responseBody}`);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with request: ${e.message}`);
            reject(`Problem with request: ${e.message}`);
        });

        req.write(data);
        req.end();
    });
}

app.post('/project-created', async (req, res) => {

    const webhookData = req.body;
    console.log('Create Project | Webhook data received:', webhookData);
    
    const subjectParts = webhookData.subject.split('/');
    const projectGuid = subjectParts[2];
    const shopGuid = subjectParts[1];

    if (!projectGuid || !shopGuid) {
        console.error('Error: Missing projectGuid or shopGuid');
        return res.status(400).json({ message: 'Missing projectGuid or shopGuid in the webhook data.' });
    }

    try {
        console.log('Fetching Winner project data...');
        const winnerProjectData = await getWinnerProjectData(projectGuid, shopGuid);
        console.log('Winner Project Data:', winnerProjectData);

        console.log('Fetching Winner user name...');
        const userName = await getWinnerUserName(winnerProjectData.ourRefGuid);
        console.log(`User Name fetched: ${userName}`);

        console.log('Logging into Vecta...');
        const vectaToken = await loginVecta();
        
        console.log('Fetching Vecta user GUID...');
        const vectaUserGuid = await getVectaUserGuid(userName, vectaToken);
        console.log(`Vecta User GUID: ${vectaUserGuid}`);

        const vectaProjectData = {
            name: winnerProjectData.projectName,
            description: winnerProjectData.projectNumber,
            workflowId: 'ad14bd95-96ea-4972-8081-83b8790b36d6',
            ownerId: vectaUserGuid,
            assignedToId: vectaUserGuid
        };

        console.log('Creating new Vecta project...');
        const newVectaProject = await createVectaProject(vectaProjectData, vectaToken);
        console.log('New Vecta Project created:', newVectaProject);

        console.log('Fetching newly created Vecta project...');
        const vectaProject = await getVectaProject(newVectaProject.id, vectaToken);
        console.log('Fetched Vecta Project:', vectaProject);

        console.log('Updating Winner project...');
        await updateWinnerProject(
            projectGuid,
            shopGuid,
            vectaProject.projectNo,
            winnerProjectData.ourRefGuid,
            winnerProjectData.projectName,
            winnerProjectData.projectAddresses
        );

        console.log('Winner project updated successfully.');

        res.status(200).json({ message: 'Project created and updated successfully in both systems.' });
    } catch (error) {
        console.error('Error handling project creation webhook:', error.message);
        // console.error('Full error details:', error); // This adds all the crazy extra stuff
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

//////////////////////////// FOR THE LOVE OF GOD, KEEP THIS HERE

app.post('/project-updated', async (req, res) => {
    const webhookData = req.body;
    console.log('Update Project | Webhook data received:', webhookData);
    
    const subjectParts = webhookData.subject.split('/');
    const projectGuid = subjectParts[2];
    const shopGuid = subjectParts[1];

    try {
        const winnerProjectData = await getWinnerProjectData(projectGuid, shopGuid);
        console.log('Winner Project Data:', winnerProjectData); // Log the fetched data

        if (!winnerProjectData.externalUniqueID) {
            console.error('Error: externalUniqueID is null or undefined');
            return res.status(400).json({ message: 'Invalid externalUniqueID' });
        }

        const winnerStatusId = winnerProjectData.status_StandardText;
        const vectaToken = await loginVecta();
        
        const vectaProjectId = await searchVectaProjectByExternalUniqueId(winnerProjectData.externalUniqueID, vectaToken);
        console.log(`Vecta Project No: ${winnerProjectData.externalUniqueID}`);
        console.log(`Vecta Project ID: ${vectaProjectId}`);

        const vectaCompanyId = await getCompanyByAccountNumber(winnerProjectData.externalReference, vectaToken);
        console.log(`Vecta Company ID: ${vectaCompanyId}`);

        const vectaProjectData = await getVectaProject(vectaProjectId, vectaToken);
        console.log(`Vecta Project Data: ${JSON.stringify(vectaProjectData, null, 2)}`);

        const vectaStatusId = await getVectaStatusByWinnerStatus(winnerStatusId);
        console.log(`Vecta Status ID: ${vectaStatusId}`);

        // Build updated project data
        const updatedVectaProjectData = {
            id: vectaProjectData.id,
            name: winnerProjectData.projectName, // Assuming you're mapping names correctly
            projectNo: vectaProjectData.projectNo,
            description: vectaProjectData.description,
            workflowId: vectaProjectData.workflowId,
            workflowStageId: vectaStatusId,
            primaryCompanyId: vectaCompanyId,
            primaryContactIds: [],
            estimatedValue: winnerProjectData.budgetValue || 0,
            expectedValue: 0.0,
            weightedValue: 0.0,
            percentComplete: 0,
            durationLength: null,
            durationType: "Days",
            ownerId: vectaProjectData.ownerId,
            ownerName: vectaProjectData.ownerName,
            assignedToId: vectaProjectData.assignedToId,
            assignedToName: vectaProjectData.assignedToName,
            startDateTime: null,
            dueDateTime: null,
            actionDateTime: null,
            createdDateTime: vectaProjectData.createdDateTime,
            modifiedDateTime: vectaProjectData.modifiedDateTime,
            createdById: vectaProjectData.createdById,
            modifiedById: vectaProjectData.modifiedById,
            lastTransitionDateTime: new Date().toISOString(),
        };
        
        console.log('Updated Vecta Project Data:', JSON.stringify(updatedVectaProjectData, null, 2));
        await updateVectaProject(updatedVectaProjectData, vectaToken);

        res.status(200).json({ message: 'Project updated successfully in Vecta.' });
    } catch (error) {
        console.error('Error handling project updated webhook:', error.message);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});

const searchVectaProjectByExternalUniqueId = (externalUniqueId, vectaToken) => {
    console.log(`Searching for Vecta project with externalUniqueId: ${externalUniqueId}`);

    const requestBody = {
        projectNoList: [externalUniqueId],
    };

    return new Promise((resolve, reject) => {
        axios.post(`${vectaBaseUrl}/projects/search`, requestBody, {
            headers: {
                'Authorization': `Bearer ${vectaToken}`,
                'x-api-key': vectaApiKey
            }
        })
        .then(response => {
            if (response.data && response.data.length > 0) {
                // Access the first project directly
                const projectData = response.data[0];
                console.log('Project found:', projectData.id); // Log the project ID
                resolve(projectData.id); // Resolve with the project ID directly
            } else {
                console.log('No project found with the given externalUniqueId.');
                resolve(null); 
            }
        })
        .catch(error => {
            console.error('Error searching for Vecta project:', error.message);
            reject(error); 
        });
    });
};

// Function to read workflow statuses from JSON file
const readWorkflowStatuses = async () => {
    const jsonPath = path.resolve(__dirname, '../json/workflow-statuses.json');
    console.log(`Attempting to read workflow statuses from: ${jsonPath}`);
    
    try {
        const data = await fs.readFile(jsonPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading workflow statuses:', error.message);
        throw error;
    }
};

const getVectaStatusByWinnerStatus = async (winnerStatus) => {
    const workflowStatuses = await readWorkflowStatuses(); // Get the mapping
    const vectaStatus = workflowStatuses[winnerStatus]; // Lookup the Vecta status GUID

    if (!vectaStatus) {
        console.warn(`No Vecta status found for Winner status: ${winnerStatus}`);
    }
    return vectaStatus; // Return the corresponding Vecta status GUID or undefined
};

// Function to get company information by account number
function getCompanyByAccountNumber(accountNo, vectaToken) {
    console.log(`Fetching company information for account number: ${accountNo}`);

    // Define the request options
    const options = {
        method: 'GET',
        url: `${vectaBaseUrl}/companies/accountno/${accountNo}`,
        headers: {
            'Authorization': `Bearer ${vectaToken}`,
            'x-api-key': vectaApiKey
        }
    };

    // Return a Promise for the request
    return new Promise((resolve, reject) => {
        axios(options)
            .then(function(response) {
                // Check if we have data and extract the company ID
                if (response.data && response.data.id) { // Check for object structure
                    const companyId = response.data.id; // Extract the company ID
                    console.log('Company ID found:', companyId);
                    resolve(companyId); // Resolve the promise with the company ID
                } else {
                    console.error(`No company found for account number: ${accountNo}. Response data:`, response.data);
                    reject(new Error(`Company not found for account number: ${accountNo}`)); // Reject if no data found
                }
            })
            .catch(function(error) {
                console.error('Error fetching company information:', error.message);
                console.error('Full error details:', error.response ? error.response.data : error); // Log full error details if available
                reject(new Error(`Error fetching company information for account number ${accountNo}: ${error.message}`)); // Reject for server errors
            });
    });
}


async function updateVectaProject(projectData, vectaToken) {
    console.log('Updating project in Vecta with data:', projectData);

    const options = {
        hostname: 'api.vecta.net',
        path: '/api/projects', // Ensure this is the correct path for updating projects
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${vectaToken}`,
            'x-api-key': `${vectaApiKey}`,
            'Content-Type': 'application/json',
        },
    };

    const url = `https://${options.hostname}${options.path}`;
    console.log('Request URL:', url);

    return new Promise((resolve, reject) => {
        console.log('Request options:', options);
        console.log('Request body:', JSON.stringify(projectData));

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => {
                data += chunk;
            });

            res.on('end', () => {
                console.log(`Response received. Status code: ${res.statusCode}`);
                console.log(`Response body: ${data}`);
            
                if (res.statusCode === 200) {
                    if (data) {
                        resolve(JSON.parse(data));
                    } else {
                        console.warn('Received empty response body');
                        resolve(null); // Or handle the empty response appropriately
                    }
                } else {
                    console.error('Error updating project in Vecta:', res.statusCode, data);
                    reject(new Error(`Error: ${res.statusCode}, ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('Request error:', error.message);
            reject(error);
        });

        req.write(JSON.stringify(projectData));
        req.end();
    });
}


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

