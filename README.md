#Instructions
## System Requirements
The server must have at least 2G of RAM. This means that at least a small instance is required on AWS.

## To install and deploy on a local server.
1. `npm install --production`
2. `./bin/updateGTFSData.js`
3. `node siri_server.js`

## To deploy on AWS
1. Create a base Ubuntu 12.04/14.04 LTS Server
2. In the home directory, as the regular user, run
    `wget https://raw.githubusercontent.com/availabs/MTA_Subway_SIRI_Server/master/aws/init-script.sh`
3. `sh ./init-script.sh`
4. `cd code/MTA_Subway_SIRI_Server`
5. `node siri_server.js`

## To test: 
1. www.exampleserver.com/api/siri/vehicle-monitoring.json?key=a2aef3dc-3a02-4823-96e1-3347b535fe1a
2. www.exampleserver.com/api/siri/vehicle-monitoring.xml?key=a2aef3dc-3a02-4823-96e1-3347b535fe1a
3. 

## Port Forwarding with Apache
1. sudo apt-get install apache2
2. a2enmod proxy_http
3. create vhost config in /etc/apache2/sites-available (see apache2-api-example.conf)
4. ln -s  /etc/apache2/sites-available/apache2-api-example.conf /etc/apache2/sites-enabled/
5. sudo service apache2 restart
6. 

## The Admin Console
An Administrator Console is provided for convenience. To access the console, visit
`www.exampleserver.com/console?key=adminKey`
The adminKey is set in `config/server.json`. *You should change this key from the default value.*

## Analysis
The `analysis/` directory contains code to perform analysis on GTFS-Realtime and/or Siri feeds.
Achived GTFS-Realtime data can be fed through the converter, and, using the internal data structures 
of the converter, detailed analysis of the transit system can be conducted.

The `analysis/feedReplay/code/MockConverterService.js` class provides access to all the
internal data structures used in the GTFS-Realtime to Siri conversion process. These include:
+ The indexed GTFS static data.
+ The current GTFS-Realtime message JSON
+ The internal train tracking data.

The `analysis/feedReplay/code/scrapeState.js` script uses this server's `admin/get/server/state`
route to archive the GTFS-realtime feed to MongoDB. Currently, the scaper and the analysis code
use docker-compose to create a MongoDB container. `analysis/feedReplay/code/MockGTFS-Realtime_Feed.js`
pulls from the MongoDB archive to mock a GTFS-Feed that outputs messages as fast as possible.

Two examples of analysis code are provided in this repository:
+ `analysis/feedReplay/code/ExpectedArrivalTimeReliabiltyAnalysis.js`
+ `analysis/feedReplay/code/LocationTrackingAnalysis.js`

## Associated Projects

### SIRI_Cache_Server
https://github.com/availabs/SIRI_Cache_Server

This project provides a Node server that will visualize the locations ov vehicles in a Siri feed. It keeps the locations data for the past 24 hours. See the README for deployment instructions.

### sol-bot
https://github.com/availabs/sol-bot

This project will continuously make a high volume of requests to an MTA_Subway_SIRI_Server instance
and logs problems.  It will optionally send notifications to Slack if it detects problems, if a Slack 
token is provided. See the README for deployment instructions.

### mta-transit-node-app 
https://github.com/availabs/mta-transit-node-app

This Node/Sails app was used for data exploration of the MTA Bus Siri feed and the MTA Subway GTFS-Realtime feed.
It also was used to ensure the fidelity of the MTA GTFS-Realtime to Siri conversion server. See the README for deployment instructions.


