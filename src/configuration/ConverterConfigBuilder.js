'use strict';



var process = require('process') ,

    _ = require('lodash') ,

    utils = require('./Utils') ,

    staticConfig = {
        unscheduledTripIndicator   : '\u262f' ,
    },

    supportedFieldMutators = [ 'DestinationRef', 'OriginRef', 'StopPointRef' ].sort() ,

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

    var validationMessage = {} ,
        fieldMutatorsKeys ,
        supported , 
        unsupported ,
        i ;

    if (!hotConfig) { 
        throw new Error('No configuration provided for the converter.');
    }

    if (hotConfig.fieldMutators && (typeof hotConfig.fieldMutators === 'object')) {
        fieldMutatorsKeys = Object.keys(hotConfig.fieldMutators).sort() ;
        supported = _.intersection(fieldMutatorsKeys, supportedFieldMutators) ;
        unsupported = _.difference(fieldMutatorsKeys, supportedFieldMutators) ;

        for ( i = 0; i < supported.length; ++i) {
            if (!utils.mutatorIsValid(hotConfig.fieldMutators[supported[i]])) {
                validationMessage['fieldMutators_' + supported[i]] = { 
                    error: 'The ' + fieldMutatorsKeys[i] + ' fieldMutator must be an array of two strings.' ,
                };
            } else {
                validationMessage['fieldMutators_' + supported[i]] = { 
                    info: 'The ' + fieldMutatorsKeys[i] + ' fieldMutator is valid.' ,
                };
            }
        }

        if (unsupported.length) {
            validationMessage.unsupportedFieldMutators = {
                error: 'The following converter fieldMutator keys are not supported: \n\t' +
                            unsupported.join(', ') + '.',
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
    return _.merge(_.cloneDeep(config), _.cloneDeep(_.pick(loggingConfig, relevantLoggingConfigFields)));
}


function build (hotConfig, gtfsConfig, gtfsrtConfig, loggingConfig) {

    var newConfig =  _.merge( _.cloneDeep(staticConfig) ,
                     _.cloneDeep(hotConfig) ,
                     _.cloneDeep({ gtfsConfig: gtfsConfig, gtfsrtConfig: gtfsrtConfig }),
                     _.cloneDeep(_.pick(loggingConfig, relevantLoggingConfigFields)) );


    if (newConfig && newConfig.fieldMutators) {
        _.forEach(newConfig.fieldMutators, function (pair) {
            if (Array.isArray(pair) && (pair.length)) {
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
