/// <reference path="tocs.ts" />
/// <reference path="global.ts" />
/// <reference path="webApi.ts" />
/// <reference path="../typings/moment/moment.d.ts" />
/// <reference path="../typings/bootstrap/bootstrap.d.ts" />
/// <reference path="../typings/knockout/knockout.d.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />

var fromLocal = ko.observableArray<string>();
var toLocal = ko.observableArray<string>();
var atLocal = ko.observableArray<string>();

var webApi: IWebApi;

interface IStationLookup {
    value: string;
    crs: string;
    stanox: string;
}

var locations: IStationLookup[] = [];

declare var Bloodhound: any;

interface JQuery {
    typeahead(options: any, datasets: any);
}

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
        navigator.geolocation.getCurrentPosition(
            function (position) {
                document.location.href = "search-results/#!nearest/" + position.coords.latitude + "/" + position.coords.longitude;
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
            datumTokenizer: function (datum: IStationLookup) {
                var nameTokens: Array<any> = Bloodhound.tokenizers.whitespace(datum.value);
                var crsTokens: Array<any> = Bloodhound.tokenizers.whitespace(datum.crs);

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

function findStation(value: string): IStationLookup {
    if (!value || value.length == 0)
        return null;
    value = value.toLowerCase();
    var matches = locations.filter(function (item) {
        return item.value.toLowerCase() == value ||
            item.crs != null && item.crs.toLowerCase() == value;
    });
    return matches.length > 0 ? matches[0] : null;
}

function getStationQuery(value: IStationLookup) {
    return value != null ? ((value.crs != null && value.crs.length > 0) ? value.crs.toUpperCase() : value.stanox) : null;
}

function showLocation() {
    var toc = "";
    var tocVal: string = $("#tocs").val();
    if (tocVal && tocVal.length > 0) {
        tocVal = "?toc=" + tocVal;
    }

    var fromStation: string = $("#from-crs").val();
    var fromCrs = findStation(fromStation);

    var toStation: string = $("#to-crs").val();
    var toCrs = findStation(toStation);

    var atStation: string = $("#at-crs").val();
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
            document.location.href = "search-results/#!from/" + fromQuery + "/to/" + toQuery + date + time + tocVal;
        } else {
            document.location.href = "search-results/#!from/" + fromQuery + date + time + tocVal;
        }
    } else if (toCrs) {
        document.location.href = "search-results/#!to/" + toQuery + date + time + tocVal;
    } else if (atCrs) {
        document.location.href = "search-results/#!at/" + atQuery + date + time + tocVal;
    }

    return false;
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
                            crs: stations[i].CRS,
                            stanox: stations[i].Stanox
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
                            crs: stations[i].CRS,
                            stanox: stations[i].Stanox
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
                            crs: stations[i].CRS,
                            stanox: stations[i].Stanox
                        });
                    }
                }
            });
        },
        function (err) {
            alert("Could not determine current location: " + err.message);
        });
}