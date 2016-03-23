'use strict';

var fs    = require('fs')    ,
    path  = require('path')  ,
    merge = require('merge') ,
    async = require('async') ,
    _     = require('lodash') ,

    projectRoot = path.join(__dirname, '../../') ,
    configDirPath = path.join(projectRoot, '/config/') ,
    serverHotConfigPath = path.join(configDirPath, 'server,json') ,
    loggingHotConfigPath = path.join(configDirPath, 'logging.json') ,
    
    utils = require('../configuration/Utils') ,

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



//Initializer
(function () {

    var validationMessage ,
        activeFeedHotConfig ;


    serverHotConfig  = hotConfigGetters.getServerHotConfig() ;
    loggingHotConfig = hotConfigGetters.getLoggingHotConfig() ;


    validationMessage = serverConfigBuilder.validateHotConfigSync(serverHotConfig) ;
    if (!utils.extractValidationErrorMessages(validationMessage)) { 
        serverConfig = serverConfigBuilder.build(serverHotConfig) ;  
    } else {
        console.error(validationMessage);
        // TODO: emit event msg
    }
  


    validationMessage = loggingConfigBuilder.validateHotConfigSync(loggingHotConfig) ;
    // emit msg
    if (!utils.extractValidationErrorMessages(validationMessage)) { 
        loggingConfig = loggingConfigBuilder.build(loggingHotConfig, serverConfig) ;
    } else {
        console.error(validationMessage);
        // TODO: emit event msg
    }


    activeFeedHotConfig = hotConfigGetters.getActiveFeedHotConfig(serverHotConfig) ;

    gtfsHotConfig      = activeFeedHotConfig.gtfs;
    gtfsrtHotConfig    = activeFeedHotConfig.gtfsrt;
    converterHotConfig = activeFeedHotConfig.converter;

    validationMessage = gtfsConfigBuilder.validateHotConfigSync(gtfsHotConfig) ;
    // emit msg
    if (!utils.extractValidationErrorMessages(validationMessage)) { 
        gtfsConfig = gtfsConfigBuilder.build(gtfsHotConfig, loggingConfig) ;
    } else {
        console.error(validationMessage);
        // TODO: emit event msg
    }

    validationMessage = gtfsrtConfigBuilder.validateHotConfigSync(gtfsrtHotConfig) ;
    // emit msg
    if (!utils.extractValidationErrorMessages(validationMessage)) { 
        gtfsrtConfig = gtfsrtConfigBuilder.build(gtfsrtHotConfig) ;
    } else {
        console.error(validationMessage);
        // TODO: emit event msg
    }

    validationMessage = converterConfigBuilder.validateHotConfigSync(converterHotConfig) ;
    // emit msg
    if (!utils.extractValidationErrorMessages(validationMessage)) { 
        converterConfig = converterConfigBuilder.build(converterHotConfig, gtfsConfig, gtfsrtConfig, loggingConfig) ;
    } else {
        console.error(validationMessage);
        // TODO: emit event msg
    }
}());



function writeFeedConfig (feedName, feedHotConfig, callback) {
    var filePath = path.join(configDirPath, feedName + '.json') ;

    fs.writeFile(filePath, JSON.stringify(feedHotConfig, null, 4), callback);
}


// use this for reuse
function updateFeedConfig (feedComponentName, newHotConfig, callback) {

    var configBuilder, newConfig, listeners;

    if (feedComponentName === 'gtfs') {
        configBuilder = gtfsConfigBuilder;
    } else if (feedComponentName === 'gtfsrt') {
        configBuilder = gtfsrtConfigBuilder;
    } else if (feedComponentName === 'converter') {
        configBuilder = converterConfigBuilder;
    } else {
        return callback(new Error('Unrecognized feedComponentName name.'));
    }

    configBuilder.validateHotConfig(newHotConfig, function (err) {
        if (err) { return callback(err); }

        var newFeedConfig;

        switch (feedComponentName) {
            case 'gtfs':
                gtfsHotConfig = _.cloneDeep(newHotConfig);
                newConfig = gtfsConfig = gtfsConfigBuilder.build(gtfsHotConfig, loggingConfig);
                listeners = gtfsConfigUpdateListeners;
                break;
            case 'gtfsrt':
                gtfsrtHotConfig = _.cloneDeep(newHotConfig);
                newConfig = gtfsrtConfig = gtfsrtConfigBuilder.build(gtfsrtHotConfig);
                listeners = gtfsrtConfigUpdateListeners;
                break;
            case 'converter':
                converterHotConfig = merge(true, newHotConfig);
                newConfig = converterConfig =
                    converterConfigBuilder.build(converterHotConfig, gtfsConfig, gtfsrtConfig, loggingConfig);
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
                return callback(err) ;
            }

            listeners = listeners.map(function (listener) { 
                            return function (cb) { listener(newConfig, cb); } ;
                        });

            async.series(listeners, callback);
        });
    });
} 




var api = {


    getServerConfig : function () {
        return serverConfig;
    },

    getServerHotConfig : function () {
        return serverHotConfig;
    },


    // ASSUMES that the converter is taken off-line if activeFeed changes.
    updateServerConfig : function (newHotConfig, callback) {
        serverConfigBuilder.validateHotConfig(newHotConfig, function (validationMessage) {
            
            var errMsgs = utils.extractValidationErrorMessages(validationMessage),
                activeFeedChanged,
                aFHC;


            if (errMsgs) { 
                return callback(new Error(JSON.stringify(errMsgs, null, 4))); 
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

                aFHC = hotConfigGetters.getActiveFeedHotConfig(serverHotConfig) ;

                gtfsConfigBuilder.validateHotConfig(aFHC.gtfs, function (validationMsg) {
                    var errMsgs = utils.extractValidationErrorMessages(validationMsg);

                    if (errMsgs) { 
                        return callback(new Error(JSON.stringify(errMsgs, null, 4))); 
                    }

                    gtfsrtConfigBuilder.validateHotConfig(aFHC.gtfsrt, function (validationMsg) {
                        var errMsgs = utils.extractValidationErrorMessages(validationMsg);

                        if (errMsgs) { 
                            return callback(new Error(JSON.stringify(errMsgs, null, 4))); 
                        }

                        converterConfigBuilder.validateHotConfig(aFHC.converter, function (validationMsg) {
                            var errMsgs = utils.extractValidationErrorMessages(validationMsg) ;

                            if (errMsgs) { 
                                return callback(new Error(JSON.stringify(errMsgs, null, 4))); 
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
        return loggingConfig;
    },

    getLoggingHotConfig : function () {
        return loggingHotConfig;
    },

    updateLoggingConfig : function (newHotConfig, callback) {

        if (!newHotConfig) { callback(new Error('undefined new hot config.')); }

        loggingConfigBuilder.validateHotConfig(newHotConfig, function (validationMessage) {
                
            var errMsgs = utils.extractValidationErrorMessages(validationMessage);

            if (errMsgs) { return callback(new Error(JSON.stringify(errMsgs, null, 4))); }
               
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
        return gtfsConfig;
    },

    getGTFSHotConfig : function () {
        return gtfsHotConfig;
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
        return gtfsrtConfig;
    },

    getGTFSRealtimeHotConfig : function () {
        return gtfsrtHotConfig;
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
        return converterConfig;
    },

    getConverterHotConfig : function () {
        return converterHotConfig;
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
