'use strict';



var process = require('process') ,

    merge = require('merge') ,

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

    var errorMessage = '' ,
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
            if (!utils.mutatorIsValid(hotConfig.fieldMutator[supported[i]])) {
                errorMessage += ((errorMessage)?'\n':'') + 'The ' + fieldMutatorsKeys[i] + 
                                'fieldMutator must be an array of two strings. See the configuration documentation.';
            }
        }

        if (unsupported.length) {
            errorMessage += 'The following converter fieldMutator keys are not supported: \n\t' +
                            unsupported.join(', ') + '.';
        }
    }

    if (errorMessage) {
        throw new Error(errorMessage);
    }

    return true;
}



function validateHotConfig (hotConfig, callback) {
    process.nextTick(function () {
        try {
            validateHotConfigSync(hotConfig);
            callback(null);

        } catch (err) {
            callback(err);
        } 
    }) ;
}



function updateLogging (config, loggingConfig) {
    return merge(config, _.pick(loggingConfig, relevantLoggingConfigFields));
}


function build (hotConfig, loggingConfig, gtfsConfig, gtfsrtConfig) {
    return merge(true, 
                 staticConfig, 
                 hotConfig, 
                 _.pick(loggingConfig, relevantLoggingConfigFields),
                 { gtfsConfig: gtfsConfig, gtfsrtConfig: gtfsrtConfig });
}



module.exports = {
    validateHotConfig     : validateHotConfig ,
    validateHotConfigSync : validateHotConfigSync ,
    updateLogging         : updateLogging ,
    build           : build ,
} ;
