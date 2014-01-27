/// <reference path="tocs.ts" />
/// <reference path="global.ts" />
/// <reference path="webApi.ts" />
/// <reference path="../typings/bootstrap.datepicker/bootstrap.datepicker.d.ts" />
/// <reference path="../typings/moment/moment.d.ts" />
/// <reference path="../typings/bootstrap/bootstrap.d.ts" />
/// <reference path="../typings/knockout/knockout.d.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />

var fromLocal = ko.observableArray();
var toLocal = ko.observableArray();
var atLocal = ko.observableArray();

var webApi: IWebApi;

interface IStationLookup {
    value: string;
    crs: string;
    tokens?: Array<string>
}

var locations: Array<IStationLookup> = [];

declare var Hogan: any;

$(function () {
    webApi = new TrainNotifier.WebApi();
    TrainNotifier.Common.webApi = webApi;

    $('.datepicker').datepicker({
        format: 'dd/mm/yyyy',
        startDate: moment().subtract({ days: 14 }).toDate(),
        weekStart: 1,
        todayHighlight: true
    }).on("changeDate", function () {
            $(this).datepicker('hide');
        });
    $("form").submit(function () {
        return showLocation();
    });
    $(".station-lookup").attr("placeholder", "Loading stations ...");
    $("#nearest").click(function () {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                document.location.href = "search-schedule#!nearest/" + position.coords.latitude + "/" + position.coords.longitude;
            },
            function (err) {
                alert("Could not determine current location: " + err.message);
            });
    });
    ko.applyBindings(fromLocal, $("#from-local").get(0));
    ko.applyBindings(toLocal, $("#to-local").get(0));
    ko.applyBindings(atLocal, $("#at-local").get(0));

    ko.applyBindings(tocs, $("#tocs").get(0));

    webApi.getStations().done(function (results: IStationTiploc[]) {
        for (var i = 0; i < results.length; i++) {
            locations.push({
                value: results[i].StationName,
                crs: results[i].CRS,
                tokens: getTokens(results[i])
            });
        }
        $(".station-lookup").typeahead({
            name: 'stations-lookup',
            local: locations,
            template: '<p><strong>{{value}}</strong>&nbsp;({{crs}})</p>',
            engine: Hogan
        });
        $("#from-crs").attr("placeholder", "Type from station name here");
        $("#to-crs").attr("placeholder", "Type to station name here");
        $("#at-crs").attr("placeholder", "Type calling at station name here");
    });
});

function getTokens(station: IStationTiploc) {
    var results: Array<string> = [];
    results.push(station.CRS);
    results.push(station.Tiploc);
    var stationSplit = station.StationName.split(" ");
    for (var i = 0; i < stationSplit.length; i++) {
        results.push(stationSplit[i]);
    }
    return results;
}

function findStation(value: string): IStationLookup {
    var matches = locations.filter(function (item) {
        return item.value.toLowerCase() == value.toLowerCase();
    });
    return matches.length > 0 ? matches[0] : null;
}

function showLocation() {
    var toc = "";
    var tocVal: string = $("#tocs").val();
    if (tocVal && tocVal.length > 0) {
        tocVal = "?toc=" + tocVal;
    }


    var fromStation: string = $("#from-crs").val();
    var fromCrs: any = findStation(fromStation);
    if (fromCrs) {
        fromCrs = fromCrs.crs;
    } else {
        if (fromStation.length > 0)
            fromCrs = fromStation.substring(0, 4);
    }
    var toStation: string = $("#to-crs").val();
    var toCrs: any = findStation(toStation);
    if (toCrs) {
        toCrs = toCrs.crs;
    } else {
        if (toStation.length > 0)
            toCrs = toStation.substring(0, 4);
    }
    var atStation: string = $("#at-crs").val();
    var atCrs: any = findStation(atStation);
    if (atCrs) {
        atCrs = atCrs.crs;
    } else {
        if (atStation.length > 0)
            atCrs = atStation.substring(0, 4);
    }
    var dateVal = $("#date-picker").val();
    var date;
    if (dateVal && dateVal.length > 0) {
        dateVal = getDate(dateVal);
        if (dateVal && dateVal.isValid()) {
            date = "/" + dateVal.format(TrainNotifier.DateTimeFormats.dateUrlFormat);
        }
    } else {
        date = "/" + moment().format(TrainNotifier.DateTimeFormats.dateUrlFormat);
    }
    var time = "";
    var timeVal = $("#time-picker").val();
    if (timeVal && timeVal.length > 0) {
        timeVal = getTime(timeVal);
        if (timeVal && timeVal.isValid()) {
            time = "/" + timeVal.format(TrainNotifier.DateTimeFormats.timeUrlFormat)
        }
    } else {
        time = "/" + moment().format(TrainNotifier.DateTimeFormats.timeUrlFormat);
    }

    if (fromCrs) {
        if (toCrs) {
            document.location.href = "search/from/" + fromCrs.toUpperCase() + "/to/" + toCrs.toUpperCase() + date + time + tocVal;
        } else {
            document.location.href = "search/from/" + fromCrs.toUpperCase() + date + time + tocVal;
        }
    } else if (toCrs) {
        document.location.href = "search/to/" + toCrs.toUpperCase() + date + time + tocVal;
    } else if (atCrs) {
        document.location.href = "search/at/" + atCrs.toUpperCase() + date + time + tocVal;
    }

    return false;
}

function getDate(dateVal) {
    var d = moment(dateVal, "DD-MM-YYYY");
    if (d.isValid())
        return d;
    d = moment(dateVal, "DD/MM/YYYY");
    if (d.isValid())
        return d;
    d = moment(dateVal, "DDMMYYYY");
    if (d.isValid())
        return d;
    return null;
}

function getTime(timeVal) {
    var t = moment(timeVal, "HH:mm");
    if (t.isValid())
        return t;
    t = moment(timeVal, "HHmm");
    if (t.isValid())
        return t;
    return null;
}

function lookupLocalFrom() {
    navigator.geolocation.getCurrentPosition(
        function (position) {
            webApi.getStationByLocation(position.coords.latitude, position.coords.longitude).done(function (stations: IStationTiploc[]) {
                fromLocal.removeAll();
                if (stations && stations.length > 0) {
                    for (var i = 0; i < stations.length; i++) {
                        fromLocal.push(stations[i].StationName);
                        locations.push({
                            value: stations[i].StationName,
                            crs: stations[i].CRS
                        });
                    }
                }
            });
        },
        function (err) {
            alert("Could not determine current location: " + err.message);
        });
}

function lookupLocalTo() {
    navigator.geolocation.getCurrentPosition(
        function (position) {
            webApi.getStationByLocation(position.coords.latitude, position.coords.longitude).done(function (stations: IStationTiploc[]) {
                toLocal.removeAll();
                if (stations && stations.length > 0) {
                    for (var i = 0; i < stations.length; i++) {
                        toLocal.push(stations[i].StationName);
                        locations.push({
                            value: stations[i].StationName,
                            crs: stations[i].CRS
                        });
                    }
                }
            });
        },
        function (err) {
            alert("Could not determine current location: " + err.message);
        });
}
function lookupLocalAt() {
    navigator.geolocation.getCurrentPosition(
        function (position) {
            webApi.getStationByLocation(position.coords.latitude, position.coords.longitude).done(function (stations: IStationTiploc[]) {
                atLocal.removeAll();
                if (stations && stations.length > 0) {
                    for (var i = 0; i < stations.length; i++) {
                        atLocal.push(stations[i].StationName);
                        locations.push({
                            value: stations[i].StationName,
                            crs: stations[i].CRS
                        });
                    }
                }
            });
        },
        function (err) {
            alert("Could not determine current location: " + err.message);
        });
}