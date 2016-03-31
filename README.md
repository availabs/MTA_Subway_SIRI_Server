#Instructions
## More instruction coming shortly.
1. `npm install --production`
2. `./bin/updateGTFSData.js`
3. `node mta_siri_server.js`

## To deploy on AWS
1. Create a base Ubuntu 12.04 LTS Server
2. In the home directory, as the regular user, run
    `wget https://raw.githubusercontent.com/availabs/MTA_Subway_SIRI_Server/master/aws/init-script.sh`
3. `chmod +x init-script.sh`
4. `./init-script.sh`
5. `cd code/MTA_Subway_SIRI_Server`
6. `node mta_siri_server.js`
