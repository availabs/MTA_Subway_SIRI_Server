'use strict';


var process = require('process') ,
    fs = require('fs') ,
    path = require('path') ,

    async = require('async') ,

    projectRoot = path.join(__dirname, '../../') ,

    configDirPath = path.join(projectRoot, '/config') ,

    authenticationDirPath = path.join(projectRoot, '/src/authentication/') ;



function validator (hotConfig, callback) {

    var validationMessage = { __isValid: true } ,
        activeFeedHotConfigFileName ,
        activeFeedHotConfigPath ,
        activeFeedHotConfigDNEMessage ,
        numDays ;

    callback = (typeof callback === 'function') ? callback : null;


    if (!hotConfig) { 
        validationMessage.configuration = { 
            error: 'No server configuration provided.' 
        };
        validationMessage.__isValid = false ;

        if (callback) {
            return process.nextTick(function () { callback(validationMessage); });
        } else {
            return validationMessage;
        }
    }


    if (!hotConfig.adminKey) {
        if (hotConfig.authenticator) {
            validationMessage.adminKey = { 
                info: 'No server adminKey provided in /config/server.json. ' + 
                      'If an alternative method of administrator authentication is not ' + 
                      'implemented in the ' + hotConfig.authenticator + ' authenticator, then ' +
                      'the adinistrator console and admin server routes are not protected.'
            };
        } else {
            validationMessage.adminKey = { 
                warning: 'No server adminKey provided in /config/server.json. ' + 
                         'The adinistrator console and admin server routes are not protected.'
            };
        }
    }


    if (hotConfig.daysToKeepLogsBeforeDeleting !== undefined) {
        numDays = parseInt(hotConfig.daysToKeepLogsBeforeDeleting);

        if (isNaN(numDays)) {
            validationMessage.daysToKeepLogsBeforeDeleting = { 
                error: 'Invalid daysToKeepLogsBeforeDeleting value.' ,
            };
            validationMessage.__isValid = false;
        } else { 
            validationMessage.daysToKeepLogsBeforeDeleting = { 
                info: 'Valid daysToKeepLogsBeforeDeleting in server.json' 
            };
        }
    }


    if ((hotConfig.defaultPortNumber !== null) && (hotConfig.defaultPortNumber !== undefined)) {
    
        var defaultPortNumber = parseInt(hotConfig.defaultPortNumber);

        if (isNaN(defaultPortNumber) && (defaultPortNumber >= 1) && (defaultPortNumber <= 65535)) {
            validationMessage.defaultPortNumber = { 
                error: 'Invalid defaultPortNumber value.' ,
            };
            validationMessage.__isValid = false ;
        } else {
            validationMessage.defaultPortNumber = { 
                info: 'defaultPortNumber looks okay.' ,
            };
        }
    }



    if (callback) {

        var checkForActiveFeedConfigFile = function (cb) {
            if (typeof hotConfig.activeFeed === 'string') {
                activeFeedHotConfigFileName = hotConfig.activeFeed + '.json';
                activeFeedHotConfigPath     = path.join(configDirPath, activeFeedHotConfigFileName) ;

                activeFeedHotConfigDNEMessage = 
                    'Configuration file ' + activeFeedHotConfigFileName + ' does not exist.';

                fs.access(activeFeedHotConfigPath, fs.F_OK, function (err) {
                    if (err) {
                        validationMessage.activeFeedConfigurationFile = { 
                            error: activeFeedHotConfigDNEMessage ,
                            debug: err.stack ,
                        } ;

                        validationMessage.__isValid = false ;
                    } else {
                        validationMessage.feedConfigurationFile = { 
                            info: activeFeedHotConfigFileName + ' was found on the server.' ,
                        } ;
                    }
                    
                    cb(null);
                });
            } else {
                validationMessage.activeFeed = { 
                    error: 'The activeFeed for the server must be specified.' ,
                };
                validationMessage.__isValid = false ;
                cb(null);
            }
        } ;

        var checkForAuthenticatorModule = function (cb) {
            if (hotConfig.authenticator) {
                fs.access(path.join(authenticationDirPath, hotConfig.authenticator), function (err) {
                    if (err) {
                         validationMessage.authenticator = { 
                             error: "The authenticator " + hotConfig.authenticator + 
                                    "specified in config/server.json could not be found" ,
                             debug: (err.stack || err),
                         };
                         validationMessage.__isValid = false ;
                    } else {
                        validationMessage.authenticator = {
                            info: "User API key authentication module found." ,
                        } ;
                    }
                    cb(null);
                });
            } else {
                validationMessage.authenticator = {
                    info: "An API key authenticator was not provided in config/server.json.  " + 
                          "There is be no API key authentication for Siri requests."
                };
                cb(null);
            }
        } ;

        async.parallel([checkForActiveFeedConfigFile, checkForAuthenticatorModule], function (err) {
            if (err) {
                validationMessage.fileValidationError = { 
                        error: "There was an error while validating server configuration files." ,
                        debug: (err.stack || err),
                };
            }

            callback(validationMessage) ;
        });

    } else {

        try {
            fs.accessSync(activeFeedHotConfigPath, fs.F_OK);
        } catch (fileDoesNotExistsError) {
            validationMessage.feedConfigurationFile = { 
                error: activeFeedHotConfigDNEMessage ,
            };
            validationMessage.__isValid = false ;
        }

        if (hotConfig.authenticator) {
            try {
                fs.accessSync(path.join(authenticationDirPath, hotConfig.authenticator)) ;
                validationMessage.authenticator = {
                    info: "User API key authentication module found." ,
                } ;
            } catch (err) {
                 validationMessage.authenticator = { 
                     error: "The authenticator " + hotConfig.authenticator + 
                            "specified in config/server.json could not be found" ,
                     debug: (err.stack || err),
                 };
                 validationMessage.__isValid = false ;
            }
        } else {
            validationMessage.authenticator = {
                info: "An API key authenticator was not provided in config/server.json.  " + 
                      "There is be no API key authentication for Siri requests."
            };
        }

        return validationMessage;
    }
}



function validateHotConfig (hotConfig, callback) {
    validator(hotConfig, callback) ;
}


function validateHotConfigSync (hotConfig) {
    return validator(hotConfig) ;
}

function build (hotConfig) {
    return hotConfig;
}

module.exports = {
    validateHotConfig     : validateHotConfig ,
    validateHotConfigSync : validateHotConfigSync ,
    build                 : build ,
} ;


