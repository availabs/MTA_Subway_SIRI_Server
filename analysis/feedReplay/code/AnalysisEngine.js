'use strict' ;


var path = require('path') ,
    mkdirp = require('mkdirp');

mkdirp.sync(path.join(__dirname, '../logs'))
mkdirp.sync(path.join(__dirname, '../analysis_out'))

var ConverterService = require(path.join(__dirname, '/MockConverterService')) ,
    locationTrackingListener = require(path.join(__dirname, '/LocationTrackingAnalysis')) ,
    etaReliabiltyListener = require(path.join(__dirname, './ExpectedArrivalTimeReliabiltyAnalysis')) ;




process.on('uncaughtException', (err) => {
  console.log(err.stack || stack);
});


ConverterService.registerListener(locationTrackingListener) ;
ConverterService.registerListener(etaReliabiltyListener) ;

ConverterService.start() ;

