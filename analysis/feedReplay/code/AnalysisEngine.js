'use strict' ;


var path = require('path') ,
    ConverterService = require(path.join(__dirname, '/MockConverterService')) ,
    locationTrackingAnalyzer = require(path.join(__dirname, '/LocationTrackingAnalysis')) ;


ConverterService.registerListener(locationTrackingAnalyzer) ;

ConverterService.start() ;
