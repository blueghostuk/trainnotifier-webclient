/// <reference path="tsModels.ts" />
/// <reference path="../typings/knockout.mapping/knockout.mapping.d.ts" />
/// <reference path="webApi.ts" />
/// <reference path="global.ts" />
/// <reference path="ViewModels.ts" />
/// <reference path="../typings/moment/moment.d.ts" />
/// <reference path="../typings/knockout/knockout.d.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />

var titleModel = new TitleViewModel();

var startingAtSearchResults = ko.observableArray();
var callingAtSearchResults = ko.observableArray();
var currentLocation = new TrainNotifier.KnockoutModels.CurrentLocation();

var currentStanox: IStationTiploc;
var currentToStanox: IStationTiploc;
var currentStartDate: Moment = null;
var currentEndDate: Moment = null;
var currentMode;

var thisPage: IPage = {
    setCommand: function (command) {
        $("#global-search-box").val(command);
    },
    parseCommand: function () {
        var cmdString = this.getCommand();
        var idx = cmdString.indexOf("/");
        if (idx == -1)
            return false;

        var cmd = cmdString.substring(0, idx);
        var args = cmdString.substring(idx + 1).split('/');

        $("#commandOptions > li.active").removeClass("active");
        var convertFromCrs = args[0].length == 3;

        switch (cmd) {
            case 'from':
                if (args.length >= 3 && args[1] == "to") {
                    getCallingBetween(args[0], args[2], convertFromCrs, getDateTime(args.slice(3, 5)), (args.length <= 5 ? null : getDateTime(args.slice(3, 4).concat(args.slice(5, 7)))));
                    return true;
                } else {
                    getOrigin(args[0], convertFromCrs, getDateTime(args.slice(1, 3)), (args.length <= 3 ? null : getDateTime(args.slice(1, 2).concat(args.slice(3, 5)))));
                    return true;
                }
                break;
            case 'to':
                getDestination(args[0], convertFromCrs, getDateTime(args.slice(1, 3)), (args.length <= 3 ? null : getDateTime(args.slice(1, 2).concat(args.slice(3, 5)))));
                return true;
                break;
            case 'at':
                getStation(args[0], convertFromCrs, getDateTime(args.slice(1, 3)), (args.length <= 3 ? null : getDateTime(args.slice(1, 2).concat(args.slice(3, 5)))));
                return true;
                break;
        }

        return false;
    },
    getCommand: function () {
        return $("#global-search-box").val();
    }
};

TrainNotifier.Common.page = thisPage;
var webApi: IWebApi;

$(function () {
    webApi = new TrainNotifier.WebApi();
    TrainNotifier.Common.webApi = webApi;

    ko.applyBindings(currentLocation, $("#stationDetails").get(0));
    //ko.applyBindings(currentOriginResults, $("#origin-search-results").get(0));
    //ko.applyBindings(currentCallingAtResults, $("#callingAt-search-results").get(0));
    ko.applyBindings(titleModel, $("#title").get(0));

    ko.applyBindings(startingAtSearchResults, $("#starting-at-search-results").get(0));
    ko.applyBindings(callingAtSearchResults, $("#calling-at-search-results").get(0));

    loadHashCommand();
});

function getDateTime(args) {
    if (args.length > 0) {
        if (args.length == 2) {
            return moment(args.join('/'), TrainNotifier.DateTimeFormats.dateTimeHashFormat);
        } else if (args[0] && args[0].length > 0) {
            return moment(args[0], TrainNotifier.DateTimeFormats.dateQueryFormat);
        }
    }
    return moment();
}

function preAjax() {
    $(".progress").show();
    $("#error-row").hide();
    $("#no-results-row").hide();
}

function getCallingBetween(from, to, convertFromCrs, fromDate, toDate) {
    $("#commandOptions > li#from-to" + (convertFromCrs ? "-crs" : "")).addClass("active");
    if (toDate) {
        var startDate = fromDate;
        var endDate = toDate;
    } else {
        var startDate = moment(fromDate).subtract({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
        var endDate = moment(fromDate).add({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
    }
    if (endDate.isBefore(startDate)) {
        endDate.add('days', 1);
    }

    var hash = "from/" + from + "/to/" + to;
    var fromQuery, toQuery: JQueryPromise;
    if (convertFromCrs) {
        fromQuery = webApi.getStanoxByCrsCode(from);
        toQuery = webApi.getStanoxByCrsCode(to);
    } else {
        fromQuery = webApi.getStanox(from);
        toQuery = webApi.getStanox(to);
    }

    setHash(hash, null, true);
    preAjax();
    $.when(fromQuery, toQuery).done(function (from, to) {
        getCallingBetweenByStanox(from[0], to[0], startDate, endDate);
    }).fail(function () {
        $(".progress").hide();
        $("#error-row").show();
    });
}

function getDestination(crs, convertFromCrs, fromDate, toDate) {
    $("#commandOptions > li#to" + (convertFromCrs ? "-crs" : "")).addClass("active");
    if (toDate) {
        var startDate = fromDate;
        var endDate = toDate;
    } else {
        var startDate = moment(fromDate).subtract({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
        var endDate = moment(fromDate).add({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
    }
    if (endDate.isBefore(startDate)) {
        endDate.add('days', 1);
    }
    var hash = "to/" + crs;
    var query: JQueryPromise;
    setHash(hash, null, true);
    preAjax();

    if (convertFromCrs) {
        query = webApi.getStanoxByCrsCode(crs);
    } else {
        query = webApi.getStanox(crs);
    }
    query.done(function (from) {
        getDestinationByStanox(from, startDate, endDate);
    }).fail(function () {
        $(".progress").hide();
        $("#error-row").show();
    });
}

function getOrigin(crs: string, convertFromCrs: bool, fromDate: Moment, toDate: Moment) {
    $("#commandOptions > li#from" + (convertFromCrs ? "-crs" : "")).addClass("active");
    if (toDate) {
        var startDate = fromDate;
        var endDate = toDate;
    } else {
        var startDate = moment(fromDate).subtract({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
        var endDate = moment(fromDate).add({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
    }
    if (endDate.isBefore(startDate)) {
        endDate.add('days', 1);
    }
    var hash = "from/" + crs;
    var query: JQueryPromise;
    setHash(hash, null, true);
    preAjax();
    if (convertFromCrs) {
        query = webApi.getStanoxByCrsCode(crs);
    } else {
        query = webApi.getStanox(crs);
    }
    query.done(function (from: IStationTiploc) {
        getOriginByStanox(from, startDate, endDate);
    }).fail(function () {
        $(".progress").hide();
        $("#error-row").show();
    });
}

function getStation(crs, convertFromCrs, fromDate, toDate) {
    $("#commandOptions > li#at" + (convertFromCrs ? "-crs" : "")).addClass("active");
    if (toDate) {
        var startDate = fromDate;
        var endDate = toDate;
    } else {
        var startDate = moment(fromDate).subtract({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
        var endDate = moment(fromDate).add({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
    }
    if (endDate.isBefore(startDate)) {
        endDate.add('days', 1);
    }
    var hash = "at/" + crs;
    var query: JQueryPromise;
    setHash(hash, null, true);
    preAjax();

    if (convertFromCrs) {
        query = webApi.getStanoxByCrsCode(crs);
    } else {
        query = webApi.getStanox(crs);
    }
    query.done(function (at) {
        getCallingAtStanox(at, startDate, endDate);
    }).fail(function () {
        $(".progress").hide();
        $("#error-row").show();
    });
}

function getDestinationByStanox(to, startDate, endDate) {
    currentMode = scheduleResultsMode.Terminate;
    if (to) {
        currentToStanox = to;
        listStation(currentToStanox);
    }
    currentStanox = null;
    currentStartDate = startDate;
    currentEndDate = endDate;
    clear();

    setTitle("Trains terminating at ");
    setTimeLinks();

    webApi.getTrainMovementsTerminatingAtLocation(currentToStanox.Stanox,
        currentStartDate.format(TrainNotifier.DateTimeFormats.dateTimeApiFormat),
        currentEndDate.format(TrainNotifier.DateTimeFormats.dateTimeApiFormat))
        .done(function (data) {
            if (data && data.Movements.length > 0) {
                $("#no-results-row").hide();

                for (var i = 0; i < data.Movements.length; i++) {
                    //currentOriginResults.addTrain(createTrainElement(data.Movements[i], data.Tiplocs));
                }
            } else {
                $("#no-results-row").show();
            }
        }).always(function () {
            $(".progress").hide();
        }).fail(function () {
            $("#error-row").show();
        });
}

function getOriginByStanox(from: IStationTiploc, startDate: Moment, endDate: Moment) {
    currentMode = scheduleResultsMode.Origin;
    if (from) {
        currentStanox = from;
        listStation(currentStanox);
    }
    currentToStanox = null;
    currentStartDate = startDate;
    currentEndDate = endDate;
    clear();
    setTitle("Trains starting at " + currentStanox.Description);
    setTimeLinks();

    var query: JQueryPromise;
    var startDateQuery = currentStartDate.format(TrainNotifier.DateTimeFormats.dateTimeApiFormat);
    var endDateQuery = currentEndDate.format(TrainNotifier.DateTimeFormats.dateTimeApiFormat)
    if (currentStanox.CRS && currentStanox.CRS.length == 3) {
        query = webApi.getTrainMovementsStartingAtStation(
            currentStanox.CRS,
            startDateQuery,
            endDateQuery);
    } else {
        query = webApi.getTrainMovementsStartingAtLocation(
            currentStanox.Stanox,
            startDateQuery,
            endDateQuery);
    }
    query.done(function (data: ITrainMovementResults) {
        if (data && data.Movements.length > 0) {
            $("#no-results-row").hide();

            var viewModels: TrainNotifier.KnockoutModels.StartingAtTrainMovement[] = data.Movements.map(function (movement: ITrainMovementResult) {
                return new TrainNotifier.KnockoutModels.StartingAtTrainMovement(movement, data.Tiplocs);
            });

            for (var i = 0; i < viewModels.length; i++) {
                startingAtSearchResults.push(viewModels[i]);
            }
        } else {
            $("#no-results-row").show();
        }
    }).always(function () {
        $(".progress").hide();
    }).fail(function () {
        $("#error-row").show();
    });
}

function getCallingAtStanox(at: IStationTiploc, startDate, endDate) {
    currentMode = scheduleResultsMode.CallingAt;
    if (at) {
        currentStanox = at;
        listStation(currentStanox);
    }
    currentToStanox = null;
    currentStartDate = startDate;
    currentEndDate = endDate;
    clear();
    setTitle("Trains calling at " + currentStanox.Description);
    setTimeLinks();

    var query: JQueryPromise;
    var startDateQuery = currentStartDate.format(TrainNotifier.DateTimeFormats.dateTimeApiFormat);
    var endDateQuery = currentEndDate.format(TrainNotifier.DateTimeFormats.dateTimeApiFormat)
    if (currentStanox.CRS && currentStanox.CRS.length == 3) {
        query = webApi.getTrainMovementsCallingAtStation(
            currentStanox.CRS,
            startDateQuery,
            endDateQuery);
    } else {
        query = webApi.getTrainMovementsCallingAtLocation(
            currentStanox.Stanox,
            startDateQuery,
            endDateQuery);
    }

    query.done(function (data: ITrainMovementResults) {
        if (data && data.Movements.length > 0) {
            $("#no-results-row").hide();

            var viewModels: TrainNotifier.KnockoutModels.CallingAtTrainMovement[] = data.Movements.map(function (movement: ITrainMovementResult) {
                return new TrainNotifier.KnockoutModels.CallingAtTrainMovement(movement, currentStanox, data.Tiplocs);
            });

            for (var i = 0; i < viewModels.length; i++) {
                callingAtSearchResults.push(viewModels[i]);
            }
        } else {
            $("#no-results-row").show();
        }
    }).always(function () {
        $(".progress").hide();
    }).fail(function () {
        $("#error-row").show();
    });
}

function getCallingBetweenByStanox(from: IStationTiploc, to: IStationTiploc, startDate, endDate) {
    currentMode = scheduleResultsMode.Between;
    if (from) {
        currentStanox = from;
        listStation(currentStanox);
    }
    if (to) {
        currentToStanox = to;
    }
    currentStartDate = startDate;
    currentEndDate = endDate;
    clear();
    setTitle("Trains from ");
    setTimeLinks();

    webApi.getTrainMovementsBetweenLocations(currentStanox.Stanox,
        currentToStanox.Stanox,
        currentStartDate.format(TrainNotifier.DateTimeFormats.dateTimeApiFormat),
        currentEndDate.format(TrainNotifier.DateTimeFormats.dateTimeApiFormat))
        .done(function (data) {
            if (data && data.Movements.length > 0) {
                $("#no-results-row").hide();

                for (var i = 0; i < data.Movements.length; i++) {
                    //currentCallingAtResults.addTrain(createTrainElement(data.Movements[i], data.Tiplocs));
                }
            } else {
                $("#no-results-row").show();
            }
        }).always(function () {
            $(".progress").hide();
        }).fail(function () {
            $("#error-row").show();
        });
}

function createTrainElement(data: ITrainMovementResult, tiplocs: IStationTiploc[]) {
    /*if (data.Origin) {
        data.Origin.PublicArrival = TrainNotifier.DateTimeFormats.formatTimeString(
            data.Origin.PublicArrival);
        data.Origin.Arrival = TrainNotifier.DateTimeFormats.formatTimeString(
            data.Origin.Arrival);
        data.Origin.PublicDeparture = TrainNotifier.DateTimeFormats.formatTimeString(
            data.Origin.PublicDeparture);
        data.Origin.Departure = TrainNotifier.DateTimeFormats.formatTimeString(
            data.Origin.Departure);
    }
    if (data.Destination) {
        data.Destination.PublicArrival = TrainNotifier.DateTimeFormats.formatTimeString(
            data.Destination.PublicArrival);
        data.Destination.Arrival = TrainNotifier.DateTimeFormats.formatTimeString(
            data.Destination.Arrival);
        data.Destination.PublicDeparture = TrainNotifier.DateTimeFormats.formatTimeString(
                data.Origin.PublicDeparture);
        data.Destination.Departure = TrainNotifier.DateTimeFormats.formatTimeString(
                data.Origin.Departure);
    }

    var train = ko.mapping.fromJS(data);
    if (data.SchedOriginDeparture) {
        train.SchedOriginDeparture(moment(data.SchedOriginDeparture).format(TrainNotifier.DateTimeFormats.dateUrlFormat));
    }
    train.Tooltip = "";
    if (data.Cancellation) {
        train.Tooltip = "Train Cancelled " + data.Cancellation.Type + " at ";
        if (data.Cancellation.CancelledAt) {
            train.Tooltip += data.Cancellation.CancelledAt.Description;
        } else {
            train.Tooltip += data.Cancellation.CancelledStanox;
        }
        train.Tooltip += " @ " + moment(data.Cancellation.CancelledTimestamp).format(TrainNotifier.DateTimeFormats.timeFormat) + " - Reason : ";
        if (data.Cancellation.Description) {
            train.Tooltip += data.Cancellation.Description;
        }
        train.Tooltip += " (" + data.Cancellation.ReasonCode + ")";
    }
    if (data.ChangeOfOrigin) {
        train.Tooltip += "Will start from " + data.ChangeOfOrigin.NewOrigin.Description
            + " @ " + moment(data.ChangeOfOrigin.NewDepartureTime).format(TrainNotifier.DateTimeFormats.timeFormat);
        if (data.ChangeOfOrigin.ReasonCode) {
            train.Tooltip += " (" + data.ChangeOfOrigin.ReasonCode + ": " + data.ChangeOfOrigin.Description + ")";
        }
    }
    if (data.Reinstatement) {
        train.Tooltip += "\r\n Train Reinstated from " + data.Reinstatement.NewOrigin.Description + " @ "
            + moment(data.Reinstatement.PlannedDepartureTime).format(TrainNotifier.DateTimeFormats.timeFormat);
    }
    train.ActualArrival = "";
    if (data.ActualArrival) {
        train.ActualArrival = TrainNotifier.DateTimeFormats.formatTimeString(
            moment(data.ActualArrival).format(TrainNotifier.DateTimeFormats.timeFormat));
    }
    train.ActualDeparture = "";
    if (data.ActualDeparture) {
        train.ActualDeparture = TrainNotifier.DateTimeFormats.formatTimeString(
            moment(data.ActualDeparture).format(TrainNotifier.DateTimeFormats.timeFormat));
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
    train.ActualDestinationArrival = data.DestActualArrival ? moment(data.DestActualArrival).format(TrainNotifier.DateTimeFormats.timeFormat) : "";
    return train;*/
}

function previousDate() {
    preAjax();
    var startDate = moment(currentStartDate).subtract({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
    var endDate = moment(currentEndDate).subtract({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
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
    var startDate = moment(currentStartDate).add({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
    var endDate = moment(currentEndDate).add({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
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
    //currentOriginResults.clearTrains();
    //currentCallingAtResults.clearTrains();
    startingAtSearchResults.removeAll();
    callingAtSearchResults.removeAll();
}

function setTitle(start: string) {
    var title = start;
    if (currentStanox) {
        var from = currentStanox.Description.toLowerCase();
        title += from;
        titleModel.From(from);
    } else {
        titleModel.From(null);
    }
    if (currentToStanox) {
        var to = currentToStanox.Description.toLowerCase();
        if (currentStanox) {
            title += " to ";
            titleModel.To(to);
        } else {
            titleModel.From(to);
            titleModel.To(null);
        }
        title += currentToStanox.Description.toLowerCase();
    }
    title += " on ";
    var date = currentStartDate.format(TrainNotifier.DateTimeFormats.dateTitleFormat) + " "
        + currentStartDate.format(TrainNotifier.DateTimeFormats.shortTimeFormat) + " - "
        + currentEndDate.format(TrainNotifier.DateTimeFormats.shortTimeFormat);
    title += date;
    titleModel.DateRange(date);
    titleModel.setTitle(title);
}

function setTimeLinks() {
    var minusStartDate = moment(currentStartDate).subtract({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
    var plusStartDate = moment(currentStartDate).add({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
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

    $(".neg-hrs").attr("href", "search/" + url + minusStartDate.format("/YYYY/MM/DD/HH-mm"));
    $(".plus-hrs").attr("href", "search/" + url + plusStartDate.format("/YYYY/MM/DD/HH-mm"));

    setHash(url, moment(currentStartDate).format("YYYY-MM-DD/HH-mm") + moment(currentEndDate).format("/HH-mm"), true);
}

function listStation(stanox: IStationTiploc) {
    currentLocation.update(stanox);
}

function loadHashCommand() {
    if (document.location.hash.length > 0) {
        thisPage.setCommand(document.location.hash.substr(1));
        thisPage.parseCommand();
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
    thisPage.setCommand(hash);
}