/// <reference path="jquery-1.9.1.js" />
/// <reference path="table-fixed-header.js" />
/// <reference path="knockout-2.2.1.js" />
/// <reference path="knockout.mapping-latest.js" />
/// <reference path="moment.js" />
/// <reference path="ViewModels.js" />

var currentLocation = new LocationViewModel();
var currentOriginResults = new ScheduleSearchResults();
var currentCallingAtResults = new ScheduleSearchResults();
var titleModel = new TitleViewModel();

var currentDate = new moment();
var currentStanox = "";
var currentToStanox = "";
var dateFormat = "ddd DD MMM YY";
var dateFormatQuery = "YYYY-MM-DD";
var dateHashFormat = "YYYY-MM-DD";
var timeFormat = "HH:mm:ss";
var titleFormat = "ddd Do MMM YYYY";

$(function () {
    preLoadStations(preLoadStationsCallback);

    ko.applyBindings(currentLocation, $("#stationDetails").get(0));
    ko.applyBindings(currentOriginResults, $("#origin-search-results").get(0));
    ko.applyBindings(currentCallingAtResults, $("#callingAt-search-results").get(0));
    ko.applyBindings(titleModel, $("#title").get(0));

    loadHashCommand();
});

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
        case 'listdest':
            getDestination(args, false, date);
            break;
        case 'listdest-crs':
            getDestination(args, true, date);
            break;
        case 'liststation':
            getStation(args, false, date);
            break;
        case 'liststation-crs':
            getStation(args, true, date);
            break;
        case 'list':
            args = args.split(":");
            if (args.length == 3) {
                getCallingBetween(args[0], args[2], false, date);
            }
            break;
        case 'list-crs':
            args = args.split(":");
            if (args.length == 3) {
                getCallingBetween(args[0], args[2], true, date);
            }
            break;
    }
}

function getCallingBetween(from, to, convertFromCrs, date) {
    if (convertFromCrs) {
        setHash("list-crs:" + from + ":list-crs:" + to, null, true);
        $.when($.getJSON("http://" + server + ":" + apiPort + "/Stanox/?GetByCrs&crsCode=" + from),
               $.getJSON("http://" + server + ":" + apiPort + "/Stanox/?GetByCrs&crsCode=" + to))
            .done(function (from, to) {
                var title = "Trains from " + from[0].Description.toLowerCase() + " to " + to[0].Description.toLowerCase();
                if (!date) {
                    title += " on " + new moment().format(titleFormat);
                } else {
                    title+= " on " + date.format(titleFormat);
                }
                titleModel.Text(title);
                getCallingBetweenByStanox(from[0].Name, to[0].Name, date);
            });
    } else {
        setHash("list:" + from + ":list:" + to, null, true);
        getCallingBetweenByStanox(from, to, date);
        $.when($.getJSON("http://" + server + ":" + apiPort + "/Stanox/" + from),
               $.getJSON("http://" + server + ":" + apiPort + "/Stanox/" + to))
            .done(function (from, to) {
                var title = "Trains from " + from[0].Description.toLowerCase() + " to " + to[0].Description.toLowerCase();
                if (!date) {
                    title += " on " + new moment().format(titleFormat);
                } else {
                    title += " on " + date.format(titleFormat);
                }
                titleModel.Text(title);
            });
    }
}

function getDestination(args, convertFromCrs, date) {
    if (convertFromCrs) {
        setHash("listdest-crs:" + args, null, true);
        $.getJSON("http://" + server + ":" + apiPort + "/Stanox/?GetByCrs&crsCode=" + args)
            .done(function (data) {
                var title = "Trains terminating at " + data.Description.toLowerCase(); if (!date) {
                    title += " on " + new moment().format(titleFormat);
                } else {
                    title += " on " + date.format(titleFormat);
                }
                titleModel.Text(title);
                getDestinationByStanox(data.Name, date);
            });
    } else {
        setHash("listdest:" + args, null, true);
        getDestinationByStanox(args, date);
        $.when($.getJSON("http://" + server + ":" + apiPort + "/Stanox/" + args))
            .done(function (data) {
                var title = "Trains terminating at " + data.Description.toLowerCase(); if (!date) {
                    title += " on " + new moment().format(titleFormat);
                } else {
                    title += " on " + date.format(titleFormat);
                }
                titleModel.Text(title);
            });
    }
}

function getOrigin(args, convertFromCrs, date) {
    if (convertFromCrs) {
        setHash("listorigin-crs:" + args, null, true);
        $.getJSON("http://" + server + ":" + apiPort + "/Stanox/?GetByCrs&crsCode=" + args)
            .done(function (data) {
                var title = "Trains starting at " + data.Description.toLowerCase(); if (!date) {
                    title += " on " + new moment().format(titleFormat);
                } else {
                    title += " on " + date.format(titleFormat);
                }
                titleModel.Text(title);
                getOriginByStanox(data.Name, date);
            });
    } else {
        setHash("listorigin:" + args, null, true);
        getOriginByStanox(args, date);
        $.when($.getJSON("http://" + server + ":" + apiPort + "/Stanox/" + args))
            .done(function (data) {
                var title = "Trains starting at " + data.Description.toLowerCase(); if (!date) {
                    title += " on " + new moment().format(titleFormat);
                } else {
                    title += " on " + date.format(titleFormat);
                }
                titleModel.Text(title);
            });
    }
}

function getStation(args, convertFromCrs, date) {
    if (convertFromCrs) {
        setHash("liststation-crs:" + args, null, true);
        $.getJSON("http://" + server + ":" + apiPort + "/Stanox/?GetByCrs&crsCode=" + args)
            .done(function (data) {
                var title = "Trains calling at " + data.Description.toLowerCase(); if (!date) {
                    title += " on " + new moment().format(titleFormat);
                } else {
                    title += " on " + date.format(titleFormat);
                }
                titleModel.Text(title);
                getCallingAtStanox(data.Name, date);
            });
    } else {
        setHash("liststation:" + args, null, true);
        getCallingAtStanox(args, date);
        $.when($.getJSON("http://" + server + ":" + apiPort + "/Stanox/" + args))
            .done(function (data) {
                var title = "Trains calling at " + data.Description.toLowerCase(); if (!date) {
                    title += " on " + new moment().format(titleFormat);
                } else {
                    title += " on " + date.format(titleFormat);
                }
                titleModel.Text(title);
            });
    }
}

function clear() {
    currentOriginResults.clearTrains();
    currentCallingAtResults.clearTrains();
}

function getDestinationByStanox(stanox, date) {
    currentOriginResults.Mode = scheduleResultsMode.Terminate;
    var now = null;
    if (!date) {
        now = new moment();
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
    $.getJSON("http://" + server + ":" + apiPort + "/TrainMovement/TerminatingAtStation/" + currentStanox +
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

function getOriginByStanox(stanox, date) {
    currentOriginResults.Mode = scheduleResultsMode.Origin;
    var now = null;
    if (!date) {
        now = new moment();
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
    switch (currentOriginResults.Mode) {
        case scheduleResultsMode.Origin:
            getOriginByStanox(null, new moment(currentDate).add('days', -1));
            break;
        case scheduleResultsMode.Terminate:
            getDestinationByStanox(null, new moment(currentDate).add('days', -1));
            break;
    }
}

function nextDate() {
    switch (currentOriginResults.Mode) {
        case scheduleResultsMode.Origin:
            getOriginByStanox(null, new moment(currentDate).add('days', 1));
            break;
        case scheduleResultsMode.Terminate:
            getDestinationByStanox(null, new moment(currentDate).add('days', 1));
            break;
    }
}

function previousCallingAtDate() {
    switch (currentCallingAtResults.Mode) {
        case scheduleResultsMode.CallingAt:
            getCallingAtStanox(null, new moment(currentDate).add('days', -1));
            break;
        case scheduleResultsMode.Between:
            getCallingBetweenByStanox(null, null, new moment(currentDate).add('days', -1));
            break;
    }
}

function nextCallingAtDate() {
    switch (currentCallingAtResults.Mode) {
        case scheduleResultsMode.CallingAt:
            getCallingAtStanox(null, new moment(currentDate).add('days', 1));
            break;
        case scheduleResultsMode.Between:
            getCallingBetweenByStanox(null, null, new moment(currentDate).add('days', 1));
            break;
    }
}

function getCallingAtStanox(stanox, date) {
    currentCallingAtResults.Mode = scheduleResultsMode.CallingAt;
    var now = null;
    if (!date) {
        now = new moment();
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

function getCallingBetweenByStanox(from, to, date) {
    currentCallingAtResults.Mode = scheduleResultsMode.Between;
    var now = null;
    if (!date) {
        now = new moment();
    } else {
        now = date;
        setHash(null, now.format(dateHashFormat), true);
    }
    currentDate = new moment(now);
    if (from) {
        currentStanox = from;
        listStation(currentStanox);
    }
    if (to) {
        currentToStanox = to;
    }
    clear();

    $(".progress").show();
    $.getJSON("http://" + server + ":" + apiPort + "/TrainMovement/" + currentStanox + "/" + currentToStanox +
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
        if (train.Origin.Description()) {
            train.Origin.Description(train.Origin.Description().toLowerCase());
        } else if (train.Origin.Tiploc()) {
            train.Origin.Description(train.Origin.Tiploc().toLowerCase());
        }
    }
    if (train.Destination) {
        if (train.Destination.Description()) {
            train.Destination.Description(train.Destination.Description().toLowerCase());
        } else if (train.Destination.Tiploc()) {
            train.Destination.Description(train.Destination.Tiploc().toLowerCase());
        }
    }
    return train;
}

function preLoadStationsCallback(results) {
    var commands = [];
    commands.push('listorigin:');
    for (i in results) {
        commands.push('listorigin:' + results[i].Name);
    }
    commands.push('listorigin-crs:');
    for (i in results) {
        commands.push('listorigin-crs:' + results[i].CRS);
    }
    commands.push('liststation:');
    for (i in results) {
        commands.push('liststation:' + results[i].Name);
    }
    commands.push('liststation-crs:');
    for (i in results) {
        commands.push('liststation-crs:' + results[i].CRS);
    }
    commands.push('listdest:');
    for (i in results) {
        commands.push('listdest:' + results[i].Name);
    }
    commands.push('listdest-crs:');
    for (i in results) {
        commands.push('listdest-crs:' + results[i].CRS);
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