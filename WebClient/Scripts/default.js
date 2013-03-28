/// <reference path="jquery-1.9.1.js" />

function preLoadStationsCallback(results) {
    var locations = [];
    for (i in results) {
        locations.push(results[i].StationName + ' (' + results[i].CRS + ' - ' + results[i].Tiploc + ')');
    }
    $("#station-lookup").typeahead({
        source: locations
    });
    $("#station-lookup").attr("placeholder", "Type station name here");
}

function showLocation() {
    var action = $("#type").val();
    var station = $("#station-lookup").val();
    var crs = station.substr(station.indexOf('(') + 1, 3);
    if (action && crs && crs.length == 3) {
        document.location.href = 'search-schedule#' + action + ':' + crs;
    }
}

$(function () {
    $("#station-lookup").attr("placeholder", "Loading stations ...");
    preLoadStations(preLoadStationsCallback);
});