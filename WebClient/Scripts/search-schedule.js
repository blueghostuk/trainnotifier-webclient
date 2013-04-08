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

var currentStanox = "";
var currentToStanox = "";
var currentStartDate = null;
var currentEndDate = null;
var currentMode;
var dateHashFormat = "YYYY-MM-DD";
var dateTimeHashFormat = "YYYY-MM-DD/HH-mm";
var timeFormat = "HH:mm:ss";
var timeTitleFormat = "HH:mm";
var titleFormat = "ddd Do MMM YYYY";
var dateUrlFormat = "YYYY/MM/DD";
var dateApiQuery = "YYYY-MM-DDTHH:mm";

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
    var idx = cmdString.indexOf("/");
    if (idx == -1)
        return;

    var cmd = cmdString.substring(0, idx);
    var args = cmdString.substring(idx + 1).split('/');    

    $("#commandOptions > li.active").removeClass("active");
    var convertFromCrs = args[0].length == 3;

    switch (cmd) {
        case 'from':
            if (args.length >= 3 && args[1] == "to") {
                getCallingBetween(args[0], args[2], convertFromCrs, getDateTime(args.slice(3)));
            } else {
                getOrigin(args[0], convertFromCrs, getDateTime(args.slice(1)));
            }
            break;
        case 'to':
            getDestination(args[0], convertFromCrs, getDateTime(args.slice(1)));
            break;
        case 'at':
            getStation(args[0], convertFromCrs, getDateTime(args.slice(1)));
            break;
    }
}

function getDateTime(args) {
    if (args.length > 0) {
        if (args.length == 2) {
            return moment(args.join('/'), dateTimeHashFormat);
        } else {
            return moment(args[0], dateHashFormat);
        }
    } else {
        return moment();
    }
}

function preAjax() {
    $(".progress").show();
    $("#error-row").hide();
    $("#no-results-row").hide();
}

function getCallingBetween(from, to, convertFromCrs, dateTime) {
    $("#commandOptions > li#from-to" + (convertFromCrs ? "-crs" : "")).addClass("active");
    var startDate = moment(dateTime).subtract(2, "hours");
    var endDate = moment(dateTime).add(2, "hours");
    var hash = "from/" + from + "/to/" + to;
    var url = "";
    if (convertFromCrs) {
        url = "http://" + server + ":" + apiPort + "/Stanox/?GetByCrs&crsCode=";
    } else {
        url = "http://" + server + ":" + apiPort + "/Stanox/";
    }

    setHash(hash, null, true);
    preAjax();
    $.when($.getJSON(url + from),
           $.getJSON(url + to))
        .done(function (from, to) {
            getCallingBetweenByStanox(from[0], to[0], startDate, endDate);
        })
        .fail(function () {
            $(".progress").hide();
            $("#error-row").show();
        });
}

function getDestination(crs, convertFromCrs, dateTime) {
    $("#commandOptions > li#to" + (convertFromCrs ? "-crs" : "")).addClass("active");
    var startDate = moment(dateTime).subtract(2, "hours");
    var endDate = moment(dateTime).add(2, "hours");
    var hash = "to/" + crs;
    var url = "";
    if (convertFromCrs) {
        url = "http://" + server + ":" + apiPort + "/Stanox/?GetByCrs&crsCode=";
    } else {
        url = "http://" + server + ":" + apiPort + "/Stanox/";
    }

    setHash(hash, null, true);
    preAjax();
    $.when($.getJSON(url + crs))
        .done(function (from) {
            getDestinationByStanox(from,  startDate, endDate);
        })
        .fail(function () {
            $(".progress").hide();
            $("#error-row").show();
        });
}

function getOrigin(crs, convertFromCrs, dateTime) {
    $("#commandOptions > li#from" + (convertFromCrs ? "-crs" : "")).addClass("active");
    var startDate = moment(dateTime).subtract(2, "hours");
    var endDate = moment(dateTime).add(2, "hours");
    var hash = "from/" + crs;
    var url = "";
    if (convertFromCrs) {
        url = "http://" + server + ":" + apiPort + "/Stanox/?GetByCrs&crsCode=";
    } else {
        url = "http://" + server + ":" + apiPort + "/Stanox/";
    }

    setHash(hash, null, true);
    preAjax();
    $.when($.getJSON(url + crs))
        .done(function (to) {
            getOriginByStanox(to,  startDate, endDate);
        })
        .fail(function () {
            $(".progress").hide();
            $("#error-row").show();
        });
}

function getStation(crs, convertFromCrs, dateTime) {
    $("#commandOptions > li#at" + (convertFromCrs ? "-crs" : "")).addClass("active");
    var startDate = moment(dateTime).subtract(2, "hours");
    var endDate = moment(dateTime).add(2, "hours");
    var hash = "at/" + crs;
    var url = "";
    if (convertFromCrs) {
        url = "http://" + server + ":" + apiPort + "/Stanox/?GetByCrs&crsCode=";
    } else {
        url = "http://" + server + ":" + apiPort + "/Stanox/";
    }

    setHash(hash, null, true);
    preAjax();
    $.when($.getJSON(url + crs))
        .done(function (at) {
            getCallingAtStanox(at, startDate, endDate);
        })
        .fail(function () {
            $(".progress").hide();
            $("#error-row").show();
        });
}

function getDestinationByStanox(to, startDate, endDate) {
    currentMode = scheduleResultsMode.Terminate;
    if (to) {
        currentToStanox = to;
        listStation(currentToStanox.Stanox);
    }
    currentStanox = null;
    currentStartDate = startDate;
    currentEndDate = endDate;
    clear();

    setTitle("Trains terminating at ");
    setTimeLinks();

    $.getJSON("http://" + server + ":" + apiPort + "/TrainMovement/TerminatingAtStation/" + currentToStanox.Stanox +
        "?startDate=" + currentStartDate.format(dateApiQuery) +
        "&endDate=" + currentEndDate.format(dateApiQuery)
    ).done(function (data) {
        if (data && data.length) {
            $("#no-results-row").hide();

            for (i in data) {
                currentOriginResults.addTrain(createTrainElement(data[i]));
            }
        } else {
            $("#no-results-row").show();
        }
    }).complete(function () {
        $(".progress").hide();
    }).fail(function () {
        $("#error-row").show();
    });
}

function getOriginByStanox(from, startDate, endDate) {
    currentMode = scheduleResultsMode.Origin;
    if (from) {
        currentStanox = from;
        listStation(currentStanox.Stanox);
    }
    currentToStanox = null;    
    currentStartDate = startDate;
    currentEndDate = endDate;
    clear();
    setTitle("Trains starting at ");
    setTimeLinks();

    $.getJSON("http://" + server + ":" + apiPort + "/TrainMovement/StartingAtStation/" + currentStanox.Stanox +
        "?startDate=" + currentStartDate.format(dateApiQuery) +
        "&endDate=" + currentEndDate.format(dateApiQuery)
    ).done(function (data) {
        if (data && data.length) {
            $("#no-results-row").hide();

            for (i in data) {
                currentOriginResults.addTrain(createTrainElement(data[i]));
            }
        } else {
            $("#no-results-row").show();
        }
    }).complete(function () {
        $(".progress").hide();
    }).fail(function () {
        $("#error-row").show();
    });
}

function getCallingAtStanox(at, startDate, endDate) {
    currentMode = scheduleResultsMode.CallingAt;
    if (at) {
        currentStanox = at;
        listStation(currentStanox.Stanox);
    }
    currentToStanox = null;    
    currentStartDate = startDate;
    currentEndDate = endDate;
    clear();
    setTitle("Trains calling at ");
    setTimeLinks();

    $.getJSON("http://" + server + ":" + apiPort + "/TrainMovement/CallingAtStation/" + currentStanox.Stanox +
        "?startDate=" + currentStartDate.format(dateApiQuery) +
        "&endDate=" + currentEndDate.format(dateApiQuery)
    ).done(function (data) {
        if (data && data.length) {
            $("#no-results-row").hide();

            for (i in data) {
                currentCallingAtResults.addTrain(createTrainElement(data[i]));
            }
        } else {
            $("#no-results-row").show();
        }
    }).complete(function () {
        $(".progress").hide();
    }).fail(function () {
        $("#error-row").show();
    });
}

function getCallingBetweenByStanox(from, to, startDate, endDate) {
    currentMode = scheduleResultsMode.Between;
    if (from) {
        currentStanox = from;
        listStation(currentStanox.Stanox);
    }
    if (to) {
        currentToStanox = to;
    }    
    currentStartDate = startDate;
    currentEndDate = endDate;
    clear();
    setTitle("Trains from ");
    setTimeLinks();

    $.getJSON("http://" + server + ":" + apiPort + "/TrainMovement/" + currentStanox.Stanox + "/" + currentToStanox.Stanox +
        "?startDate=" + currentStartDate.format(dateApiQuery) +
        "&endDate=" + currentEndDate.format(dateApiQuery)
    ).done(function (data) {
        if (data && data.length) {
            $("#no-results-row").hide();

            for (i in data) {
                currentCallingAtResults.addTrain(createTrainElement(data[i]));
            }
        } else {
            $("#no-results-row").show();
        }
    }).complete(function () {
        $(".progress").hide();
    }).fail(function () {
        $("#error-row").show();
    });
}

function createTrainElement(data) {
    var train = ko.mapping.fromJS(data);
    if (data.SchedOriginDeparture) {
        train.SchedOriginDeparture(moment(data.SchedOriginDeparture).format(dateUrlFormat));
    }
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
    train.ExpectedDestinationArrival = data.DestExpectedArrival ? data.DestExpectedArrival : "";
    train.ActualDestinationArrival = data.DestActualArrival ? moment(data.DestActualArrival).format(timeFormat) : "";
    return train;
}

function previousDate() {
    preAjax();
    var startDate = moment(currentStartDate).subtract('hours', 2);
    var endDate = moment(currentEndDate).subtract('hours', 2);
    switch (currentMode) {
        case scheduleResultsMode.Origin:
            getOriginByStanox(null, startDate, endDate);
            break;
        case scheduleResultsMode.Terminate:
            getDestinationByStanox(null, startDate, endDate);
            break;
        case scheduleResultsMode.CallingAt:
            getCallingAtStanox(null, startDate, endDate);
            break;
        case scheduleResultsMode.Between:
            getCallingBetweenByStanox(null, null, startDate, endDate);
            break;
    }
}

function nextDate() {
    preAjax();
    var startDate = moment(currentStartDate).add('hours', 2);
    var endDate = moment(currentEndDate).add('hours', 2);
    switch (currentMode) {
        case scheduleResultsMode.Origin:
            getOriginByStanox(null, startDate, endDate);
            break;
        case scheduleResultsMode.Terminate:
            getDestinationByStanox(null, startDate, endDate);
            break;
        case scheduleResultsMode.CallingAt:
            getCallingAtStanox(null, startDate, endDate);
            break;
        case scheduleResultsMode.Between:
            getCallingBetweenByStanox(null, null, startDate, endDate);
            break;
    }
}

function clear() {
    currentOriginResults.clearTrains();
    currentCallingAtResults.clearTrains();
}

function setTitle(start) {
    var title = start;
    if (currentStanox) {
        title += currentStanox.Description.toLowerCase();
    }
    if (currentToStanox) {
        if (currentStanox) {
            title += " to ";
        }
        title += currentToStanox.Description.toLowerCase();
    }
    title += " on " + currentStartDate.format(titleFormat) + " " + currentStartDate.format(timeTitleFormat) + " - " + currentEndDate.format(timeTitleFormat);
    titleModel.setTitle(title);
}

function setTimeLinks() {
    var minusDate = moment(currentStartDate).subtract('hours', 2);
    var plusDate = moment(currentEndDate).add('hours', 2);
    var url = "";
    switch (currentMode) {
        case scheduleResultsMode.Origin:
            if (currentStanox.CRS) {
                url = "from/" + currentStanox.CRS;
            } else {
                url = "from/" + currentStanox.Stanox;
            }
            break;
        case scheduleResultsMode.Terminate:
            if (currentToStanox.CRS) {
                url = "to/" + currentToStanox.CRS;
            } else {
                url = "to/" + currentToStanox.Stanox;
            }
            break;
        case scheduleResultsMode.CallingAt:
            if (currentStanox.CRS) {
                url = "at/" + currentStanox.CRS;
            } else {
                url = "at/" + currentStanox.Stanox;
            }
            break;
        case scheduleResultsMode.Between:
            if (currentStanox.CRS && currentToStanox.CRS) {
                url = "from/" + currentStanox.CRS + "/to/" + currentToStanox.CRS;
            } else {
                url = "from/" + currentStanox.Stanox + "/to/" + currentToStanox.Stanox;
            }
            break;
    }

    $("#neg-2hrs").attr("href", "search/" + url + minusDate.format("/YYYY/MM/DD/HH-mm"));
    $("#plus-2hrs").attr("href", "search/" + url + plusDate.format("/YYYY/MM/DD/HH-mm"));

    setHash(url, moment(currentStartDate).add('hours', 2).format("YYYY-MM-DD/HH-mm"), true);
}

function preLoadStationsCallback(results) {
    var commands = [];
    commands.push('from/');
    for (i in results) {
        commands.push('from/' + results[i].Name);
        commands.push('from/' + results[i].CRS);
    }
    commands.push('at/');
    for (i in results) {
        commands.push('at/' + results[i].Name);
        commands.push('at/' + results[i].CRS);
    }
    commands.push('to/');
    for (i in results) {
        commands.push('to/' + results[i].Name);
        commands.push('to/' + results[i].CRS);
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
        hash += "/" + dateHash;
    }
    document.location.hash = hash;
    if (!dontLoad) {
        loadHashCommand();
    }
    setCommand(hash);
}