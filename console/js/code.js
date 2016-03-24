(function () {
    'use strict';

    /* globals $ */

    var gtfsConfig ,
        gtfsrtConfig ,
        loggingConfig ;

    var activeConfigDiv = '#ServerStatus';

    $("#ServerStatus_selector").addClass('active');
    $("#FeedConfig_div").hide();
    $("#LoggingConfig_div").hide();



    (function () {
        var descriptionDivs = [
                "GTFS_feedURL_div",
                "GTFS_zipfile_div",
                "GTFS_update_GTFS_config_btn_div",
                "GTFS_update_GTFS_data_btn_div",

                "GTFS-Realtime_feedURL_div",
                "GTFS-Realtime_readInterval_div",
                "GTFS-Realtime_retryInterval_div",
                "GTFS-Realtime_maxNumRetries_div",
                "GTFS-Realtime_protofile_div",

                "Logging_logIndexingStatistics_div",
                "Logging_logErrors_div",
                "Logging_logTrainLocations_div",
                "Logging_logTrainTrackingStats_div",
                "Logging_logUnscheduledTrips_div",
                "Logging_logNoSpatialDataTrips_div",
                "Logging_logTrainTrackingErrors_div",
                "Logging_daysToKeepLogsBeforeDeleting_div",
            ] ,
            
            i ; 


        function fadeIn  (divID) { 
            $('#' + divID).show() ; 
        }
        function fadeOut (divID) { 
            $('#' + divID).hide(); 
        }

        for ( i = 0; i < descriptionDivs.length; ++i) {
            var id = descriptionDivs[i];
            $('#' + id).hover(
                fadeIn.bind(null, id.replace('div', 'description')) ,
                fadeOut.bind(null, id.replace('div', 'description')) 
            ); 
        }
    }());
    

    function notify(pane, message, alertLevel) {
        alertLevel = alertLevel || 'info';

        $('#' + pane + '_notifications_div').prepend(
                '<div class="alert alert-' + alertLevel + '">' +
                    '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' + 
                    message + 
                '</div>');
    }

    function switchActiveConfigDiv (newActiveDivSelector) {

        $(activeConfigDiv + '_selector').removeClass('active');
        $(newActiveDivSelector + '_selector').addClass('active');

        $(activeConfigDiv + '_div').hide();
        $(activeConfigDiv + '_div').hide();
        $(newActiveDivSelector + '_div').show();

        activeConfigDiv = newActiveDivSelector;
    }

    $("#ServerStatus_selector").bind('click', switchActiveConfigDiv.bind(null, '#ServerStatus'));
    $("#FeedConfig_selector").bind('click', switchActiveConfigDiv.bind(null, '#FeedConfig'));
    $("#LoggingConfig_selector").bind('click', switchActiveConfigDiv.bind(null, '#LoggingConfig'));




    function setGTFSFormPlaceholders () {
        var keys = Object.keys(gtfsConfig) ,
            i ;

        for ( i = 0; i < keys.length; ++i ) {
            $('#GTFS_' + keys[i] + '_input').prop('defaultValue', gtfsConfig[keys[i]]);
        }
    }

    function setGTFSrtFormPlaceholders () {
        var keys = Object.keys(gtfsrtConfig) ,
            i ;

        for ( i = 0; i < keys.length; ++i ) {
            $('#GTFS-Realtime_' + keys[i] + '_input').prop('defaultValue', gtfsrtConfig[keys[i]]);
        }
    }

    function setLoggingFormPlaceholders () {
        var keys = Object.keys(loggingConfig) ,
            switchPattern = /^log/,
            i ;

        for ( i = 0; i < keys.length; ++i ) {
            if (keys[i].match(switchPattern)) {
                $('#Logging_' + keys[i] + '_input').bootstrapToggle(loggingConfig[keys[i]] ? 'on' : 'off');
            } else {
                console.log('========', keys[i], ':', loggingConfig[keys[i]]);
                $('#Logging_' + keys[i] + '_input').prop('defaultValue', loggingConfig[keys[i]]);
            }
        }
    }


    function sendGTFSUpdatePost(url) {
        /*jshint validthis: true */
        $("#GTFS_form").ajaxSubmit({
            type    : "POST",
            url     : url,
            error   : function(xhr)      { notify('GTFS', xhr.responseText, 'danger'); },
            success : function(response) { notify('GTFS', response, 'success'); }
        });
    }

    function removeGTFSDataFile () {
        $("#GTFS_data_file").replaceWith($("#GTFS_data_file").clone(true));
        $('#remove_GTFS_data_file_btn').remove();
        $('#update_GTFS_config_btn').removeClass('disabled');
    }

    function appendRemoveGTFSDataFileButton () {
        $('#GTFS_form_btn_row').append(
                '<button id="remove_GTFS_data_file_btn" class="btn btn-primary btn-sm">' +
                'Remove GTFS Data File' +
                '</button>'
        );
        $('#remove_GTFS_data_file_btn').on('click', removeGTFSDataFile);
    }
    
    $('#GTFS_data_file').change(function () {
        var fileName  = $("#GTFS_data_file").val(),
            extension = fileName.substr((~-fileName.lastIndexOf(".") >>> 0) + 2);

        if (extension !== 'zip') {
            $('#GTFS_form').append(
                '<div class="alert alert-danger">' +
                    '<a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>' + 
                    "GTFS feed data file uploads must be in a .zip archive." + 
                '</div>');
           
            // Remove the file from the form if it is not a .zip archive.
            removeGTFSDataFile();
        } else {
            appendRemoveGTFSDataFileButton();
            $('#update_GTFS_config_btn').addClass('disabled');
        }
    });


    $('#update_GTFS_config_btn').bind('click', function () {
        console.log("===> submit GTFS config form");

        sendGTFSUpdatePost('/admin/update/GTFS/config');
        return false;
    });

    $('#update_GTFS_data_btn').bind('click', function () {
        sendGTFSUpdatePost('/admin/update/GTFS/data');
        return false;
    });


    $('#GTFS-RealtimeConfig_form').submit(function () {
        $(this).ajaxSubmit({
            type    : "POST",
            url     : '/admin/update/GTFS-Realtime/config',
            error   : function(xhr) { notify('GTFS-Realtime', xhr.responseText, 'danger'); },
            success : function(response) { notify('GTFS-Realtime', response, 'success'); }
        });

        return false;
    });


    $('#LoggingConfig_form').submit(function () {
        $(this).ajaxSubmit({
            type    : "POST",
            url     : '/admin/update/Logging/config',
            error   : function(xhr) { notify('Logging', xhr.responseText, 'danger'); },
            success : function(response) { notify('Logging', response, 'success'); }
        });

        return false;
    });


     $.ajax({
         url: '/admin/get/GTFS/config',
         dataType : 'json',
         success: function(data) {
            gtfsConfig = data;
            setGTFSFormPlaceholders();
         }
     });
     $.ajax({
         url: '/admin/get/GTFS-Realtime/config',
         dataType : 'json',
         success: function(data) {
            gtfsrtConfig = data;
            setGTFSrtFormPlaceholders();
         }
     });
     $.ajax({
         url: '/admin/get/Logging/config',
         dataType : 'json',
         success: function(data) {
            loggingConfig = data;
            setLoggingFormPlaceholders();
         }
     });

}());
