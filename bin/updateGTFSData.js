#!/usr/bin/env node

// For more complex command-line arguments (file path or url)
// https://www.npmjs.com/package/minimist

'use strict';

var fs       = require('fs')   ,
    path     = require('path') ,
    execFile = require('child_process').execFile ,

    gtfsConfig         = require('../config/GTFS.config.js') ,
    gtfsConfigFilePath = gtfsConfig.gtfsConfigFilePath       ,

    scriptRelPath = '../node_modules/MTA_Subway_GTFS-Realtime_to_SIRI_Converter/'        +
                                       'node_modules/MTA_Subway_GTFS_Toolkit/'           +
                                       'node_modules/GTFS_Toolkit/bin/updateGTFSData.js' ,

    scriptAbsPath = path.join(__dirname, scriptRelPath),

    expectedArgMessage = 
        '\tThis script expects a single command-line argument that specifies where to retrieve\n' +
        '\tthe GTFS feed data. This argument should be either "file" or "url".\n' +
        '\tIf "file" is specified, the GTFS feed data must be in a zip file archive\n' +
        '\tat the path given in the GTFS config\'s feedDataZipFilePath property.\n' +
        '\tIf "url" is specified, the GTFS feed data will be retrieved from the url given\n' + 
        '\tin GTFS config\'s feedURL property, where, again, a zip archive is the required format.\n',

    source;


if (process.argv.length !== 3) {
    console.error('USAGE:\n' + expectedArgMessage);
    process.exit(1);
} else {
    source = process.argv[2].toLowerCase();
}

if ( !((source === 'file') || (source === 'url')) ) {
   console.error("USAGE: An unrecognized GTFS feed source was given.\n" + expectedArgMessage);
   process.exit(1);
}

if (source === 'file') {
    console.log(gtfsConfig.feedDataZipFilePath);
    try {
        fs.accessSync(gtfsConfig.feedDataZipFilePath); 
    } catch (e) {
        console.error('Usage: if "file" is specified as the source from which to retrieve the GTFS feed data,\n' +
                      '\tthen the GTFS feed data must be in a zip file archive,\n' +
                      '\tat the path given in the GTFS config\'s feedDataZipFilePath property.\n' +
                      '\tWhen attempting to access a file at that location, the following error occurred:\n' +
                      e);
        process.exit(1);
    }
} else if ((source === 'url')  && (!gtfsConfig.feedURL)) {
    console.error('Usage: if "url" is specified as the source from which to retrieve the GTFS feed data,\n' +
                  '       then the feedURL property of the GTFS config object must be provided.');
    process.exit(1);
}


execFile(scriptAbsPath, [gtfsConfigFilePath, source], outputResults);


function outputResults (err, stdout, stderr) {
    if (err) {
        console.error('An error occurred while updating the GTFS data:');
        console.error(err);
        process.exit(1);
    }

    console.log('STDOUT :');
    console.log(stdout);

    console.log('STDERR :');
    console.log(stderr);

    console.log('========== GTFS data update complete. ==========');
}
