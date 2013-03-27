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
    var dateIdx = args.indexOf("#");
    var date = null;
    if (dateIdx != -1) {
        date = args.substring(dateIdx + 1);
        date = moment(date, dateHashFormat);
        args = args.substring(0, dateIdx);
    }

    switch (cmd) {
        case 'listorigin':
            getOrigin(args, false, date);
            break;
        case 'listorigin-crs':
            getOrigin(args, true, date);
            break;
        case 'liststation':
            getStation(args, false, date);
            break;
        case 'liststation-crs':
            getStation(args, true, date);
            break;
    }
}
function getOrigin(args, convertFromCrs, date) {
    if (convertFromCrs) {
        setHash("listorigin-crs:" + args, null, true);
        $.getJSON("http://" + server + ":" + apiPort + "/Stanox/?GetByCrs&crsCode=" + args)
            .done(function (data) {
                getOriginByStanox(data.Name, date);
            });
    } else {
        setHash("listorigin:" + args, null, true);
        getOriginByStanox(args, date);
    }
}

function getStation(args, convertFromCrs, date) {
    if (convertFromCrs) {
        setHash("liststation-crs:" + args, null, true);
        $.getJSON("http://" + server + ":" + apiPort + "/Stanox/?GetByCrs&crsCode=" + args)
            .done(function (data) {
                getCallingAtStanox(data.Name, date);
            });
    } else {
        setHash("liststation:" + args, null, true);
        getCallingAtStanox(args, date);
    }
}

var currentDate = new moment();
var currentStanox = "";
var dateFormat = "ddd DD MMM YY";
var dateFormatQuery = "YYYY-MM-DD";
var dateHashFormat = "DDMMYYYY";
var timeFormat = "HH:mm:ss";

function clear() {
    currentOriginResults.clearTrains();
    currentCallingAtResults.clearTrains();
}

function getOriginByStanox(stanox, date) {
    if (!date) {
        var now = new moment();
    } else {
        now = date;
        setHash(null, now.format(dateHashFormat), true);
    }
    currentDate = new moment(now);
    if (stanox) {
        currentStanox = stanox;
        listStation(currentStanox);
    }
    clear();

    $(".progress").show();
    $.getJSON("http://" + server + ":" + apiPort + "/TrainMovement/StartingAtStation/" + currentStanox +
        "?startDate=" + now.format(dateFormatQuery) +
        "&endDate=" + new moment(now).add('days', 1).format(dateFormatQuery)
    ).done(function (data) {
        if (data && data.length) {
            $("#no-results-row").hide();

            currentOriginResults.PreviousDay(new moment(now).add('days', -1).format(dateFormat));
            currentOriginResults.NextDay(new moment(now).add('days', 1).format(dateFormat));
            currentOriginResults.Day(now.format(dateFormat));

            for (i in data) {
                currentOriginResults.addTrain(createTrainElement(data[i]));
            }
        } else {
            $("#no-results-row").show();
        }
    }
    ).complete(function () {
        $(".progress").hide();
    });
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
        setHash(null, now.format(dateHashFormat), true);
    }
    currentDate = new moment(now);
    if (stanox) {
        currentStanox = stanox;
        listStation(currentStanox);
    }
    clear();

    $(".progress").show();
    $.getJSON("http://" + server + ":" + apiPort + "/TrainMovement/CallingAtStation/" + currentStanox +
        "?startDate=" + now.format(dateFormatQuery) +
        "&endDate=" + new moment(now).add('days', 1).format(dateFormatQuery)
    ).done(function (data) {
        if (data && data.length) {
            $("#no-results-row").hide();

            currentCallingAtResults.PreviousDay(new moment(now).add('days', -1).format(dateFormat));
            currentCallingAtResults.NextDay(new moment(now).add('days', 1).format(dateFormat));
            currentCallingAtResults.Day(now.format(dateFormat));

            for (i in data) {
                currentCallingAtResults.addTrain(createTrainElement(data[i]));
            }
        } else {
            $("#no-results-row").show();
        }
    }
    ).complete(function () {
        $(".progress").hide();
    });
}

function createTrainElement(data) {
    var train = ko.mapping.fromJS(data);
    train.Tooltip = "";
    if (data.Cancellation) {
        train.Tooltip = "Train Cancelled " + data.Cancellation.Type + " at ";
        if (data.Cancellation.CancelledAt) {
            train.Tooltip += data.Cancellation.CancelledAt.Description;
        } else {
            train.Tooltip += data.Cancellation.CancelledStanox;
        }
        train.Tooltip += " @ " + moment(data.Cancellation.CancelledTimestamp).format(timeFormat) + " - Reason : ";
        if (data.Cancellation.Description) {
            train.Tooltip += data.Cancellation.Description;
        }
        train.Tooltip += " (" + data.Cancellation.ReasonCode + ")";
    }
    if (data.ChangeOfOrigin) {
        train.Tooltip += "Will start from " + data.ChangeOfOrigin.NewOrigin.Description
            + " @ " + moment(data.ChangeOfOrigin.NewDepartureTime).format(timeFormat);
        if (data.ChangeOfOrigin.ReasonCode) {
            train.Tooltip += " (" + data.ChangeOfOrigin.ReasonCode + ": " + data.ChangeOfOrigin.Description + ")";
        }
    }
    if (data.Reinstatement) {
        train.Tooltip += "\r\n Train Reinstated from " + data.Reinstatement.NewOrigin.Description + " @ "
            + moment(data.Reinstatement.PlannedDepartureTime).format(timeFormat);
    }
    train.ActualArrival = "";
    if (data.ActualArrival) {
        train.ActualArrival = moment(data.ActualArrival).format(timeFormat);
    }
    train.ActualDeparture = "";
    if (data.ActualDeparture) {
        train.ActualDeparture = moment(data.ActualDeparture).format(timeFormat);
    }
    if (train.Origin) {
        train.Origin.Description(train.Origin.Description().toLowerCase());
    }
    if (train.Destination) {
        train.Destination.Description(train.Destination.Description().toLowerCase());
    }
    return train;
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

var _lastHash;

function setHash(hash, dateHash, dontLoad) {
    if (!hash) {
        hash = _lastHash;
    } else {
        _lastHash = hash;
    }
    if (dateHash) {
        hash += "#" + dateHash;
    }
    document.location.hash = hash;
    if (!dontLoad) {
        loadHashCommand();
    }
    setCommand(hash);
}