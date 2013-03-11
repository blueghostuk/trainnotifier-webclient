/// <reference path="jquery-1.9.1.js" />
/// <reference path="table-fixed-header.js" />
/// <reference path="knockout-2.2.1.js" />
/// <reference path="knockout.mapping-latest.js" />
/// <reference path="moment.js" />
/// <reference path="ViewModels.js" />

var currentLocation = new LocationViewModel();
var currentOriginResults = new ScheduleSearchResults();
var currentCallingAtResults = new ScheduleSearchResults();

function setCommand(command) {
    $("#filter-command").val(command);
}

function parseCommand() {
    var cmdString = $("#filter-command").val();
    var idx = cmdString.indexOf(":");
    if (idx == -1)
        return;

    var cmd = cmdString.substring(0, idx);
    var args = cmdString.substring(idx + 1);

    switch (cmd) {
        case 'listorigin':
            getOrigin(args);
            break;
        case 'listorigin-crs':
            getOrigin(args, true);
            break;
        case 'liststation':
            getStation(args);
            break;
        case 'liststation-crs':
            getStation(args, true);
            break;
    }
}
function getOrigin(args, convertFromCrs) {
    if (convertFromCrs) {
        document.location.hash = "listorigin-crs:" + args;
        $.getJSON("http://" + server + ":" + apiPort + "/Stanox/?GetByCrs&crsCode=" + args, function (data) {
            getOriginByStanox(data.Name);
        });
    } else {
        document.location.hash = "listorigin:" + args;
        getOriginByStanox(args);
    }
}

function getStation(args, convertFromCrs) {
    if (convertFromCrs) {
        document.location.hash = "liststation-crs:" + args;
        $.getJSON("http://" + server + ":" + apiPort + "/Stanox/?GetByCrs&crsCode=" + args, function (data) {
            getCallingAtStanox(data.Name);
        });
    } else {
        document.location.hash = "liststation:" + args;
        getCallingAtStanox(args);
    }
}

var currentDate = new moment();
var currentStanox = "";
var dateFormat = "ddd DD MMM YY";
var dateFormatQuery = "YYYY-MM-DD";

function clear() {
    currentOriginResults.clearTrains();
    currentCallingAtResults.clearTrains();
}

function getOriginByStanox(stanox, date) {
    if (!date) {
        var now = new moment();
    } else {
        now = date;
    }
    currentDate = new moment(now);
    if (stanox) {
        currentStanox = stanox;
        listStation(currentStanox);
    }

    $.getJSON("http://" + server + ":" + apiPort + "/TrainMovement/StartingAtStation/" + currentStanox +
        "?startDate=" + now.format(dateFormatQuery) +
        "&endDate=" + new moment(now).add('days', 1).format(dateFormatQuery),
        function (data) {
            clear();
            if (data && data.length) {
                $("#no-results-row").hide();

                currentOriginResults.PreviousDay(new moment(now).add('days', -1).format(dateFormat));
                currentOriginResults.NextDay(new moment(now).add('days', 1).format(dateFormat));
                currentOriginResults.Day(now.format(dateFormat));

                for (i in data) {
                    var train = ko.mapping.fromJS(data[i]);
                    train.CssClass = "";
                    if (data[i].Pass)
                        train.CssClass = "warning pass";
                    currentOriginResults.addTrain(train);
                }
            } else {
                $("#no-results-row").show();
            }
        }
    );
}

function previousDate() {
    getOriginByStanox(null, new moment(currentDate).add('days', -1));
}

function nextDate() {
    getOriginByStanox(null, new moment(currentDate).add('days', 1));
}

function getCallingAtStanox(stanox, date) {
    if (!date) {
        var now = new moment();
    } else {
        now = date;
    }
    currentDate = new moment(now);
    if (stanox) {
        currentStanox = stanox;
        listStation(currentStanox);
    }

    $.getJSON("http://" + server + ":" + apiPort + "/TrainMovement/CallingAtStation/" + currentStanox +
        "?startDate=" + now.format(dateFormatQuery) +
        "&endDate=" + new moment(now).add('days', 1).format(dateFormatQuery),
        function (data) {
            clear();

            if (data && data.length) {
                $("#no-results-row").hide();

                currentCallingAtResults.PreviousDay(new moment(now).add('days', -1).format(dateFormat));
                currentCallingAtResults.NextDay(new moment(now).add('days', 1).format(dateFormat));
                currentCallingAtResults.Day(now.format(dateFormat));

                for (i in data) {
                    var train = ko.mapping.fromJS(data[i]);
                    train.CssClass = "";
                    if (data[i].Pass)
                        train.CssClass = "warning pass";
                    currentCallingAtResults.addTrain(train);
                }
            } else {
                $("#no-results-row").show();
            }
        }
    );
}

function previousCallingAtDate() {
    getCallingAtStanox(null, new moment(currentDate).add('days', -1));
}

function nextCallingAtDate() {
    getCallingAtStanox(null, new moment(currentDate).add('days', 1));
}

function preLoadStationsCallback(results) {
    var commands = [];
    commands.push('listorigin:');
    for (i in results) {
        commands.push('listorigin:' + results[i].Name)
    }
    commands.push('listorigin-crs:');
    for (i in results) {
        commands.push('listorigin-crs:' + results[i].CRS)
    }
    commands.push('liststation:');
    for (i in results) {
        commands.push('liststation:' + results[i].Name)
    }
    commands.push('liststation-crs:');
    for (i in results) {
        commands.push('liststation-crs:' + results[i].CRS)
    }
    $("#filter-command").typeahead({
        source: commands
    });
}

function listStation(stanox) {
    $('html, body').animate({
        scrollTop: $("#locationDetails").offset().top
    }, 1000);
    $.getJSON("http://" + server + ":" + apiPort + "/Stanox/" + stanox, function (data) {
        currentLocation.locationStanox(data.Name);
        currentLocation.locationTiploc(data.Tiploc);
        currentLocation.locationDescription(data.Description);
        currentLocation.locationCRS(data.CRS);
        currentLocation.stationName(data.StationName);
    });
}

$(function () {
    preLoadStations(preLoadStationsCallback);

    ko.applyBindings(currentLocation, $("#stationDetails").get(0));
    ko.applyBindings(currentOriginResults, $("#origin-search-results").get(0));
    ko.applyBindings(currentCallingAtResults, $("#callingAt-search-results").get(0));

    loadHashCommand();
});

function loadHashCommand() {
    if (document.location.hash.length > 0) {
        setCommand(document.location.hash.substr(1));
        parseCommand();
    }
    return false;
}

function setHash(hash) {
    document.location.hash = hash;
    loadHashCommand();
}