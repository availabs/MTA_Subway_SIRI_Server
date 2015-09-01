'use strict';

var express = require('express'),
    router  = express.Router();


router.get('/', function(req, res) {
    res.json({ 'msg' : "You've hit the SIRI VehicleMonitoring controller.", });
});


module.exports = router;
