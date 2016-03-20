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

    validConfiguration ,

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

    validConfiguration = false;

    serverHotConfig  = hotConfigGetters.getServerHotConfig() ;
    loggingHotConfig = hotConfigGetters.getLoggingHotConfig() ;


    validationMessage = serverConfigBuilder.validateHotConfigSync(serverHotConfig) ;
    // emit msg
    if (utils.extractValidationErrorMessages(validationMessage)) { return; }
    serverConfig = serverConfigBuilder.build(serverHotConfig) ;


    validationMessage = loggingConfigBuilder.validateHotConfigSync(loggingHotConfig) ;
    // emit msg
    if (utils.extractValidationErrorMessages(validationMessage)) { return; }
    loggingConfig = loggingConfigBuilder.build(loggingHotConfig, serverConfig) ;


    activeFeedHotConfig = hotConfigGetters.getActiveFeedHotConfig(serverHotConfig) ;

    gtfsHotConfig      = activeFeedHotConfig.gtfs;
    gtfsrtHotConfig    = activeFeedHotConfig.gtfsrt;
    converterHotConfig = activeFeedHotConfig.converter;


    validationMessage = gtfsConfigBuilder.validateHotConfigSync(gtfsHotConfig) ;
    // emit msg
    if (utils.extractValidationErrorMessages(validationMessage)) { return; }
    gtfsConfig = gtfsConfigBuilder.build(gtfsHotConfig, loggingConfig) ;

    validationMessage = gtfsrtConfigBuilder.validateHotConfigSync(gtfsrtHotConfig) ;
    // emit msg
    if (utils.extractValidationErrorMessages(validationMessage)) { return; }
    gtfsrtConfig = gtfsrtConfigBuilder.build(gtfsrtHotConfig) ;

    validationMessage = converterConfigBuilder.validateHotConfigSync(converterHotConfig) ;
    // emit msg
    if (utils.extractValidationErrorMessages(validationMessage)) { return; }
    converterConfig = converterConfigBuilder.build(converterHotConfig, loggingConfig, gtfsConfig, gtfsrtConfig) ;


    validConfiguration = true ;
}());



function writeFeedConfig (feedName, feedHotConfig, callback) {
    var filePath = path.join(configDirPath, feedName + '.json') ;

    fs.writeFile(filePath, JSON.stringify(feedHotConfig, null, 4), callback);
}


// use this for reuse
function updateFeedConfig (newHotConfig, callback) {
    /* jshint validthis: true */
    this.configBuilder.validateHotConfig(newHotConfig, function (err) {
        if (err) { return callback(err); }

        var newFeedConfig ;

        // Update the configs in the components by reference.
        merge(this.hotConfig, newHotConfig);
        merge(this.config, this.configBuilder.build(this.hotConfig));

        if (this.configBuilder === converterConfigBuilder) {
            merge(this.config, { gtfsConfig: gtfsConfig, gtfsrtConfig: gtfsrtConfig });
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

            var listeners = this.updateListeners.map(function (listener) { 
                               return function (cb) { listener(newHotConfig, cb); } ;
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

    updateServerConfig : function (newHotConfig, callback) {
        serverConfigBuilder.validateHotConfig(newHotConfig, function (validationMessage) {
            
            var errMsgs = utils.extractValidationErrorMessages(validationMessage),
                activeFeedChanged,
                aFHC;

            if (errMsgs) { 
                return callback(new Error(JSON.stringify(errMsgs, null, 4))); 
            }
        
            activeFeedChanged = (newHotConfig.activeFeed !== serverHotConfig.activeFeed);

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

                            var listeners;

                            merge(serverHotConfig, newHotConfig);
                            merge(gtfsHotConfig, aFHC.gtfs);
                            merge(gtfsrtHotConfig, aFHC.gtfsrt);
                            merge(converterHotConfig, aFHC.converter);

                            merge(serverConfig, serverConfigBuilder(serverHotConfig));
                            merge(loggingHotConfig, loggingConfigBuilder(loggingHotConfig));
                            merge(gtfsConfig, gtfsConfigBuilder(gtfsHotConfig));
                            merge(gtfsrtConfig, gtfsrtConfigBuilder(gtfsrtHotConfig));
                            merge(converterConfig, converterConfigBuilder(converterHotConfig));

                            listeners = serverConfigUpdateListeners.map(function (listener) { 
                                           return function (cb) { listener(newHotConfig, cb); } ;
                                        });

                            return async.series(listeners, callback);
                        });
                    });
                });
            });
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

            if (errMsgs) { 
                return callback(new Error(JSON.stringify(errMsgs, null, 4))); 
            }

               
            fs.writeFile(loggingHotConfigPath, JSON.stringify(loggingHotConfig, null, 4), function (err) {
                if (err) { return callback(err); }

                var oldHotConfigKeys = _.keys(loggingHotConfig) ,
                    newHotConfigKeys = _.keys(newHotConfig) ,
                    omittedKeys      = _.difference(oldHotConfigKeys, newHotConfigKeys) ,
                    i ;


                for ( i = 0; i < newHotConfigKeys.length; ++i) {
                    loggingHotConfig[newHotConfigKeys[i]] = !!(newHotConfig[newHotConfigKeys[i]]) ;
                }
                    
                for ( i = 0; i < omittedKeys.length; ++i) {
                    loggingHotConfig[omittedKeys[i]] = false;
                }
 
                merge(loggingConfig, loggingConfigBuilder.build(loggingHotConfig)) ;

                gtfsConfigBuilder.updateLogging(gtfsConfig, loggingConfig);
                converterConfigBuilder.updateLogging(converterConfig, loggingConfig);
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

    updateGTFSConfig : updateFeedConfig.bind({ 
        configBuilder   : gtfsConfigBuilder,
        hotConfig       : gtfsHotConfig,
        updateListeners : gtfsConfigUpdateListeners ,
    }),

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

    updateGTFSRealtimeConfig : updateFeedConfig.bind({ 
        configBuilder   : gtfsrtConfigBuilder,
        hotConfig       : gtfsrtHotConfig,
        updateListeners : gtfsrtConfigUpdateListeners ,
    }),

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

    updateConverterConfig : updateFeedConfig.bind({ 
        configBuilder   : converterConfigBuilder,
        hotConfig       : converterHotConfig,
        updateListeners : converterConfigUpdateListeners ,
    }),


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
