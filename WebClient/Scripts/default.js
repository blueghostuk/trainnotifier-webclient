/// <reference path="jquery-1.9.1.js" />
/// <reference path="mapping.js" />
/// <reference path="moment.js" />
/// <reference path="moment-datepicker.js" />

var fromLocal = ko.observableArray();
var toLocal = ko.observableArray();
var atLocal = ko.observableArray();

$(function () {
    $('.datepicker').datepicker({
        format: 'DD-MM-YYYY',
        autoHide: true
    });
    $("form").submit(function () {
        return showLocation();
    });
    $(".station-lookup").attr("placeholder", "Loading stations ...");
    ko.applyBindings(fromLocal, $("#from-local").get(0));
    ko.applyBindings(toLocal, $("#to-local").get(0));
    ko.applyBindings(atLocal, $("#at-local").get(0));
    preLoadStations(preLoadStationsCallback);
});

function preLoadStationsCallback(results) {
    var locations = [];
    for (i in results) {
        locations.push(results[i].StationName + ' (' + results[i].CRS + ' - ' + results[i].Tiploc + ')');
    }
    $(".station-lookup").typeahead({
        source: locations,
        sorter: function (items) {
            var self = this;
            return items.sort(function (a, b) {
                var aCrs = a.substr(a.lastIndexOf('(') + 1, 3);
                var bCrs = b.substr(b.lastIndexOf('(') + 1, 3);

                if (self.query.toLowerCase() == aCrs.toLowerCase())
                    return -1;
                else if (self.query.toLowerCase() == bCrs.toLowerCase())
                    return 1;
                else
                    return aCrs > bCrs;
            });
        }
    });
    $("#from-crs").attr("placeholder", "Type from station name here");
    $("#to-crs").attr("placeholder", "Type to station name here");
    $("#at-crs").attr("placeholder", "Type calling at station name here");
}

function showLocation() {
    var fromStation = $("#from-crs").val();
    var fromCrs = null;
    if (fromStation.length > 0)
        fromCrs = fromStation.substr(fromStation.lastIndexOf('(') + 1, 3);
    var toStation = $("#to-crs").val();
    var toCrs = null
    if (toStation.length > 0)
        toCrs = toStation.substr(toStation.lastIndexOf('(') + 1, 3);
    var atStation = $("#at-crs").val();
    var atCrs = null
    if (atStation.length > 0)
        atCrs = atStation.substr(atStation.lastIndexOf('(') + 1, 3);
    var dateVal = $("#date-picker").val();
    if (dateVal && dateVal.length > 0) {
        dateVal = getDate(dateVal);
        if (dateVal && dateVal.isValid()) {
            date = dateVal.format("/YYYY/MM/DD");
        }
    } else {
        date = moment().format("/YYYY/MM/DD");
    }
    var time = "";
    var timeVal = $("#time-picker").val();
    if (timeVal && timeVal.length > 0) {
        timeVal = getTime(timeVal);
        if (timeVal && timeVal.isValid()) {
            time = timeVal.format("/HH-mm")
        }
    } else {
        time = moment().format("/HH-mm");
    }

    if (fromCrs) {
        if (toCrs) {
            document.location.href = "search/from/" + fromCrs + "/to/" + toCrs + date + time;
        } else {
            document.location.href = "search/from/" + fromCrs + date + time;
        }
    } else if (toCrs) {
        document.location.href = "search/to/" + toCrs + date + time;
    } else if (atCrs) {
        document.location.href = "search/at/" + atCrs + date + time;
    }

    return false;
}

function getDate(dateVal) {
    var d = moment(dateVal, "DD-MM-YYYY");
    if (d.isValid())
        return d;
    d = moment(timeVal, "DD/MM/YYYY");
    if (d.isValid())
        return d;
    d = moment(timeVal, "DDMMYYYY");
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
    navigator.geolocation.getCurrentPosition(function (position) {
        $.getJSON("http://" + server + ":" + apiPort + "/Station/GeoLookup", {
            lat: position.coords.latitude,
            lon: position.coords.longitude
        }).done(function (stations) {
            fromLocal.removeAll();
            if (stations && stations.length > 0) {
                for (var i in stations) {
                    fromLocal.push(stations[i].StationName + ' (' + stations[i].CRS + ' - ' + stations[i].Tiploc + ')');
                }
            }
        });
    });
}

function lookupLocalTo() {
    navigator.geolocation.getCurrentPosition(function (position) {
        $.getJSON("http://" + server + ":" + apiPort + "/Station/GeoLookup", {
            lat: position.coords.latitude,
            lon: position.coords.longitude
        }).done(function (stations) {
            toLocal.removeAll();
            if (stations && stations.length > 0) {
                for (var i in stations) {
                    toLocal.push(stations[i].StationName + ' (' + stations[i].CRS + ' - ' + stations[i].Tiploc + ')');
                }
            }
        });
    });
}
function lookupLocalAt() {
    navigator.geolocation.getCurrentPosition(function (position) {
        $.getJSON("http://" + server + ":" + apiPort + "/Station/GeoLookup", {
            lat: position.coords.latitude,
            lon: position.coords.longitude
        }).done(function (stations) {
            atLocal.removeAll();
            if (stations && stations.length > 0) {
                for (var i in stations) {
                    atLocal.push(stations[i].StationName + ' (' + stations[i].CRS + ' - ' + stations[i].Tiploc + ')');
                }
            }
        });
    });
}

