// Shot out: https://scotch.io/tutorials/build-a-restful-api-using-node-and-express-4

'use strict';

var express    = require('express')     ,
    app        = express()              ,
    bodyParser = require('body-parser') ;

var router = express.Router(),
    port   = process.env.PORT || 16180;


// ROUTE HANDLERS
// =============================================================================
var gtfsAdmin        = require('./routes/gtfsAdmin'),

    vehicleMonitoring = require('./routes/vehicleMonitoring'),
    stopMonitoring    = require('./routes/stopMonitoring');



app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// ROUTES 
// =============================================================================

router.get('/', function(req, res) {
    res.json( { 
        routes: { 
            '/gtfs-admin'         : 'Administrative functionality for loading new GTFS data.' ,

            '/vehicle-monitoring' : 'The SIRI VehicleMonitoring ("SIRI VM") call '            +
                                    'allows the developer to request information about '      +
                                    'one, some, or all trains monitored by the '              +
                                    'NYCT Subway System.'                                     ,

            '/stop-monitoring'    : 'The SIRI StopMonitoring ("SIRI SM") call allows the '    +
                                    'developer to request information about the vehicles '    +
                                    'serving a particular stop.'                              ,
        } 
    } );   
});


// more routes for our API will happen here


// REGISTER THE ROUTES -------------------------------
app.use('/', router);
app.use('/gtfs-admin', gtfsAdmin);
app.use('/vehicle-monitoring', vehicleMonitoring);
app.use('/stop-monitoring', stopMonitoring);



// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
