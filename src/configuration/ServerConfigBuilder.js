'use strict';


var process = require('process') ,
    fs = require('fs') ,
    path = require('path') ,

    projectRoot = path.join(__dirname, '../../') ,

    configDirPath = path.join(projectRoot, '/config') ;



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


    // This must be the last validation check due to the async file access check.
    if (typeof hotConfig.activeFeed === 'string') {
        activeFeedHotConfigFileName = hotConfig.activeFeed + '.json';
        activeFeedHotConfigPath = path.join(configDirPath, activeFeedHotConfigFileName) ;

        activeFeedHotConfigDNEMessage = 'Configuration file ' + activeFeedHotConfigFileName + ' does not exist.';

        if (callback) {
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

                if (validationMessage) {
                    callback(validationMessage) ;
                }
            });
        } else {
            try {
                fs.accessSync(activeFeedHotConfigPath, fs.F_OK);
            } catch (fileDoesNotExistsError) {
                 validationMessage.feedConfigurationFile = { 
                     error: activeFeedHotConfigDNEMessage ,
                 };
                 validationMessage.__isValid = false ;
            } finally {
                return validationMessage;
            }
        }
    } else {
        validationMessage.activeFeed = { 
            error: 'The activeFeed for the server must be specified.' ,
        };
        validationMessage.__isValid = false ;
    }

        
    if (callback) {
        return process.nextTick(function () { callback(validationMessage); });
    } else {
        return validationMessage;
    }

    return true;
}



function validateHotConfig (hotConfig, callback) {
    validator(hotConfig, callback) ;
}


function validateHotConfigSync (hotConfig) {
    return validator(hotConfig) ;
}

function build (hotConfig) {
    return hotConfig ;
}

module.exports = {
    validateHotConfig     : validateHotConfig ,
    validateHotConfigSync : validateHotConfigSync ,
    build                 : build ,
} ;


