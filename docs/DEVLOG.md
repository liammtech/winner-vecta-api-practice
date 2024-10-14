### 14/10/2024
#### Status: Skeleton Winner Projects can now automatically transfer to Vecta
- Resolved issue surrounding Winner Projects GET calls; request header for API key needs to be lower case ("x-api-key" rather than "X-API-KEY")
- Explored a number of methods for the overall architecture, including controller-winnerClient-vectaClient. Found more ease working within singular script, for administration's sake (for the time being)
- <b>Milestone:</b> Now achieving persistently successful Winner Project endpoint calls
- Worked through/troubleshooted scripting for accessing & calling upon the Vecta database, got there eventually (the Vecta login procedure is more sophisticated than Winner's, it has a couple of extra steps)
- After a few successful POST's to Vecta, began looking to set up bridging logic. For the moment, only transferring the project's name
- Troubleshooted environment variable issues; IMPORTANT: must remember [ require('dotenv').config(); ]
- Troubleshooted server running incorrect scripts; IMPORTANT: must remember current working script needs to be in 3 locations in package.json:

        {
            "main": "scripts/server.js",
            "scripts": {
                "serve": "npm /scripts/server.js",
                "dev": "nodemon /scripts/server.js"
            }
        }

- <b>Milestone:</b> Manually transferred a project from Winner to Vecta using the script. Next is to automate this upon Winner project creation
- Created a Webhook in Winner, that sends a signal when a new project is created. This is what ngrok is for, we're basically setting up a mini web address that we give to the webhook, and set ngrok to listen. Issue is that this is freeware, whenever it gets spun up it generates a new address, so that presents a challenge to accommodate. As long as I leave the program up it'll work, but my PC can't stay on forever:
    - <b>TODO</b>: find persistent URL mechanism for webhooks
    - <b>TODO</b>: script for automatic environment setup if shutdown/failure
- Implemented more dependencies; 
    - <b>Axios</b> for requests
    - <b>Joi</b> for data validation
    - <b>ngrok</b> for gateway/ports
- Had to wrestle with ngrok/webhook a bit to get an OK response. Effectively we're setting up an endpoint within this script, so it has to point to that. Have to also parse the webhook data, and attach that to the function to fetch data from Winner (Project GUID)
- <b>Milestone:</b> Any bare-bones project created in winner can now automatically go onto Vecta. This currently only contains the project name, assigns it to Vecta's "Designs" Projects workflow, and automatically assigns IT as owner. This will work for as long as I leave this workspace/ngrok/script server running
- Also asked Luke to create a project or two, also a success. This proves the logic isn't currently tied to any one user. Still shows up under "IT" but this is as expected, it's currently hard-coded in. 
- See below image "BIG OL FAT TEST" is one I'd created, "Lucas FrazMaTazz" is Luke's (of course):

![vecta project imports](../screenshots/vecta-project-imports.png "Vecta Project Imports")

- Next is to revisit process flow, and specifically "wire up" what goes where data-wise, before implementing into script

### 13/10/2024
#### Status: One successful test call to Winner
- Initialised test server environment
- Installed various project dependencies
- Set environment parameters inc. API Keys & base URLs
- Attempted several GET calls to Winner Projects endpoint unsuccessfully, followed by one successful test call where ID parameters were hardcoded - to investigate tomorrow

### 12/10/2024
#### Status: Preparatory work
- Finished first draft of project brief
- Created process flow diagrams: General use & E-Commerce
- Initialised .gitignore to exclude TODO's and environment information
- Created development log for progress tracking
