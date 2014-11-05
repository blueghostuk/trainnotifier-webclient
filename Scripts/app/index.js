var fromLocal = ko.observableArray();
var toLocal = ko.observableArray();
var atLocal = ko.observableArray();

var webApi;

var locations = [];

$(function () {
    var now = moment();
    $("#date-picker").val(now.format("YYYY-MM-DD"));
    $("#time-picker").val(now.format("HH:mm"));

    webApi = new TrainNotifier.WebApi();
    TrainNotifier.Common.webApi = webApi;

    $("form").submit(function () {
        return showLocation();
    });
    $(".station-lookup").attr("placeholder", "Loading stations ...");
    $("#nearest").click(function () {
        navigator.geolocation.getCurrentPosition(function (position) {
            document.location.href = "search-schedule/#!nearest/" + position.coords.latitude + "/" + position.coords.longitude;
        }, function (err) {
            alert("Could not determine current location: " + err.message);
        });
    });
    ko.applyBindings(fromLocal, $("#from-local").get(0));
    ko.applyBindings(toLocal, $("#to-local").get(0));
    ko.applyBindings(atLocal, $("#at-local").get(0));

    ko.applyBindings(tocs, $("#tocs").get(0));

    webApi.getStations().done(function (results) {
        locations = results.filter(function (value) {
            return value.CRS != null;
        }).map(function (value) {
            return {
                value: TrainNotifier.StationTiploc.toDisplayString(value, false),
                crs: value.CRS,
                stanox: value.Stanox
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
    if (!value || value.length == 0)
        return null;
    value = value.toLowerCase();
    var matches = locations.filter(function (item) {
        return item.value.toLowerCase() == value || item.crs != null && item.crs.toLowerCase() == value;
    });
    return matches.length > 0 ? matches[0] : null;
}

function getStationQuery(value) {
    return value != null ? ((value.crs != null && value.crs.length > 0) ? value.crs.toUpperCase() : value.stanox) : null;
}

function showLocation() {
    var toc = "";
    var tocVal = $("#tocs").val();
    if (tocVal && tocVal.length > 0) {
        tocVal = "?toc=" + tocVal;
    }

    var fromStation = $("#from-crs").val();
    var fromCrs = findStation(fromStation);

    var toStation = $("#to-crs").val();
    var toCrs = findStation(toStation);

    var atStation = $("#at-crs").val();
    var atCrs = findStation(atStation);

    var date = $("#date-picker").val();
    if (date && date.length > 0) {
        var dateVal = moment(date, "YYYY-MM-DD");
        if (dateVal.isValid()) {
            date = "/" + dateVal.format(TrainNotifier.DateTimeFormats.dateUrlFormat);
        }
    } else {
        date = "/" + moment().format(TrainNotifier.DateTimeFormats.dateUrlFormat);
    }

    var time = $("#time-picker").val();
    if (time && time.length > 0) {
        var timeVal = moment(time, TrainNotifier.DateTimeFormats.timeUrlFormat);
        if (timeVal.isValid()) {
            time = "/" + timeVal.format(TrainNotifier.DateTimeFormats.timeUrlFormat);
        }
    } else {
        time = "/" + moment().format(TrainNotifier.DateTimeFormats.timeUrlFormat);
    }

    var fromQuery = getStationQuery(fromCrs);
    var toQuery = getStationQuery(toCrs);
    var atQuery = getStationQuery(atCrs);

    if (fromQuery) {
        if (toQuery) {
            document.location.href = "search-schedule/#!from/" + fromQuery + "/to/" + toQuery + date + time + tocVal;
        } else {
            document.location.href = "search-schedule/#!from/" + fromQuery + date + time + tocVal;
        }
    } else if (toCrs) {
        document.location.href = "search-schedule/#!to/" + toQuery + date + time + tocVal;
    } else if (atCrs) {
        document.location.href = "search-schedule/#!at/" + atQuery + date + time + tocVal;
    }

    return false;
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
                        crs: stations[i].CRS,
                        stanox: stations[i].Stanox
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
                        crs: stations[i].CRS,
                        stanox: stations[i].Stanox
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
                        crs: stations[i].CRS,
                        stanox: stations[i].Stanox
                    });
                }
            }
        });
    }, function (err) {
        alert("Could not determine current location: " + err.message);
    });
}
