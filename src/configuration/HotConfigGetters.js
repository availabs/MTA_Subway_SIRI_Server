'use strict';




var fs = require('fs') ,
    process = require('process') ,
    path = require('path') ,

    eventCreator = require('../events/ServerEventCreator') ,

    projectRoot = path.join(__dirname, '../../') ,

    configDirPath = path.join(projectRoot, '/config/') ,

    loggingHotConfigPath = path.join(projectRoot, '/config/logging.json') ,
    serverHotConfigPath = path.join(projectRoot, '/config/server.json') ;



function getLoggingHotConfigSync () {

    try { // Try reading the logging hot config file. 

        var loggingHotConfigJSON = fs.readFileSync(loggingHotConfigPath) ;

        try { // Try parsing the logging hot config JSON string read from the file.
            var loggingHotConfig = JSON.parse(loggingHotConfigJSON);

            eventCreator.emitLoggingConfigStatus({
                debug: 'The logging.json was successfully parsed.' ,
            });

            return loggingHotConfig;

        } catch (parseErr) { // Catch the JSON.parse error.
            eventCreator.emitLoggingConfigStatus({
                error: 'ERROR: The logging configuration file could not be parsed. ' + 
                      'All logging will be turned off.' ,
                debug: (parseErr.stack || parseErr) ,
            });

            return null;
        }

    } catch (readFileError) { // Catch the readFileSync error.

        // TODO: Use error code for more precise error message.
        eventCreator.emitLoggingConfigStatus({
            error: 'ERROR: The logging.json file could not be read. All logging will be turned off.' ,
            debug: (readFileError.stack || readFileError) ,
        });

        return null;
    }
}



function getServerHotConfigSync () {

    try {
        var serverHotConfigJSON = fs.readFileSync(serverHotConfigPath);

        eventCreator.emitSystemConfigStatus({
            debug: 'server.json configuration file successfully read.' ,
        });

            try {
                var serverHotConfig = JSON.parse(serverHotConfigJSON);

                eventCreator.emitSystemConfigStatus({
                    debug: 'server.json configuration file successfully parsed.' ,
                });

                return serverHotConfig;

            } catch (parseErr) {
                eventCreator.emitSystemConfigStatus({
                    error: 'Could not parse the /server.json file.' ,
                    debug: (parseErr.stack || parseErr) ,
                });

                return null;
            }

    } catch (readFileError) {
        eventCreator.emitSystemConfigStatus({
            error: 'Could not read the server.json file. ' +  
                   'The server.json file is required to specify the active GTFS-Realtime feed (activeFeed). ' +
                   'The server will not be available until a server.json file is provided.' ,
            debug: (readFileError.stack || readFileError) ,
        });

        return null;
    }
}



function getActiveFeedHotConfigSync (serverHotConfig) {

    if (!serverHotConfig) { return null; }


    var activeFeed = serverHotConfig.activeFeed ,
        activeFeedHotConfigPath,
        errMsg;

    if (!activeFeed) {
        errMsg = 'ERROR: Invalid server.json file. `activeFeed` is not provided.' +
                 'The server.json file must specify the active GTFS-Realtime feed (activeFeed). ' +
                 'The server will not be available until server.json provides this information.' ;

        eventCreator.emitSystemConfigStatus({
            error: errMsg ,
            debug: new Error(errMsg) ,
        });

        throw new Error(errMsg) ;
    }


    activeFeedHotConfigPath = path.join(configDirPath, activeFeed + '.json');

    eventCreator.emitSystemStatus({
        debug: 'The active feed is set to ' + activeFeed + '.',
        timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
    });


    try {
        var activeFeedConfigJSON = fs.readFileSync(activeFeedHotConfigPath) ;

        eventCreator.emitSystemStatus({
            debug: activeFeed + ' configuration file read from disk.' ,
            timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
        });

        try {
            var activeFeedConfig = JSON.parse(activeFeedConfigJSON) ;

            eventCreator.emitSystemStatus({
                debug: 'Successfuly parsed the configuration file for ' + activeFeed + '.' ,
                timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
            });

            if (!activeFeedConfig) {
                eventCreator.emitSystemStatus({
                    error: 'The configuration file for ' + activeFeed + 'is not valid.' ,
                    timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
                });
            } 

            return {
                gtfs      : (activeFeedConfig.gtfs || null),
                gtfsrt    : (activeFeedConfig.gtfsrt || null),
                converter : (activeFeedConfig.converter || null),
            } ;

        } catch (parseErr) {

            eventCreator.emitSystemStatus({
                error: 'Could not parse the configuration file for ' + activeFeed + '.' ,
                debug: (parseErr.stack || parseErr) ,
                timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
            });
            
            throw parseErr;
        }

    } catch (fileReadError) {
        eventCreator.emitSystemStatus({
            error: 'Could not read the configuration file for the feed named ' + activeFeed + '.' ,
            debug: (fileReadError.stack || fileReadError) ,
            timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
        });

        throw fileReadError;
    }
}




module.exports = {
    getServerHotConfigSync     : getServerHotConfigSync ,
    getLoggingHotConfigSync    : getLoggingHotConfigSync ,
    getActiveFeedHotConfigSync : getActiveFeedHotConfigSync ,
};




//emitSystemStatus 
//emitSystemConfigStatus 
//emitLoggingStatus 
//emitLoggingConfigStatus 
//emitGTFSServiceStatus 

//emitGTFSServiceConfigStatus 
//emitGTFSDataUpdateStatus 

//emitGTFSRealtimeServiceStatus 
//emitGTFSRealtimeServiceConfigStatus 
//emitConverterServiceStatus 
//emitConverterServiceConfigStatus 
//emitConverterServiceStartedEvent 
//emitConverterServiceStoppedEvent 
//emitError 
//emitDataAnomaly 

