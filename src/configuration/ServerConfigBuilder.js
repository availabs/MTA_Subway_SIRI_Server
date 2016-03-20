'use strict';


var process = require('process') ,
    fs = require('fs') ,
    path = require('path') ,

    _ = require('lodash') ,

    projectRoot = path.join(__dirname, '../../') ,

    configDirPath = path.join(projectRoot, '/config') ;



function validator (hotConfig, callback) {

    var validationMessage = {} ,
        activeFeedHotConfigFileName ,
        activeFeedHotConfigPath ,
        activeFeedHotConfigDNEMessage ,
        numDays ;

    callback = (typeof callback === 'function') ? callback : null;


    if (!hotConfig) { 
        validationMessage.configuration = { error: 'No server configuration provided.' };

        if (callback) {
            return process.nextTick(function () { callback(validationMessage); });
        } else {
            return validationMessage;
        }
    }

    if (hotConfig.daysToKeepLogsBeforeDeleting !== undefined) {
        numDays = parseInt(hotConfig.daysToKeepLogsBeforeDeleting);

        if (isNaN(numDays)) {
            validationMessage.daysToKeepLogsBeforeDeleting = { error: 'Invalid daysToKeepLogsBeforeDeleting value.' };
        } else { 
            validationMessage.daysToKeepLogsBeforeDeleting = 
                { info: 'Valid daysToKeepLogsBeforeDeleting in server.json' };
        }
    }

    if (hotConfig.defaultPortNumber) {
    
        if (isNaN(parseInt(hotConfig.defaultPortNumber))) {
            validationMessage.defaultPortNumber = { error: 'Invalid defaultPortNumber value.' };
        } else {
            validationMessage.defaultPortNumber = { info: 'defaultPortNumber looks okay.' };
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
                    validationMessage.feedConfigurationFile = { error: activeFeedHotConfigDNEMessage } ;
                } else {
                    validationMessage.feedConfigurationFile = 
                        { info: activeFeedHotConfigFileName + ' was found on the server.' } ;
                }

                if (validationMessage) {
                    callback(validationMessage) ;
                }
            });
        } else {
            try {
                fs.accessSync(activeFeedHotConfigPath, fs.F_OK);
            } catch (fileDoesNotExistsError) {
                 validationMessage.feedConfigurationFile = { error: activeFeedHotConfigDNEMessage };
            } finally {
                return validationMessage;
            }
        }
    } else {
        validationMessage.activeFeed = { error: 'The activeFeed for the server must be specified.' };
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
    validator(hotConfig) ;
}

function build (hotConfig) {
    return _.cloneDeep(hotConfig);
}

module.exports = {
    validateHotConfig     : validateHotConfig ,
    validateHotConfigSync : validateHotConfigSync ,
    build           : build ,
} ;


