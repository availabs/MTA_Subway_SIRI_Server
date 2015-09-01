'use strict';

var key           = require('./keys/GTFS-Realtime_API_Key'),

    url           = "http://datamine.mta.info/mta_esi.php?key=" + key,

    protofilePath = __dirname + '/' + '../proto_files/nyct-subway.proto';


module.exports = {
    feedUrl       : url           ,
    readInterval  : 30 /*sec*/    ,
    protofilePath : protofilePath ,
};
