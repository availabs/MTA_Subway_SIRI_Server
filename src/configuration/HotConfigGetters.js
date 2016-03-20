'use strict';




var fs = require('fs') ,
    path = require('path') ,

    ServerEventCreator = require('../events/ServerEventCreator') ,

    projectRoot = path.join(__dirname, '../../') ,

    configDirPath = path.join(projectRoot, 'config/') ,

    loggingHotConfigPath = path.join(projectRoot, '/config/logging.json') ,
    serverHotConfigPath = path.join(projectRoot, '/config/server.json') ;



function getLoggingHotConfig () {

    try { // Try reading the logging hot config file. 

        var loggingHotConfigJSON = fs.readFileSync(loggingHotConfigPath) ;

        try { // Try parsing the logging hot config JSON string read from the file.
            var loggingHotConfig = JSON.parse(loggingHotConfigJSON);

            ServerEventCreator.emitStartupLoggingConfigStatus({
                debug: 'The logging.json was successfully parsed.' ,
            });

            return loggingHotConfig;

        } catch (parseErr) { // Catch the JSON.parse error.
            ServerEventCreator.emitStartupLoggingConfigStatus({
                error: 'ERROR: The logging configuration file could not be parsed. ' + 
                      'All logging will be turned off.' ,
                debug: (parseErr.stack || parseErr) ,
            });

            return null;
        }

    } catch (readFileError) { // Catch the readFileSync error.

        // TODO: Use error code for more precise error message.
        ServerEventCreator.emitStartupLoggingConfigStatus({
            error: 'ERROR: The logging.json file could not be read. All logging will be turned off.' ,
            debug: (readFileError.stack || readFileError) ,
        });

        return null;
    }
}



function getServerHotConfig () {

    try {
        var serverHotConfigJSON = fs.readFileSync(serverHotConfigPath);

        ServerEventCreator.emitStartupServerConfigStatus({
            debug: 'server.json configuration file successfully read.' ,
        });

            try {
                var serverHotConfig = JSON.parse(serverHotConfigJSON);

                ServerEventCreator.emitStartupServerConfigStatus({
                    debug: 'server.json configuration file successfully parsed.' ,
                });

                return serverHotConfig;

            } catch (parseErr) {
                ServerEventCreator.emitStartupServerConfigStatus({
                    error: 'Could not parse the /server.json file.' ,
                    debug: (parseErr.stack || parseErr) ,
                });

                return null;
            }

    } catch (readFileError) {
        ServerEventCreator.emitStartupServerConfigStatus({
            error: 'Could not read the server.json file. ' +  
                   'The server.json file is required to specify the active GTFS-Realtime feed (activeFeed). ' +
                   'The server will not be available until a server.json file is provided.' ,
            debug: (readFileError.stack || readFileError) ,
        });

        return null;
    }
}



function getActiveFeedHotConfig (serverHotConfig) {

    if (!serverHotConfig) { return null; }


    var activeFeed = serverHotConfig.activeFeed ,
        activeFeedHotConfigPath;

    if (!activeFeed) {
        ServerEventCreator.emitStartupServerConfigStatus({
            error: 'ERROR: Invalid server.json file. `activeFeed` is not provided.' +
                   'The server.json file must specify the active GTFS-Realtime feed (activeFeed). ' +
                   'The server will not be available until server.json provides this information.' ,
        });

        return null;
    }


    activeFeedHotConfigPath = path.join(configDirPath, activeFeed + '.json');

    ServerEventCreator.emitStartupActiveFeedConfigStatus({
        debug: 'The active feed is set to ' + activeFeed + '.',
    });

    try {
        var activeFeedConfigJSON = fs.readFileSync(activeFeedHotConfigPath) ;

        ServerEventCreator.emitStartupActiveFeedConfigStatus({
            debug: activeFeed + ' configuration file read from disk.'
        });

        try {
            var activeFeedConfig = JSON.parse(activeFeedConfigJSON) ;

            ServerEventCreator.emitStartupActiveFeedConfigStatus({
                debug: 'Successfuly parsed the configuration file for ' + activeFeed + '.' ,
            });

            if (!activeFeedConfig) {
                ServerEventCreator.emitStartupActiveFeedConfigStatus({
                    error: 'The configuration file for ' + activeFeed + 'is not valid.' ,
                });
            } 

            return {
                gtfs      : (activeFeedConfig.gtfs || null),
                gtfsrt    : (activeFeedConfig.gtfsrt || null),
                converter : (activeFeedConfig.converter || null),
            } ;

        } catch (parseErr) {

            ServerEventCreator.emitStartupActiveFeedConfigStatus({
                error: 'Could not parse the configuration file for ' + activeFeed + '.' ,
                debug: (parseErr.stack || parseErr) ,
            });
            
            return null;
        }

    } catch (fileReadError) {
        ServerEventCreator.emitStartupActiveFeedConfigStatus({
            error: 'Could not read the configuration file for the feed named ' + activeFeed + '.' ,
            debug: (fileReadError.stack || fileReadError) ,
        });

        return null;
    }
}




module.exports = {
    getServerHotConfig : getServerHotConfig ,
    getLoggingHotConfig : getLoggingHotConfig ,
    getActiveFeedHotConfig : getActiveFeedHotConfig ,
};
