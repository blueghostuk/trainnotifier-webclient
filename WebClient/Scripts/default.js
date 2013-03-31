/// <reference path="jquery-1.9.1.js" />
/// <reference path="mapping.js" />
/// <reference path="moment-datepicker.js" />

function preLoadStationsCallback(results) {
    var locations = [];
    for (i in results) {
        locations.push(results[i].StationName + ' (' + results[i].CRS + ' - ' + results[i].Tiploc + ')');
    }
    $(".station-lookup").typeahead({
        source: locations
    });
    $("#from-crs").attr("placeholder", "Type station name here");
    $("#to-crs").attr("placeholder", "Type to station name here");
}

function typeChange(element) {
    switch ($(element).val()) {
        case "listorigin-crs":
        case "liststation-crs":
        case "listdest-crs":
            $("#to-crs").hide();
            $("#from-crs").attr("placeholder", "Type station name here");
            break;
        case "between":
            $("#to-crs").show();
            $("#from-crs").attr("placeholder", "Type from station name here");
            break;
    }
}

function showLocation() {
    var action = $("#type").val();
    var station = $("#from-crs").val();
    var crs = station.substr(station.indexOf('(') + 1, 3);
    if (action && crs && crs.length == 3) {
        var date = "";
        var dateVal = $("#date-picker").val();
        if (dateVal && dateVal.length == 10)
            date = "#" + moment(dateVal, "DD-MM-YYYY").format("YYYY-MM-DD");
        switch (action) {
            case "listorigin-crs":
            case "liststation-crs":
            case "listdest-crs":
                document.location.href = 'search-schedule#' + action + ':' + crs + date;
                break;
            case "between":
                var toStation = $("#to-crs").val();
                var to = toStation.substr(toStation.indexOf('(') + 1, 3);
                if (to && to.length == 3) {
                    document.location.href = 'search-schedule#list-crs:' + crs + ':list-crs:' + to + date;
                }
                break;
        }
    }
}

$(function () {
    $('.datepicker').datepicker({
        format: 'DD-MM-YYYY',
        autoHide: true
    });
    $(".station-lookup").attr("placeholder", "Loading stations ...");
    preLoadStations(preLoadStationsCallback);
});