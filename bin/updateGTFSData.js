#!/usr/bin/env node

'use strict';

var path     = require('path')                   ,
    execFile = require('child_process').execFile ,

    gtfsConfig         = require('../config/GTFS_config.js')         ,
    gtfsConfigFilePath = gtfsConfig.gtfsConfigFilePath               ,
    gtfsLatestDataURL  = process.argv[2] || gtfsConfig.latestDataURL ,

    scriptRelPath = '../node_modules/MTA_Subway_GTFS-Realtime_to_SIRI_Converter/'        +
                                       'node_modules/MTA_Subway_GTFS_Toolkit/'           +
                                       'node_modules/GTFS_Toolkit/bin/updateGTFSData.js' ,

    scriptAbsPath = path.normalize(path.join(__dirname, scriptRelPath));


if ( ! gtfsLatestDataURL ) {
    console.error('Usage: if gtfsLatestDataURL is not specified in ../config/GTFS_config.js, ' + 
                  '\tthen the URL from which to get the data must be provided as a command-line argument.');
    process.exit(1);
}


execFile(scriptAbsPath, [gtfsConfigFilePath, gtfsLatestDataURL], outputResults);


function outputResults (err) {
    if (err) {
        console.error('An error occurred while updating the GTFS data:');
        console.error(err);
        process.exit(1);
    }

    console.log('========== GTFS data update complete. ==========');
}
