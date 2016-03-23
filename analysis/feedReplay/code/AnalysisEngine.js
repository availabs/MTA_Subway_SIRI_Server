'use strict' ;


var path = require('path') ,
    ConverterService = require(path.join(__dirname, '/MockConverterService')) ,
    //listener = require(path.join(__dirname, '/LocationTrackingAnalysis')) ;
    listener = require(path.join(__dirname, '/DumpBothGTFSrtAndSiri')) ;



process.on('uncaughtException', (err) => {
  console.log(`Caught exception: ${err}`);
});


ConverterService.registerListener(listener) ;

ConverterService.start() ;


