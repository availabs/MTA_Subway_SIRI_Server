'use strict';



var process = require('process') ,

    _ = require('lodash') ,

    utils = require('./Utils') ,

    staticConfig = {
        unscheduledTripIndicator   : '\u262f' ,
    },

    supportedConfigKeys = [ 'fieldMutators', 'callDistanceAlongRouteNumOfDigits' ] ,

    supportedFieldMutatorKeys = [ 'DestinationRef', 'OriginRef', 'StopPointRef' ] ,

    relevantLoggingConfigFields = [
        "logDataAnomalies",
        "logErrors",
        "logTrainLocations",
        "logTrainTrackingStats",
        "logUnscheduledTrips",
        "logNoSpatialDataTrips",
        "logTrainTrackingErrors",
        'dataAnomaliesLogPath',
        'errorsLogPath',
        'trainLocationsLogPath',
        'trainTrackingStatsLogPath',
        'unscheduledTripsLogPath',
        'noSpatialDataTripsLogPath',
        'trainTrackingErrorsLogPath',
    ];

    

function validateHotConfigSync (hotConfig) {

    var hotConfigKeys,
        validationMessage = { __isValid: true } ,
        fieldMutatorsKeys ,
        supportedKeys , 
        unsupportedKeys ,
        i ;

    if (!hotConfig) { 
        validationMessage.configuration = {
            error:'No configuration provided for the Converter service.'
        };
        validationMessage.__isValid = false;
        return validationMessage ;
    } else if (Object.prototype.toString.call(hotConfig) !== '[object Object]') {
        validationMessage.configuration = {
            error:'The configuration provided for the Converter service is not an Object.' ,
        };
        validationMessage.__isValid = false;
        return validationMessage ;
    }


    hotConfigKeys = Object.keys(hotConfig) ;
    unsupportedKeys = _.difference(hotConfigKeys, supportedConfigKeys) ;

    if (unsupportedKeys.length) {
        validationMessage.unsupportedConfigurationFields = {
            warning: 'The following configuration fields are not supportedKeys: ' + unsupportedKeys.join(', ') + '.', 
        } ;
    }

    if (hotConfig.fieldMutators && (typeof hotConfig.fieldMutators === 'object')) {

        fieldMutatorsKeys = Object.keys(hotConfig.fieldMutators) ;

        supportedKeys   = _.intersection(fieldMutatorsKeys, supportedFieldMutatorKeys) ;
        unsupportedKeys = _.difference(fieldMutatorsKeys, supportedFieldMutatorKeys) ;

        for ( i = 0; i < supportedKeys.length; ++i) {
            if (!utils.mutatorIsValid(hotConfig.fieldMutators[supportedKeys[i]])) {
                validationMessage['fieldMutators_' + supportedKeys[i]] = { 
                    error: 'The ' + fieldMutatorsKeys[i] + ' fieldMutator must be an array of two strings.' ,
                };
                validationMessage.__isValid = false;
            } else {
                validationMessage['fieldMutators_' + supportedKeys[i]] = { 
                    info: 'The ' + fieldMutatorsKeys[i] + ' fieldMutator is valid.' ,
                };
            }
        }

        if (unsupportedKeys.length) {
            validationMessage.unsupportedFieldMutators = {
                warning: 'The following converter fieldMutator keys are not supportedKeys: \n\t' +
                            unsupportedKeys.join(', ') + '.',
            };
        }
    }

    if ((hotConfig.significantDigits !== null) && (hotConfig.significantDigits !== undefined)) {
        if (isNaN(parseInt(hotConfig.callDistanceAlongRouteNumOfDigits))) {
            validationMessage.significantDigits = { error: 'significantDigits must be an integer.', };
        } else {
            validationMessage.significantDigits = { info: 'The significantDigits parameter is valid.', };
        }
    }

    return validationMessage;
}



function validateHotConfig (hotConfig, callback) {
    process.nextTick(function () { callback(validateHotConfigSync(hotConfig)); }) ;
}



function updateLogging (config, loggingConfig) {
    return _.merge(config, _.pick(loggingConfig, relevantLoggingConfigFields));
}


function build (hotConfig, gtfsConfig, gtfsrtConfig, loggingConfig) {

    var newConfig =  _.merge( _.cloneDeep(staticConfig) ,
                              hotConfig ,
                              gtfsConfig, 
                              gtfsrtConfig ,
                              _.pick(loggingConfig, relevantLoggingConfigFields));

    // The first elem of the fields mutators array must be a RegExp.
    if (newConfig && newConfig.fieldMutators) {
        _.forEach(newConfig.fieldMutators, function (pair) {
            if (Array.isArray(pair) && (pair.length) && (typeof pair[0] === 'string')) {
                pair[0] = new RegExp(pair[0]);
            }
        });
    }

    return newConfig;
}



module.exports = {
    validateHotConfig     : validateHotConfig ,
    validateHotConfigSync : validateHotConfigSync ,
    updateLogging         : updateLogging ,
    build                 : build ,
} ;
