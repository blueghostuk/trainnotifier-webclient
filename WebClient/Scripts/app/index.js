var fromLocal = ko.observableArray();
var toLocal = ko.observableArray();
var atLocal = ko.observableArray();

var webApi;

var locations = [];

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
        navigator.geolocation.getCurrentPosition(function (position) {
            document.location.href = "search-schedule#!nearest/" + position.coords.latitude + "/" + position.coords.longitude;
        }, function (err) {
            alert("Could not determine current location: " + err.message);
        });
    });
    ko.applyBindings(fromLocal, $("#from-local").get(0));
    ko.applyBindings(toLocal, $("#to-local").get(0));
    ko.applyBindings(atLocal, $("#at-local").get(0));

    ko.applyBindings(tocs, $("#tocs").get(0));

    webApi.getStations().done(function (results) {
        locations = results.map(function (value) {
            return {
                value: value.StationName,
                crs: value.CRS
            };
        });

        var locationLookup = new Bloodhound({
            name: 'stations-lookup',
            datumTokenizer: function (datum) {
                var nameTokens = Bloodhound.tokenizers.whitespace(datum.value);
                var crsTokens = Bloodhound.tokenizers.whitespace(datum.crs);

                return nameTokens.concat(crsTokens);
            },
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            local: locations
        });

        locationLookup.initialize();

        $(".station-lookup").typeahead({
            highlight: true,
            autoselect: true
        }, {
            source: locationLookup.ttAdapter()
        });

        $("#from-crs").attr("placeholder", "Type from station name here");
        $("#to-crs").attr("placeholder", "Type to station name here");
        $("#at-crs").attr("placeholder", "Type calling at station name here");
    });
});

function findStation(value) {
    var matches = locations.filter(function (item) {
        return item.value.toLowerCase() == value.toLowerCase();
    });
    return matches.length > 0 ? matches[0] : null;
}

function showLocation() {
    var toc = "";
    var tocVal = $("#tocs").val();
    if (tocVal && tocVal.length > 0) {
        tocVal = "?toc=" + tocVal;
    }

    var fromStation = $("#from-crs").val();
    var fromCrs = findStation(fromStation);
    if (fromCrs) {
        fromCrs = fromCrs.crs;
    } else {
        if (fromStation.length > 0)
            fromCrs = fromStation.substring(0, 4);
    }
    var toStation = $("#to-crs").val();
    var toCrs = findStation(toStation);
    if (toCrs) {
        toCrs = toCrs.crs;
    } else {
        if (toStation.length > 0)
            toCrs = toStation.substring(0, 4);
    }
    var atStation = $("#at-crs").val();
    var atCrs = findStation(atStation);
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
            time = "/" + timeVal.format(TrainNotifier.DateTimeFormats.timeUrlFormat);
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
    navigator.geolocation.getCurrentPosition(function (position) {
        webApi.getStationByLocation(position.coords.latitude, position.coords.longitude).done(function (stations) {
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
    }, function (err) {
        alert("Could not determine current location: " + err.message);
    });
}

function lookupLocalTo() {
    navigator.geolocation.getCurrentPosition(function (position) {
        webApi.getStationByLocation(position.coords.latitude, position.coords.longitude).done(function (stations) {
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
    }, function (err) {
        alert("Could not determine current location: " + err.message);
    });
}
function lookupLocalAt() {
    navigator.geolocation.getCurrentPosition(function (position) {
        webApi.getStationByLocation(position.coords.latitude, position.coords.longitude).done(function (stations) {
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
    }, function (err) {
        alert("Could not determine current location: " + err.message);
    });
}
