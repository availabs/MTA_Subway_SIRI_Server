'use strict';

var request = require('request') ,
    MongoClient = require('mongodb').MongoClient;


var dotPlaceholder = '\u0466';


// Connect to the db
MongoClient.connect("mongodb://localhost:27017/siriServer", function(err, db) {
    if(err) { return; }

    var gtfsrtCollection = db.collection('gtfsrt') ,
        trainTrackerCollection = db.collection('trainTracker');

    console.log("We are connected to Mongo.");

    var lastTimestamp = null;

    setInterval(function () {
        request('http://localhost:16181/admin/get/server/state', function (error, response, body) {
            if (error || response.statusCode !== 200) { return; }

            var serverState = JSON.parse(body) ,
                timestamp   = serverState.gtfsrtTimestamp,
                gtfsrtDoc = { _id: timestamp, state: cleanKeys(serverState.GTFSrt_JSON) },
                trainTrackerDoc = { _id: timestamp, state: cleanKeys(serverState.trainTrackerState) };

            if (timestamp <= lastTimestamp) { return; }
            lastTimestamp = timestamp;

            gtfsrtCollection.insert(gtfsrtDoc, { checkKeys: false }, function (err) {
                if (err) {
                    console.log(err);
                    return;
                } else {
                    trainTrackerCollection.insert(trainTrackerDoc, { checkKeys: false }, function (err) {
                        if (err) {
                            console.log(err);
                            return;
                        } 
                        console.log(timestamp);
                    });
                }
            });
        });
    }, 1000);


});


function cleanKeys (obj) {

    var keys = ((obj !== null) && (typeof obj === 'object')) ? Object.keys(obj) : null ;

    if (keys) {
        return keys.reduce(function (acc, key) {
            acc[key.replace(/\./g, dotPlaceholder)] = cleanKeys(obj[key]);
            return acc;
        }, Array.isArray(obj) ? [] : {});
    } else {
        return obj;
    }
}
