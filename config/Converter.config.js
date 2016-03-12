'use strict';

var fs    = require('fs'),
    path    = require('path') ,
    merge = require('merge'), 

    hotConfigPath = path.join(__dirname, './Converter.hot.config.json'),
    hotConfig     = JSON.parse(fs.readFileSync(hotConfigPath)) ,

    //TODO: After admin console supports these, move them to the hot config.
    fieldMutators = {
        OriginRef         : [/./, "MTA_$&"],
        DestinationRef    : [/./, "MTA_$&"],
        StopPointRef      : [/./, "MTA_$&"],
    } ;



var staticConfig = {

    fieldMutators              : fieldMutators                                ,

    unscheduledTripIndicator   : '\u262f' ,
};

    

module.exports = merge(staticConfig, hotConfig);
