#Instructions
## To install and deploy on a local server.
1. `npm install --production`
2. `./bin/updateGTFSData.js`
3. `node siri_server.js`

## To deploy on AWS
1. Create a base Ubuntu 12.04 LTS Server
2. In the home directory, as the regular user, run
    `wget https://raw.githubusercontent.com/availabs/MTA_Subway_SIRI_Server/master/aws/init-script.sh`
3. `sh ./init-script.sh`
4. `cd code/MTA_Subway_SIRI_Server`
5. `node siri_server.js`

## To test: 
1. www.exampleserver.com/api/siri/vehicle-monitoring.json?key=a2aef3dc-3a02-4823-96e1-3347b535fe1a
2. www.exampleserver.com/api/siri/vehicle-monitoring.xml?key=a2aef3dc-3a02-4823-96e1-3347b535fe1a
