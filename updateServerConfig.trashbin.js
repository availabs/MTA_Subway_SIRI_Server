    // ASSUMES that the converter is taken off-line if activeFeed changes.
    updateServerConfig : function (newHotConfig, callback) {
        serverConfigBuilder.validateHotConfig(newHotConfig, function (validationMessage) {
            
            var errMsgs = utils.extractValidationErrorMessages(validationMessage),
                activeFeedChanged,
                aFHC;

            if (errMsgs) { 
                return callback(new Error(JSON.stringify(errMsgs, null, 4))); 
            }
        
            activeFeedChanged = (newHotConfig.activeFeed !== serverHotConfig.activeFeed);

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

                                var listeners;

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

                                listeners = _.concat(
                                    serverConfigUpdateListeners.map(function (listener) { 
                                        return function (cb) { listener(_.cloneDeep(serverConfig), cb); } ;
                                    }),

                                    gtfsConfigUpdateListeners.map(function (listener) { 
                                        return function (cb) { listener(_.cloneDeep(gtfsConfig), cb); } ;
                                    }),

                                    gtfsrtConfigUpdateListeners.map(function (listener) { 
                                        return function (cb) { listener(_.cloneDeep(gtfsrtConfig), cb); } ;
                                    }),

                                    converterConfigUpdateListeners.map(function (listener) { 
                                        return function (cb) { listener(_.cloneDeep(converterConfig), cb); } ;
                                    })
                                );


                                return async.series(listeners, callback);
                            });
                        });
                    });
                });
            }
        });
    } ,


