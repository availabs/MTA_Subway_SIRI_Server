'use strict';

var fs    = require('fs') ,
    path  = require('path') ,
    _     = require('lodash') ,

    validUrl = require('valid-url') ,

    utils = require('./Utils') ,

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



function validator (hotConfig, callback) {

    var validationMessage = { __isValid: true },
        keys,
        unsupportedKeys,
        protofileName ,
        protofilePath ,
        protofileErrorMessage ,
        i;


    if (!hotConfig) { 
        validationMessage.configuration = { 
            error: 'No configuration provided for the GTFS-Realtime component.' 
        } ;
        validationMessage.__isValid = false ;
    } else if (Object.prototype.toString.call(hotConfig) !== '[object Object]') {
        validationMessage.configuration = { 
            error: 'The logging config should be a simple Object.' 
        } ;
        validationMessage.__isValid = false ;
    }

    
    if (!validationMessage.__isValid) {
        if (callback) {
            return process.nextTick(function () { callback(validationMessage); });
        } else {
            return validationMessage;
        }
    }


    if (!hotConfig.feedURL) {
        validationMessage.feedURL = { 
            error: 'A feedURL is required for GTFS-Realtime configuration' 
        } ;
        validationMessage.__isValid = false ;
    } else if (!(validUrl.isHttpUri(hotConfig.feedURL) || validUrl.isHttpsUri(hotConfig.feedURL))) { 
        validationMessage.feedURL = { 
            error: 'An invalid feedURL was supplied for GTFS-Realtime configuration' 
        } ;
        validationMessage.__isValid = false ;
    } else {
        validationMessage.feedURL = { 
            info: 'The feedURL supplied for GTFS-Realtime configuration looks valid.' 
        } ;
    }

    for ( i = 0; i < requiredNumericFields.length; ++i ) {
        utils.validateNumericField(hotConfig, requiredNumericFields[i], validationMessage) ;
        if (validationMessage[requiredNumericFields[i]].error) {
            validationMessage.__isValid = false ;
        }
    }
        

    keys = Object.keys(hotConfig) ;
    unsupportedKeys = _.difference(keys, supportedConfigParams);


    if (unsupportedKeys.length) {
        validationMessage.configuration = { 
            warn: 'The following GTFS-Realtime configuration options are not supported:\n\t' + 
                  unsupportedKeys.join(', ') + '.' 
        };
    }


    if (hotConfig.protofileName) {
        protofileName = (typeof hotConfig.protofileName === 'string') ? hotConfig.protofileName : null ;
    } else {
        protofileName = defaultProtofileName;
    }


    if  (protofileName) {

        protofilePath = path.join(protofileDirPath, protofileName) ;
        protofileErrorMessage = 'The .proto file ' + protofileName + ' does not exist. ' + 
                                'The GTFS-Realtime feed cannot be parsed without a .proto file.';

        if (callback) { // Async
            return fs.access(protofilePath, fs.F_OK, function (err) {
                if (err) {
                    validationMessage.protofile = { 
                        error: protofileErrorMessage 
                    } ;
                    validationMessage.__isValid = false ;
                } else {
                    validationMessage.protofile = { 
                        info: 'The specified .profo file exists.' 
                    } ;
                }

                return callback(validationMessage) ;
            });
        } else { //Sync
            try {
                fs.accessSync(protofilePath, fs.F_OK);
                validationMessage.protofile = { 
                    info: 'The specified .profo file exists.' 
                } ;
            } catch (fileDoesNotExistsError) {
                validationMessage.protofile = { 
                    error: protofileErrorMessage 
                } ;
                validationMessage.__isValid = false ;
            } finally {
                return validationMessage ;
            }
        }
    } else {
        validationMessage.protofileName = { 
            error: 'An invalid protofileName was specified.' 
        };
        validationMessage.__isValid = false ;
    }

        
    if (callback) {
        //return process.nextTick(function () { callback(validationMessage); });
        callback(validationMessage);
    } else {
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
    var pfilePath;

    if (hotConfig && hotConfig.protofileName) {
       pfilePath = path.join(protofileDirPath, hotConfig.protofileName);
       return _.merge(_.cloneDeep(staticConfig), _.cloneDeep(hotConfig), { protofilePath: pfilePath });
    } else {
       return _.merge(_.cloneDeep(staticConfig), _.cloneDeep(hotConfig));
    }
}

module.exports = {
    validateHotConfig     : validateHotConfig ,
    validateHotConfigSync : validateHotConfigSync ,
    build                 : build ,
} ;


