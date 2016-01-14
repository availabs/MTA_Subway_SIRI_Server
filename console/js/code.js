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

    (function () {
        var descriptionDivs = [
                "GTFS_feedURL_label",
                "GTFS_zipfile_label",

                "GTFS-Realtime_feedURL_label",
                "GTFS-Realtime_readInterval_label",
                "GTFS-Realtime_retryInterval_label",
                "GTFS-Realtime_maxNumRetries_label",
                "GTFS-Realtime_protofile_label",

                "Converter_converterLoggingLevel_label",
                "Converter_trainLocationsLoggingLevel_label",
                "Converter_trainTrackingErrorsLoggingLevel_label",
                "Converter_trainTrackingStatsLoggingLevel_label",
                "Converter_unscheduledTripsLoggingLevel_label",
                "Converter_noSpatialDataTripsLoggingLevel_label",
            ] ,
            i ;

        function fadeIn  (divID) { $('#' + divID).fadeIn() ; }
        function fadeOut (divID) { $('#' + divID).fadeOut(); }

        for ( i = 0; i < descriptionDivs.length; ++i) {
            $('#' + descriptionDivs[i]).hover(
                fadeIn.bind(null , descriptionDivs[i].replace('label', 'description')),
                fadeOut.bind(null, descriptionDivs[i].replace('label', 'description'))
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
        $('#GTFS_URL').prop('defaultValue', gtfsConfig.feedURL);
    }

    function setGTFSRealtimeConfigFormPlaceholders () {
        $('#GTFS-Realtime_FeedURL').prop('defaultValue', gtfsrtConfig.feedURL);
        $('#GTFS-Realtime_Read_Interval').prop('defaultValue', gtfsrtConfig.readInterval);
        $('#GTFS-Realtime_Retry_Interval').prop('defaultValue', gtfsrtConfig.retryInterval);
        $('#GTFS-Realtime_Max_Num_Retries').prop('defaultValue', gtfsrtConfig.maxNumRetries);
    }

    function setConverterConfigFormPlaceholders () {
        $('#converterConverterLoggingLevel').val(converterConfig.converterLoggingLevel);
        $('#converterTrainLocationsLoggingLevel').val(converterConfig.trainLocationsLoggingLevel);
        $('#converterTrainTrackingErrorsLoggingLevel').val(converterConfig.trainTrackingErrorsLoggingLevel);
        $('#converterTrainTrackingStatsLoggingLevel').val(converterConfig.trainTrackingStatsLoggingLevel);
        $('#converterUnscheduledTripsLoggingLevel').val(converterConfig.unscheduledTripsLoggingLevel);
        $('#converterNoSpatialDataTripsLoggingLevel').val(converterConfig.noSpatialDataTripsLoggingLevel);
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


    $('#GTFS_form').submit(function () {
        sendGTFSUpdatePost('/admin/update/GTFS/config');
        return false;
    });

    $('#update_GTFS_data_btn').bind('click', function () {
        sendGTFSUpdatePost('/admin/update/GTFS/data');
        return false;
    });


    $('#GTFS-Realtime_form').submit(function () {
        $(this).ajaxSubmit({
            type    : "POST",
            url     : '/admin/update/GTFS-Realtime/config',
            error   : function(xhr) { notify('GTFS-Realtime', xhr.responseText, 'danger'); },
            success : function(response) { notify('GTFS-Realtime', response, 'success'); }
        });

        return false;
    });


    $('#Converter_form').submit(function () {
        $(this).ajaxSubmit({
            type    : "POST",
            url     : '/admin/update/GTFS-Realtime_to_SIRI_Converter/config',
            error   : function(xhr) { notify('Converter', xhr.responseText, 'danger'); },
            success : function(response) { notify('Converter', response, 'success'); }
        });

        return false;
    });


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
            converterConfig = data;
            setConverterConfigFormPlaceholders();
         }
     });

}());
