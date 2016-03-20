'use strict';



var process = require('process') ,
    path = require('path') ,

    validUrl = require('valid-url') ,
    _        = require('lodash') ,

    utils = require('./Utils') ,

    projectRoot = path.join(__dirname, '../../') ,
    configServicePath = path.join(projectRoot, 'src/services/ConfigsService') ,

    dataDirPath = path.join(projectRoot, '/data/GTFS/'),
    workDirPath  = path.join(projectRoot, '/data/GTFS/tmp') ,

    feedDataZipFileName = 'gtfs.zip',
    feedDataZipFilePath = path.join(workDirPath, feedDataZipFileName) ;



function validateHotConfigSync (hotConfig) {

    var validationMessage = {};

    if (!hotConfig) { 
        validationMessage.configuration = { error : 'No configuration provided for GTFS.' };
        return validationMessage;
    }

    if (!hotConfig.feedURL) {
        validationMessage.feedURL = { error: 'No feedURL provided in the GTFS configuration.' } ;
    } else if (!(validUrl.isHttpUri(hotConfig.feedURL) || validUrl.isHttpsUri(hotConfig.feedURL))) { 
        validationMessage.feedURL = { error: 'An invalid feedURL was supplied for GTFS configuration' } ;
    } else {
        validationMessage.feedURL = { info: 'GTFS feedURL is a valid URL.' } ;
    }

    if (hotConfig.tripKeyMutator) {
        if (!utils.mutatorIsValid(hotConfig.tripKeyMutator)) {
            validationMessage.tripKeyMutator = { error: 'The tripKeyMutator must be an array of two strings.' };
        } else {
            validationMessage.tripKeyMutator = { info: 'GTFS tripKeyMutator appears valid.' } ;
        }
    }

    return validationMessage;
}



function validateHotConfig (hotConfig, callback) {
    process.nextTick(function () { callback(validateHotConfigSync(hotConfig)); });
}


function updateLogging (config, loggingConfig) {
    return _.merge(_.deepCopy(config), 
                   _.deepCopy(_.pluck(loggingConfig, ['logIndexingStatistics', 'indexingStatisticsLogPath'])));
}


function build (hotConfig, loggingConfig) {

    return {
        gtfsConfigFilePath: configServicePath ,

        tripKeyMutator: _.cloneDeep(hotConfig && hotConfig.tripKeyMutator) ,
        feedURL:        _.cloneDeep(hotConfig && hotConfig.feedURL) ,
        indexStopTimes: !!(hotConfig && hotConfig.indexStopTimes) ,

        dataDirPath: dataDirPath ,
        workDirPath: workDirPath ,

        feedDataZipFileName: feedDataZipFileName ,
        feedDataZipFilePath: feedDataZipFilePath ,

        logIndexingStatistics:     !!loggingConfig.logIndexingStatistics ,
        indexingStatisticsLogPath: loggingConfig.indexingStatisticsLogPath,

        indexedScheduleDataFilePath: path.resolve(dataDirPath, 'indexedScheduleData.json'),

        indexedSpatialDataFilePath:  path.resolve(dataDirPath, 'indexedSpatialData.json'),
    } ;
}

module.exports = {
    validateHotConfig     : validateHotConfig ,
    validateHotConfigSync : validateHotConfigSync ,
    updateLogging         : updateLogging ,
    build                 : build ,
} ;

