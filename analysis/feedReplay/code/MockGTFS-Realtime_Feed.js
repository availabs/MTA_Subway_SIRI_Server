/*
 * This module is a mock of the GTFS-Realtime_Toolkit's FeedReader.
 * Rather than pull GTFS-realtime messages from a transit agency's server,
 * it pulls from the MongoDB archive of GTFS-Realtime messages.
 */


'use strict';


var MongoClient = require('mongodb').MongoClient ,
    mongoURL = "mongodb://localhost:27017/siriServer" ,
    db ,
    mongoQueryObj ,  // For both trainTracker and gtfsrt collections.
    gtfsrtCursor ;


var dotPlaceholderRegExp = new RegExp('\u0466', 'g');

var listener ,
    requestedTrainID ;


function MockFeedReader (_requestedTrain, startTimestamp, endTimestamp) {
    if (startTimestamp && isNaN(startTimestamp)) {
        throw Error('Timestamp must be a UNIX startTimestamp.');
    }

    if (endTimestamp && isNaN(endTimestamp)) {
        throw Error('Timestamp must be a UNIX endTimestamp.');
    }

    requestedTrainID = _requestedTrain ;

    if (startTimestamp && endTimestamp) {
        mongoQueryObj = { $and : [{ _id: { $gte : startTimestamp } }, { _id: { $lte: endTimestamp } } ] } ; 
    } else if (startTimestamp) {
        mongoQueryObj = { _id: { $gte : startTimestamp } } ;
    } else if (endTimestamp) {
        mongoQueryObj = { _id: { $lte : endTimestamp } } ;
    }
}


MockFeedReader.prototype.getTrainTrackerInitialState = function (callback) {
    var trainTrackerCollection = db.collection('trainTracker') ;

    trainTrackerCollection.findOne(mongoQueryObj, { sort: { _id: 1 } }, function (err, doc) { 
        if (err) {
          console.error(err.stack || err)
          return callback(err);
        }

        return callback(null, restoreKeys(doc.state));
    });
} ;


MockFeedReader.prototype.start = function (callback) {
    MongoClient.connect(mongoURL, function(err, _db) {
        if(err) { return callback(err); }

        db = _db;

        gtfsrtCursor = db.collection('gtfsrt').find(mongoQueryObj, { sort: { _id: 1 } }) ;

        return callback();
    });
} ;


MockFeedReader.prototype.registerListener = function (_listener) {
    if (typeof _listener !== 'function') {
        throw new Error("Listeners must be functions.");
    }

    listener = _listener;
} ;


MockFeedReader.prototype.sendNext = function () {
    
    var _this = this;


    gtfsrtCursor.nextObject(function (err, item) {
        if (err) { 
            throw err;
        }

        if (item === null) { 
            gtfsrtCursor.close(function (err) {
                if (err) {
                    console.error(err);
                }

                db.close();
            });
            return null; 
        }

        var state = restoreKeys(item.state);

        // If no specific train was requested, send the listener the data.
        if (!requestedTrainID || !state) { return listener(state); }
        
        // A specific train was requested.
        // We need to pluck the parts of the message regarding the requested train.
        var focusedMessage = { header: state.header } ;

        state.entity.reduce(function (acc, entity) {
            var trip_id = 
                (entity && entity.trip_update && entity.trip_update.trip && entity.trip_update.trip.trip_id) ||
                (entity && entity.vehicle     && entity.vehicle.trip     && entity.vehicle.trip.trip_id) ;

            if (trip_id === requestedTrainID) {
                acc.push(entity);
            }

            return acc;

        }, focusedMessage.entity = []);

        if (focusedMessage.entity.length) {
            return listener(focusedMessage);
        } else {
            _this.sendNext();
        }
    });
};



function restoreKeys (obj) {

    var keys = ((obj !== null) && (typeof obj === 'object')) ? Object.keys(obj) : null ;

    if (keys) {
        return keys.reduce(function (acc, key) {
            var restoredKey = (dotPlaceholderRegExp.test(key)) ? key.replace(dotPlaceholderRegExp, '.') : key;
            acc[restoredKey] = restoreKeys(obj[key]);
            return acc;
        }, Array.isArray(obj) ? [] : {});
    } else {
        return obj;
    }
}


module.exports = MockFeedReader;
