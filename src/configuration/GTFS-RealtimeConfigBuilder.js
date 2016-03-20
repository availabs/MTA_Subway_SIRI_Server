'use strict';

var fs    = require('fs') ,
    path  = require('path') ,
    merge = require('merge') ,
    _     = require('lodash') ,

    validUrl = require('valid-url') ,

    projectRoot = path.join(__dirname, '../../') ,
    protofileDirPath = path.join(projectRoot, '/proto_files/'),
    defaultProtofileName = 'gtfs-realtime.proto' ,

    staticConfig = {
        protofileDirPath: protofileDirPath ,
        protofilePath:    path.join(protofileDirPath, defaultProtofileName) ,
    },

    supportedConfigParams = [
        "feedURL",
        "readInterval",
        "retryInterval",
        "maxNumRetries",
        "protofileName",
        "useLastStoptimeUpdateAsDestination" ,
    ] ,

    requiredNumericFields = [
        "readInterval",
        "retryInterval",
        "maxNumRetries",
    ] ;



function validateRequiredNumericFields (hotConfig, fieldName, validationMessage) {
    if (!hotConfig[fieldName]) {
        validationMessage.fieldName = { error: (fieldName + ' is required in the GTFS-Realtime configuration.') };
    } else if (isNaN(parseInt(hotConfig[fieldName]))) { 
        validationMessage.fieldName = { error: ('GTFS-Realtime ' + fieldName + ' must be a numeric value.') };
    }
}

function validator (hotConfig, callback) {

    var validationMessage = {},
        hotConfigKeys,
        unsupportedKeys,
        protofileName ,
        protofilePath ,
        protofileErrorMessage ,
        i;

    callback = (typeof callback === 'function') ? callback : null;


    if (!hotConfig) { 
        validationMessage.configuration = { error: 'No configuration provided for the GTFS-Realtime component.' };
    } else if (!(Object.prototype.toString.call(hotConfig))) {
        validationMessage.configuration = { error: 'The logging config should be a simple Object.' };
    }


    if (validationMessage) {
        if (callback) {
            return callback(validationMessage);
        } else {
            return validationMessage;
        }
    }

    
    if (!hotConfig.feedURL) {
        validationMessage = { error: 'A feedURL is required for GTFS-Realtime configuration' } ;
    } else if (!(validUrl.isHttpUri(hotConfig.feedURL) || validUrl.isHttpsUri(hotConfig.feedURL))) { 
        validationMessage = { error: 'An invalid feedURL was supplied for GTFS-Realtime configuration' } ;
    } else {
        validationMessage = { info: 'The feedURL supplied for GTFS-Realtime configuration looks valid.' } ;
    }

    for ( i = 0; i < requiredNumericFields.length; ++i ) {
        validateRequiredNumericFields(hotConfig, requiredNumericFields[i], validationMessage) ;
    }
        
    hotConfigKeys = Object.keys(hotConfig) ;
    unsupportedKeys = _.difference(hotConfigKeys, supportedConfigParams);

    if (unsupportedKeys.length) {
        validationMessage.configuration = { warn: 'The following logging options are not supported:\n\t' + 
                                                   unsupportedKeys.join(', ') + '.' };
    }


    if (hotConfig.protofileName) {
        protofileName = (typeof hotConfig.protofileName === 'string') ? hotConfig.protofileName : null ;
    } else {
        protofileName = defaultProtofileName;
    }

    if  (protofileName) {

        protofilePath = path.join(protofileDirPath, protofileName) ;
        protofileErrorMessage = 'The .proto file ' + protofileName + ' does not exist. ' + 
                                'The GTFS-Realtime feed cannor be parsed.';

        if (callback) {
            fs.access(protofilePath, fs.F_OK, function (err) {
                if (err) {
                    validationMessage.protofile = { error: protofileErrorMessage } ;
                } else {
                    validationMessage.protofile = { info: 'The specified .profo file exists.' } ;
                }

                callback(validationMessage) ;
            });
        } else { //Sync
            try {
                fs.accessSync(protofilePath, fs.F_OK);
                validationMessage.protofile = { info: 'The specified .profo file exists.' } ;
            } catch (fileDoesNotExistsError) {
                validationMessage.protofile = { error: protofileErrorMessage } ;
            } finally {
                return validationMessage ;
            }
        }
    } else {
        validationMessage.protofileName = { error: 'An invalid protofileName was specified.' };
    }

        
    if (callback) {
        return process.nextTick(function () { callback(validationMessage); });
    } else {
        return validationMessage;
    }
}



function validateHotConfig (hotConfig, callback) {
    validator(hotConfig, callback) ;
}



function validateHotConfigSync (hotConfig) {
    validator(hotConfig) ;
}



function build (hotConfig) {
    var pfilePath;

    if (hotConfig && hotConfig.protofileName) {
       pfilePath = path.join(protofileDirPath, hotConfig.protofileName);
       return merge(true, staticConfig, hotConfig, { protofilePath: pfilePath });
    }

   return merge(true, staticConfig, hotConfig);
}

module.exports = {
    validateHotConfig     : validateHotConfig ,
    validateHotConfigSync : validateHotConfigSync ,
    build                 : build ,
} ;


