'use strict';

var fs    = require('fs') ,
    process = require('process') ,
    path  = require('path') ,
    async = require('async') ,
    _     = require('lodash') ,

    projectRoot = path.join(__dirname, '../../') ,
    configDirPath = path.join(projectRoot, '/config/') ,
    serverHotConfigPath = path.join(configDirPath, 'server,json') ,
    loggingHotConfigPath = path.join(configDirPath, 'logging.json') ,
    

    eventCreator = require('../events/ServerEventCreator') ,

    hotConfigGetters       = require('../configuration/HotConfigGetters') ,

    serverConfigBuilder    = require('../configuration/ServerConfigBuilder') ,
    loggingConfigBuilder   = require('../configuration/LoggingConfigBuilder') ,
    gtfsConfigBuilder      = require('../configuration/GTFSConfigBuilder') ,
    gtfsrtConfigBuilder    = require('../configuration/GTFS-RealtimeConfigBuilder') ,
    converterConfigBuilder = require('../configuration/ConverterConfigBuilder') ,


    serverConfig    = null,
    serverHotConfig = null,

    loggingConfig    = null,
    loggingHotConfig = null,

    gtfsConfig    = null,
    gtfsHotConfig = null,

    gtfsrtConfig    = null,
    gtfsrtHotConfig = null,

    converterConfig    = null,
    converterHotConfig = null,

    gtfsConfigUpdateListeners      = [] ,
    gtfsrtConfigUpdateListeners    = [] ,
    converterConfigUpdateListeners = [] ,
    loggingConfigUpdateListeners   = [] ,
    serverConfigUpdateListeners    = [] ;



// TODO: If hot config invalid, set it to null.
//       Add .*HotConfigIsValid methods.
//       Converter shouldn't even try to start if not all configs valid.
//       Store the validation errors for each config in SystemStatus.
//          When ConverterService punts, output these error messages.

//Initializer
(function () {

    var validationMessage ,
        activeFeedHotConfig ;

    
    eventCreator.emitSystemStatus({
        info: 'ConfigsService initializing the various configurations' ,
        timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
    });
        
    serverHotConfig    = null ;
    loggingHotConfig   = null ;
    gtfsHotConfig      = null ;
    gtfsrtHotConfig    = null ;
    converterHotConfig = null ;

    serverHotConfig  = hotConfigGetters.getServerHotConfigSync() ;
    loggingHotConfig = hotConfigGetters.getLoggingHotConfigSync() ;


    validationMessage = serverConfigBuilder.validateHotConfigSync(serverHotConfig) ;
    validationMessage.__timestamp = (Date.now() + (process.hrtime()[1]%1000000)/1000000);

    serverConfig = serverConfigBuilder.build(_.cloneDeep(serverHotConfig)) ;  
    eventCreator.emitSystemConfigStatus(validationMessage);

    validationMessage = loggingConfigBuilder.validateHotConfigSync(loggingHotConfig) ;
    validationMessage.__timestamp = (Date.now() + (process.hrtime()[1]%1000000)/1000000);

    loggingConfig = loggingConfigBuilder.build(_.cloneDeep(loggingHotConfig), _.cloneDeep(serverConfig)) ;
    eventCreator.emitLoggingConfigStatus(validationMessage);

    try {
        activeFeedHotConfig = hotConfigGetters.getActiveFeedHotConfigSync(serverHotConfig) ;
    } catch (err) {
        activeFeedHotConfig = null;
        console.log(err.message);
    }

    gtfsHotConfig      = activeFeedHotConfig && activeFeedHotConfig.gtfs;
    gtfsrtHotConfig    = activeFeedHotConfig && activeFeedHotConfig.gtfsrt;
    converterHotConfig = activeFeedHotConfig && activeFeedHotConfig.converter;

    validationMessage = gtfsConfigBuilder.validateHotConfigSync(gtfsHotConfig) ;
    validationMessage.__timestamp = (Date.now() + (process.hrtime()[1]%1000000)/1000000);
    gtfsConfig = gtfsConfigBuilder.build(_.cloneDeep(gtfsHotConfig),_.cloneDeep(loggingConfig)) ;
    eventCreator.emitGTFSServiceConfigStatus(validationMessage);

    validationMessage = gtfsrtConfigBuilder.validateHotConfigSync(gtfsrtHotConfig) ;
    validationMessage.__timestamp = (Date.now() + (process.hrtime()[1]%1000000)/1000000);
    gtfsrtConfig = gtfsrtConfigBuilder.build(_.cloneDeep(gtfsrtHotConfig)) ;
    eventCreator.emitGTFSRealtimeServiceConfigStatus(validationMessage);

    validationMessage = converterConfigBuilder.validateHotConfigSync(converterHotConfig) ;
    validationMessage.__timestamp = (Date.now() + (process.hrtime()[1]%1000000)/1000000);
    converterConfig = converterConfigBuilder.build(_.cloneDeep(converterHotConfig), 
                                                   _.cloneDeep(gtfsConfig), 
                                                   _.cloneDeep(gtfsrtConfig), 
                                                   _.cloneDeep(loggingConfig)) ;
    eventCreator.emitConverterServiceConfigStatus(validationMessage);
}());



function writeFeedConfig (feedName, feedHotConfig, callback) {
    var filePath = path.join(configDirPath, feedName + '.json') ;

    fs.writeFile(filePath, JSON.stringify(feedHotConfig, null, 4), callback);
}


// use this for reuse
function updateFeedConfig (feedComponentName, newHotConfig, callback) {

    var configBuilder, listeners;

    if (feedComponentName === 'gtfs') {
        configBuilder = gtfsConfigBuilder;
    } else if (feedComponentName === 'gtfsrt') {
        configBuilder = gtfsrtConfigBuilder;
    } else if (feedComponentName === 'converter') {
        configBuilder = converterConfigBuilder;
    } else {
        return callback(new Error('Unrecognized feedComponentName name.'));
    }

    configBuilder.validateHotConfig(newHotConfig, function (validationMessage) {
        validationMessage.__timestamp = (Date.now() + (process.hrtime()[1]%1000000)/1000000);

        if (!validationMessage.__isValid) { 

            eventCreator.emitSystemStatus({
                error: 'New ' + feedComponentName + ' validation failed.' ,
                timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
            });

            return callback(new Error(JSON.stringify(validationMessage))); 
        }


        var newComponentConfig, newFeedConfig;

        switch (feedComponentName) {
            case 'gtfs':
                eventCreator.emitGTFSServiceConfigStatus(validationMessage);
                gtfsHotConfig = _.merge(_.cloneDeep(gtfsHotConfig), _.cloneDeep(newHotConfig));
                gtfsConfig = _.cloneDeep(
                    gtfsConfigBuilder.build(_.cloneDeep(gtfsHotConfig),_.cloneDeep(loggingConfig))
                );
                newComponentConfig = gtfsConfig;
                listeners = gtfsConfigUpdateListeners;
                break;
            case 'gtfsrt':
                eventCreator.emitGTFSRealtimeServiceConfigStatus(validationMessage);
                gtfsrtHotConfig = _.merge(_.cloneDeep(gtfsrtHotConfig), _.cloneDeep(newHotConfig));
                gtfsrtConfig = _.cloneDeep(gtfsrtConfigBuilder.build(_.cloneDeep(gtfsrtHotConfig)));
                newComponentConfig = gtfsrtConfig;
                listeners = gtfsrtConfigUpdateListeners;
                break;
            case 'converter':
                eventCreator.emitConverterServiceConfigStatus(validationMessage);
                converterHotConfig = _.merge(_.cloneDeep(converterHotConfig), newHotConfig);
                converterConfig = _.cloneDeep(converterConfigBuilder.build(_.cloneDeep(converterHotConfig), 
                                                                           _.cloneDeep(gtfsConfig), 
                                                                           _.cloneDeep(gtfsrtConfig), 
                                                                           _.cloneDeep(loggingConfig)));
                newComponentConfig = converterConfig;
                listeners = converterConfigUpdateListeners;
                break;
            default:
                break;
        }

        newFeedConfig = {
            gtfs      : gtfsHotConfig ,
            gtfsrt    : gtfsrtHotConfig ,
            converter : converterHotConfig ,
        };

        // Write the feed config to disk.
        writeFeedConfig(serverConfig.activeFeed, newFeedConfig, function (err) {
            if (err) {
                eventCreator.emitSystemStatus({
                    error: 'New ' + feedComponentName + ' configuration could not be persisted to disk.' ,
                    debug: (err.stack || err) ,
                    timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
                });

                return callback(err) ;
            }

            eventCreator.emitSystemStatus({
                info: 'New ' + feedComponentName + ' configuration persisted to disk.' ,
                timestamp: (Date.now() + (process.hrtime()[1]%1000000)/1000000) ,
            });

            listeners = listeners.map(function (listener) { 
                            return function (cb) { listener(_.cloneDeep(newComponentConfig), cb); } ;
                        });

            async.series(listeners, callback);
        });
    });
} 




var api = {


    getServerConfig : function () {
        return _.cloneDeep(serverConfig);
    },

    getServerHotConfig : function () {
        return _.cloneDeep(serverHotConfig);
    },


    // ASSUMES that the converter is taken off-line if activeFeed changes.
    updateServerConfig : function (newHotConfig, callback) {
        serverConfigBuilder.validateHotConfig(newHotConfig, function (validationMessage) {
            validationMessage.__timestamp = (Date.now() + (process.hrtime()[1]%1000000)/1000000);
            
            var activeFeedChanged,
                aFHC;


            if (!validationMessage.__isValid) { 
                return callback(new Error(JSON.stringify(validationMessage))); 
            }
        
            if (!activeFeedChanged) {
                return fs.writeFile(serverHotConfigPath, JSON.stringify(newHotConfig, null, 4), function (err) {
                    if (err) { return callback(err) ; } 

                    serverHotConfig = _.cloneDeep(newHotConfig);
                    serverConfig    = serverConfigBuilder.build(serverHotConfig);
            
                    var listeners = serverConfigUpdateListeners.map(function (listener) { 
                        return function (cb) { listener(_.cloneDeep(serverHotConfig), cb); } ;
                    });

                    return async.series(listeners, callback);
                });

            } else {

                try {
                    aFHC = hotConfigGetters.getActiveFeedHotConfigSync(serverHotConfig) ;
                } catch (err) {
                    //emit event
                    return callback(err) ;
                }

                gtfsConfigBuilder.validateHotConfig(aFHC.gtfs, function (validationMsg) {

                    if (validationMsg.__isValid) { 
                        return callback(new Error(JSON.stringify(validationMessage))); 
                    }

                    gtfsrtConfigBuilder.validateHotConfig(aFHC.gtfsrt, function (validationMsg) {

                        if (validationMsg.__isValid) { 
                            return callback(new Error(JSON.stringify(validationMessage))); 
                        }

                        converterConfigBuilder.validateHotConfig(aFHC.converter, function (validationMsg) {

                            if (validationMsg.__isValid) { 
                                return callback(new Error(JSON.stringify(validationMessage))); 
                            }

                            fs.writeFile(serverHotConfigPath, JSON.stringify(newHotConfig, null, 4), function (err) {
                                if (err) { return callback(err) ; } 

                                var serverCULs,
                                    
                                    conversionSystemCULs = [
                                        gtfsConfigUpdateListeners,
                                        gtfsrtConfigUpdateListeners,
                                        converterConfigUpdateListeners,
                                    ],

                                    allListenersRemoved = _.every(conversionSystemCULs, function (listeners) {
                                                                return (listeners.length === 0);
                                                            });

                                if (!allListenersRemoved) {
                                    //TODO: Emit error here.
                                    console.error(
                                        'WARNING: The converter should be shut down when changing the active feed!!!'
                                    );
                                }

                                serverHotConfig    = _.cloneDeep(newHotConfig);
                                gtfsHotConfig      = _.cloneDeep(aFHC.gtfs);
                                gtfsrtHotConfig    = _.cloneDeep(aFHC.gtfsrt);
                                converterHotConfig = _.cloneDeep(aFHC.converter);

                                serverConfig     = serverConfigBuilder.build(serverHotConfig);
                                gtfsConfig       = gtfsConfigBuilder(gtfsHotConfig, loggingConfig);
                                gtfsrtConfig     = gtfsrtConfigBuilder(gtfsrtHotConfig);
                                converterConfig  = converterConfigBuilder.build(converterHotConfig, 
                                                                                gtfsConfig, 
                                                                                gtfsrtConfig, 
                                                                                loggingConfig);

                                serverCULs = serverConfigUpdateListeners.map(function (listener) { 
                                    return function (cb) { listener(_.cloneDeep(serverConfig), cb); } ;
                                });

                                return async.series(serverCULs, callback);
                            });
                        });
                    });
                });
            }
        });
    } ,

    addServerConfigUpdateListener : function (listener) {
        if ((typeof listener) === "function") {
            serverConfigUpdateListeners.push(listener);
        } else {
            throw new Error('Listeners must be functions..');
        }
    },

    removeServerConfigUpdateListener : function (listener) {
        for (var i = 0; i < serverConfigUpdateListeners.length; ++i) {
            if (serverConfigUpdateListeners[i] === listener) {
                serverConfigUpdateListeners.splice(i, 1);
                return;
            }
        }
    },


    getLoggingConfig : function () {
        return _.cloneDeep(loggingConfig);
    },

    getLoggingHotConfig : function () {
        return _.cloneDeep(loggingHotConfig);
    },

    updateLoggingConfig : function (newHotConfig, callback) {

        if (!newHotConfig) { callback(new Error('undefined new hot config.')); }

        loggingConfigBuilder.validateHotConfig(newHotConfig, function (validationMessage) {

            validationMessage.__timestamp = (Date.now() + (process.hrtime()[1]%1000000)/1000000);
                
            if (!validationMessage.__isValid) { 
                return callback(new Error(JSON.stringify(validationMessage))); 
            }
               
            fs.writeFile(loggingHotConfigPath, JSON.stringify(newHotConfig, null, 4), function (err) {
                if (err) { return callback(err); }

                var i ;

                loggingHotConfig = _.cloneDeep(newHotConfig);
 
                loggingConfig = loggingConfigBuilder.build(loggingHotConfig, serverConfig);

                gtfsConfig = gtfsConfigBuilder.updateLogging(gtfsConfig, loggingConfig);
                converterConfig = converterConfigBuilder.updateLogging(converterConfig, loggingConfig);

                for ( i = 0; i < loggingConfigUpdateListeners.length; ++i ) {
                    loggingConfigUpdateListeners[i](loggingConfig);
                }
                for ( i = 0; i < gtfsConfigUpdateListeners.length; ++i ) {
                    gtfsConfigUpdateListeners[i](gtfsConfig);
                }
                for ( i = 0; i < converterConfigUpdateListeners.length; ++i ) {
                    converterConfigUpdateListeners[i](converterConfig) ;
                }

                callback(null) ;
            });
        });
    } ,

    addLoggingConfigUpdateListener : function (listener) {
        if ((typeof listener) === "function") {
            loggingConfigUpdateListeners.push(listener);
        } else {
            throw new Error('Listeners must be functions..');
        }
    },

    removeLoggingConfigUpdateListener : function (listener) {
        for (var i = 0; i < loggingConfigUpdateListeners.length; ++i) {
            if (loggingConfigUpdateListeners[i] === listener) {
                loggingConfigUpdateListeners.splice(i, 1);
                return;
            }
        }
    },



    getGTFSConfig : function () {
        return _.cloneDeep(gtfsConfig);
    },

    getGTFSHotConfig : function () {
        return _.cloneDeep(gtfsHotConfig);
    },

    addGTFSConfigUpdateListener : function (listener) {
        if ((typeof listener) === "function") {
            gtfsConfigUpdateListeners.push(listener);
        } else {
            throw new Error('Listeners must be functions..');
        }
    },

    updateGTFSConfig : updateFeedConfig.bind(null, 'gtfs'),

    removeGTFSConfigUpdateListener : function (listener) {
        for (var i = 0; i < gtfsConfigUpdateListeners.length; ++i) {
            if (gtfsConfigUpdateListeners[i] === listener) {
                gtfsConfigUpdateListeners.splice(i, 1);
                return;
            }
        }
    },



    getGTFSRealtimeConfig : function () {
        return _.cloneDeep(gtfsrtConfig);
    },

    getGTFSRealtimeHotConfig : function () {
        return _.cloneDeep(gtfsrtHotConfig);
    },

    updateGTFSRealtimeConfig : updateFeedConfig.bind(null, 'gtfsrt') ,

    // listener will be passed two arguments:
    //      1. a config obj 
    //      2. a callback
    addGTFSRealtimeConfigUpdateListener : function (listener) {
        if ((typeof listener) === "function") {
            gtfsrtConfigUpdateListeners.push(listener);
        } else {
            throw new Error('Listeners must be functions..');
        }
    },

    removeGTFSRealtimeConfigUpdateListener : function (listener) {
        for (var i = 0; i < gtfsrtConfigUpdateListeners.length; ++i) {
            if (gtfsrtConfigUpdateListeners[i] === listener) {
                gtfsrtConfigUpdateListeners.splice(i, 1);
                return;
            }
        }
    },



    getConverterConfig : function () {
        return _.cloneDeep(converterConfig);
    },

    getConverterHotConfig : function () {
        return _.cloneDeep(converterHotConfig);
    },

    updateConverterConfig : updateFeedConfig.bind(null, 'converter'),

    addConverterConfigUpdateListener : function (listener) {
        if ((typeof listener) === "function") {
            converterConfigUpdateListeners.push(listener);
        } else {
            throw new Error('Listeners must be functions..');
        }
    },

    removeConverterConfigUpdateListener : function (listener) {
        for (var i = 0; i < converterConfigUpdateListeners.length; ++i) {
            if (converterConfigUpdateListeners[i] === listener) {
                converterConfigUpdateListeners.splice(i, 1);
                return;
            }
        }
    },


    removeTrainTrackerInitialStateFromConverterConfig : function () {
        converterConfig.trainTrackerInitialState = null; // Let GC take care of this.
    } ,
};


module.exports = api;
