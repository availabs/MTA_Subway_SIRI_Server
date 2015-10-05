(function () {
    'use strict';

    /* globals $ */


    var gtfsConfig,
        gtfsrtConfig,
        converterConfig;

    var activeConfigDiv = '#GTFS';

    $("#GTFS_selector").addClass('active');
    $("#GTFS-Realtime_config_div").hide();
    $("#Converter_config_div").hide();

    function notify(message) {
        $('#GTFS-Realtime_config_div').prepend('<div class="alert alert-success"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' + message + '</div>');
    }

    function switchActiveConfigDiv (newActiveDivSelector) {
        $(activeConfigDiv + '_config_div').hide();
        $(newActiveDivSelector + '_config_div').show();

        $(activeConfigDiv + '_selector').removeClass('active');
        $(newActiveDivSelector + '_selector').addClass('active');

        activeConfigDiv = newActiveDivSelector;
    }

    $("#GTFS_selector").bind('click', switchActiveConfigDiv.bind(null, '#GTFS'));
    $("#GTFS-Realtime_selector").bind('click', switchActiveConfigDiv.bind(null, '#GTFS-Realtime'));
    $("#Converter_selector").bind('click', switchActiveConfigDiv.bind(null, '#Converter'));


    function setGTFSConfigFormPlaceholders () {
        $('#GTFS_URL').prop('defaultValue', gtfsConfig.latestDataURL);
    }

    function setGTFSRealtimeConfigFormPlaceholders () {
        $('#GTFS-Realtime_URL').prop('defaultValue', gtfsrtConfig.baseURL);
        $('#GTFS-Realtime_API_Key').prop('defaultValue', gtfsrtConfig.apiKey);
        $('#GTFS-Realtime_Read_Interval').prop('defaultValue', gtfsrtConfig.readInterval);
        $('#GTFS-Realtime_Retry_Interval').prop('defaultValue', gtfsrtConfig.retryInterval);
        $('#GTFS-Realtime_Max_Num_Retries').prop('defaultValue', gtfsrtConfig.maxRetries);
    }

    function setConverterConfigFormPlaceholders () {
        console.log(converterConfig);

        $("#converterLogTrainLocations").prop('checked', false);
        $('#converterLogTrainLocations').prop('checked', converterConfig.logTrainLocations);
        $('#converterLogTrainTrackingErrors').prop('checked', converterConfig.logTrainTrackingErrors);
        $('#converterLogNoSpatialDataTrips').prop('checked', converterConfig.logNoSpatialDataTrips);
        $('#converterLogUnscheduledTrips').prop('checked', converterConfig.logUnscheduledTrips);
        $('#converterLogTrainTrackingStats').prop('checked', converterConfig.logTrainTrackingStats);
    }


    function sendUpdateGTFSConfigPostRequest () {
        var config = {
            "latestDataURL" : $("#GTFS_URL").val()
        };

        $.ajax({
            type: "POST",
            url: '/admin/update/GTFS/config',
            data: config,
            success: function (response) {
                gtfsConfig = config;
                console.log(response);
                notify(response);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log(textStatus);
                console.log(errorThrown);
            },
        });
    }
    $('#update_GTFS_config_btn').bind('click', sendUpdateGTFSConfigPostRequest);


    function sendUpdateGTFSRealtimeConfigPostRequest () {
        var config = {
            "baseURL"       : $("#GTFS-Realtime_URL").val() ,
            "apiKey"        : $("#GTFS-Realtime_API_Key").val() ,
            "readInterval"  : $("#GTFS-Realtime_Read_Interval").val() ,
            "retryInterval" : $("#GTFS-Realtime_Retry_Interval").val() ,
            "maxRetries"    : $("#GTFS-Realtime_Max_Num_Retries").val() ,
        };

        $.ajax({
            type: "POST",
            url: '/admin/update/GTFS-Realtime/config',
            data: config,
            success: function (response) {
                gtfsrtConfig = config;
                console.log(response);
                notify(response);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log(textStatus);
                console.log(errorThrown);
            },
        });
    }
    $('#update_GTFS-Realtime_config_btn').bind('click', sendUpdateGTFSRealtimeConfigPostRequest);


    function sendUpdateConverterConfigPostRequest () {
        var config = {
            logTrainLocations      : $("#converterLogTrainLocations").is(':checked'),
            logTrainTrackingErrors : $("#converterLogTrainTrackingErrors").is(':checked'),
            logTrainTrackingStats  : $("#converterLogTrainTrackingStats").is(':checked'),
            logUnscheduledTrips    : $("#converterLogUnscheduledTrips").is(':checked'),
            logNoSpatialDataTrips  : $("#converterLogNoSpatialDataTrips").is(':checked'),
        };

        console.log(config);

        $.ajax({
            type: "POST",
            url: '/admin/update/GTFS-Realtime_to_SIRI_Converter/config',
            data: config,
            success: function (response) {
                converterConfig = config;
                console.log(response);
                notify(response);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log(textStatus);
                console.log(errorThrown);
            },
        });
    }
    $('#update_Converter_config_btn').bind('click', sendUpdateConverterConfigPostRequest);


    function sendUpdateGTFSDataPostRequest () {
         $.ajax({
            type: "POST",
            url: '/admin/update/GTFS/data',
            success: function (response) {
                console.log(response);
                notify(response);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log(textStatus);
                console.log(errorThrown);
            },
        });
       
    }
    $('#update_GTFS_data_btn').bind('click', sendUpdateGTFSDataPostRequest);

     $.ajax({
         url: '/admin/get/GTFS/config',
         success: function(data) {
            gtfsConfig = data;
            setGTFSConfigFormPlaceholders();
         }
     });
     $.ajax({
         url: '/admin/get/GTFS-Realtime/config',
         success: function(data) {
            gtfsrtConfig = data;
            setGTFSRealtimeConfigFormPlaceholders();
         }
     });
     $.ajax({
         url: '/admin/get/GTFS-Realtime_to_SIRI_Converter/config',
         dataType : 'json',
         success: function(data) {
             console.log('*****************');
             console.log(data);
            converterConfig = data;
            setConverterConfigFormPlaceholders();
         }
     });



}());
