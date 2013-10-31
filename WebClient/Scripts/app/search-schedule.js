/// <reference path="../typings/jquery.cookie/jquery.cookie.d.ts" />
/// <reference path="../typings/moment/moment.d.ts" />
/// <reference path="../typings/knockout/knockout.d.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="searchModels.ts" />
/// <reference path="webApi.ts" />
/// <reference path="global.ts" />
var titleModel = new TrainNotifier.KnockoutModels.Search.TitleViewModel();

var startEndSearchResults = ko.observableArray();
var callingAtSearchResults = ko.observableArray();
var callingBetweenSearchResults = new TrainNotifier.KnockoutModels.Search.CallingBetweenResults();
var nearestSearchResults = ko.observableArray();

var currentStanox;
var currentToStanox;
var currentStartDate = null;
var currentEndDate = null;
var currentMode = null;

var thisPage = {
    settingHash: false,
    setCommand: function (command) {
        $("#global-search-box").val(command);
    },
    parseCommand: function () {
        var cmdString = thisPage.getCommand();
        cmdString = cmdString.replace("!", "");
        var idx = cmdString.indexOf("/");
        if (idx == -1)
            return false;

        var cmd = cmdString.substring(0, idx);
        var args = cmdString.substring(idx + 1).split('/');

        $("#commandOptions > a.active").removeClass("active");
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

            case 'at':
                getStation(args[0], convertFromCrs, getDateTime(args.slice(1, 3)), (args.length <= 3 ? null : getDateTime(args.slice(1, 2).concat(args.slice(3, 5)))));
                return true;

            case 'nearest':
                getNearest(+args[0], +args[1]);
                return true;
        }

        return false;
    },
    getCommand: function () {
        return $("#global-search-box").val();
    },
    advancedMode: false,
    advancedSwitch: function (change) {
        if (typeof change === "undefined") { change = true; }
        if (change) {
            this.advancedMode = !this.advancedMode;
            $.cookie("advancedMode", this.advancedMode ? "on" : "off", { expires: 365 });
        }
        if (this.advancedMode) {
            $("#advancedSwitch").html("Simple");

            $(".toc-ZZ, .cat-EE, .passing").show();
            $(".cat-ee").show();
        } else {
            $("#advancedSwitch").html("Advanced");

            $(".toc-ZZ, .cat-EE, .passing").hide();
        }
    }
};

TrainNotifier.Common.page = thisPage;
var webApi;

$(function () {
    $("#advancedSwitch").click(function (e) {
        e.preventDefault();
        thisPage.advancedSwitch();
    });
    var advancedCookie = $.cookie("advancedMode");
    if (advancedCookie && advancedCookie == "on") {
        thisPage.advancedMode = true;
        thisPage.advancedSwitch(false);
    }
    webApi = new TrainNotifier.WebApi();
    TrainNotifier.Common.webApi = webApi;

    ko.applyBindings(titleModel, $("#title").get(0));

    ko.applyBindings(startEndSearchResults, $("#start-end-at-search-results").get(0));
    ko.applyBindings(callingAtSearchResults, $("#calling-at-search-results").get(0));
    ko.applyBindings(callingBetweenSearchResults, $("#calling-between-search-results").get(0));
    ko.applyBindings(nearestSearchResults, $("#nearest-search-results").get(0));

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

function getNearest(lat, lon) {
    preAjax();

    clear();
    $(".pager").hide();
    setTitle("Nearest Trains");

    webApi.getTrainMovementsNearLocation(lat, lon, 10).done(function (data) {
        if (data && data.Movements.length > 0) {
            $("#no-results-row").hide();

            var viewModels = data.Movements.map(function (movement) {
                var actualStops = movement.Actual.Stops.filter(function (element) {
                    return element.ActualTimestamp != null;
                });
                var lastStanox = actualStops[actualStops.length - 1].TiplocStanoxCode;
                var lastTiploc = TrainNotifier.StationTiploc.findStationTiploc(lastStanox, data.Tiplocs);
                return new TrainNotifier.KnockoutModels.Search.NearestTrainMovement(movement, lastTiploc, data.Tiplocs, currentStartDate);
            });

            for (var i = 0; i < viewModels.length; i++) {
                nearestSearchResults.push(viewModels[i]);
            }
        } else {
            $("#no-results-row").show();
        }
    }).always(function () {
        hide($(".progress"));
        thisPage.advancedSwitch(false);
    }).fail(function () {
        show($("#error-row"));
    });
}

function getCallingBetween(from, to, convertFromCrs, fromDate, toDate) {
    $("#commandOptions > a#from-to" + (convertFromCrs ? "-crs" : "")).addClass("active");
    var startDate;
    var endDate;
    if (toDate) {
        startDate = fromDate;
        endDate = toDate;
    } else {
        startDate = moment(fromDate).subtract({ minutes: TrainNotifier.DateTimeFormats.timeFrameMinutesBefore });
        endDate = moment(fromDate).add({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
    }
    if (endDate.isBefore(startDate)) {
        endDate.add('days', 1);
    }

    var hash = "from/" + from + "/to/" + to;
    var fromQuery, toQuery;
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
        hide($(".progress"));
        show($("#error-row"));
    });
}

function getDestination(crs, convertFromCrs, fromDate, toDate) {
    $("#commandOptions > a#to" + (convertFromCrs ? "-crs" : "")).addClass("active");
    var startDate;
    var endDate;
    if (toDate) {
        startDate = fromDate;
        endDate = toDate;
    } else {
        startDate = moment(fromDate).subtract({ minutes: TrainNotifier.DateTimeFormats.timeFrameMinutesBefore });
        endDate = moment(fromDate).add({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
    }
    if (endDate.isBefore(startDate)) {
        endDate.add('days', 1);
    }
    var hash = "to/" + crs;
    var query;
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
        hide($(".progress"));
        show($("#error-row"));
    });
}

function getOrigin(crs, convertFromCrs, fromDate, toDate) {
    $("#commandOptions > a#from" + (convertFromCrs ? "-crs" : "")).addClass("active");
    var startDate;
    var endDate;
    if (toDate) {
        startDate = fromDate;
        endDate = toDate;
    } else {
        startDate = moment(fromDate).subtract({ minutes: TrainNotifier.DateTimeFormats.timeFrameMinutesBefore });
        endDate = moment(fromDate).add({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
    }
    if (endDate.isBefore(startDate)) {
        endDate.add('days', 1);
    }
    var hash = "from/" + crs;
    var query;
    setHash(hash, null, true);
    preAjax();
    if (convertFromCrs) {
        query = webApi.getStanoxByCrsCode(crs);
    } else {
        query = webApi.getStanox(crs);
    }
    query.done(function (from) {
        getOriginByStanox(from, startDate, endDate);
    }).fail(function () {
        hide($(".progress"));
        show($("#error-row"));
    });
}

function getStation(crs, convertFromCrs, fromDate, toDate) {
    $("#commandOptions > a#at" + (convertFromCrs ? "-crs" : "")).addClass("active");
    var startDate;
    var endDate;
    if (toDate) {
        startDate = fromDate;
        endDate = toDate;
    } else {
        startDate = moment(fromDate).subtract({ minutes: TrainNotifier.DateTimeFormats.timeFrameMinutesBefore });
        endDate = moment(fromDate).add({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
    }
    if (endDate.isBefore(startDate)) {
        endDate.add('days', 1);
    }
    var hash = "at/" + crs;
    var query;
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
        hide($(".progress"));
        show($("#error-row"));
    });
}

function getDestinationByStanox(to, startDate, endDate) {
    currentMode = TrainNotifier.Search.SearchMode.terminate;
    if (to) {
        currentToStanox = to;
    }
    currentStanox = null;
    currentStartDate = startDate;
    currentEndDate = endDate;
    clear();

    setTitle("Trains terminating at " + currentToStanox.Description);
    setTimeLinks();

    var query;
    var startDateQuery = currentStartDate.format(TrainNotifier.DateTimeFormats.dateTimeApiFormat);
    var endDateQuery = currentEndDate.format(TrainNotifier.DateTimeFormats.dateTimeApiFormat);
    if (currentToStanox.CRS && currentToStanox.CRS.length == 3) {
        query = webApi.getTrainMovementsTerminatingAtStation(currentToStanox.CRS, startDateQuery, endDateQuery);
    } else {
        query = webApi.getTrainMovementsTerminatingAtLocation(currentToStanox.Stanox, startDateQuery, endDateQuery);
    }

    query.done(function (data) {
        if (data && data.Movements.length > 0) {
            var viewModels = data.Movements.map(function (movement) {
                return new TrainNotifier.KnockoutModels.Search.TerminatingAtTrainMovement(movement, data.Tiplocs, currentStartDate);
            });

            for (var i = 0; i < viewModels.length; i++) {
                startEndSearchResults.push(viewModels[i]);
            }
        } else {
            show($("#no-results-row"));
        }
    }).always(function () {
        hide($(".progress"));
        thisPage.advancedSwitch(false);
    }).fail(function () {
        show($("#error-row"));
    });
}

function getOriginByStanox(from, startDate, endDate) {
    currentMode = TrainNotifier.Search.SearchMode.origin;
    if (from) {
        currentStanox = from;
    }
    currentToStanox = null;
    currentStartDate = startDate;
    currentEndDate = endDate;
    clear();
    setTitle("Trains starting at " + currentStanox.Description);
    setTimeLinks();

    var query;
    var startDateQuery = currentStartDate.format(TrainNotifier.DateTimeFormats.dateTimeApiFormat);
    var endDateQuery = currentEndDate.format(TrainNotifier.DateTimeFormats.dateTimeApiFormat);
    if (currentStanox.CRS && currentStanox.CRS.length == 3) {
        query = webApi.getTrainMovementsStartingAtStation(currentStanox.CRS, startDateQuery, endDateQuery);
    } else {
        query = webApi.getTrainMovementsStartingAtLocation(currentStanox.Stanox, startDateQuery, endDateQuery);
    }
    query.done(function (data) {
        if (data && data.Movements.length > 0) {
            var viewModels = data.Movements.map(function (movement) {
                return new TrainNotifier.KnockoutModels.Search.StartingAtTrainMovement(movement, data.Tiplocs, currentStartDate);
            });

            for (var i = 0; i < viewModels.length; i++) {
                startEndSearchResults.push(viewModels[i]);
            }
        } else {
            show($("#no-results-row"));
        }
    }).always(function () {
        hide($(".progress"));
        thisPage.advancedSwitch(false);
    }).fail(function () {
        show($("#error-row"));
    });
}

function getCallingAtStanox(at, startDate, endDate) {
    currentMode = TrainNotifier.Search.SearchMode.callingAt;
    if (at) {
        currentStanox = at;
    }
    currentToStanox = null;
    currentStartDate = startDate;
    currentEndDate = endDate;
    clear();
    setTitle("Trains calling at " + currentStanox.Description);
    setTimeLinks();

    var query;
    var startDateQuery = currentStartDate.format(TrainNotifier.DateTimeFormats.dateTimeApiFormat);
    var endDateQuery = currentEndDate.format(TrainNotifier.DateTimeFormats.dateTimeApiFormat);
    if (currentStanox.CRS && currentStanox.CRS.length == 3) {
        query = webApi.getTrainMovementsCallingAtStation(currentStanox.CRS, startDateQuery, endDateQuery);
    } else {
        query = webApi.getTrainMovementsCallingAtLocation(currentStanox.Stanox, startDateQuery, endDateQuery);
    }

    query.done(function (data) {
        if (data && data.Movements.length > 0) {
            var viewModels = data.Movements.map(function (movement) {
                return new TrainNotifier.KnockoutModels.Search.CallingAtTrainMovement(movement, currentStanox, data.Tiplocs, currentStartDate);
            });

            for (var i = 0; i < viewModels.length; i++) {
                callingAtSearchResults.push(viewModels[i]);
            }
        } else {
            show($("#no-results-row"));
        }
    }).always(function () {
        hide($(".progress"));
        thisPage.advancedSwitch(false);
    }).fail(function () {
        show($("#error-row"));
    });
}

function getCallingBetweenByStanox(from, to, startDate, endDate) {
    currentMode = TrainNotifier.Search.SearchMode.between;
    if (from) {
        currentStanox = from;
    }
    if (to) {
        currentToStanox = to;
    }
    currentStartDate = startDate;
    currentEndDate = endDate;
    clear();
    setTitle("Trains from " + currentStanox.Description + " to " + currentToStanox.Description);
    callingBetweenSearchResults.fromStation(currentStanox.Description.toLowerCase());
    callingBetweenSearchResults.fromShortStation(currentStanox.CRS ? currentStanox.CRS : "");
    callingBetweenSearchResults.toStation(currentToStanox.Description.toLowerCase());
    callingBetweenSearchResults.toShortStation(currentToStanox.CRS ? currentToStanox.CRS : "");
    setTimeLinks();

    var query;
    var startDateQuery = currentStartDate.format(TrainNotifier.DateTimeFormats.dateTimeApiFormat);
    var endDateQuery = currentEndDate.format(TrainNotifier.DateTimeFormats.dateTimeApiFormat);
    if (currentStanox.CRS && currentStanox.CRS.length == 3 && currentToStanox.CRS && currentToStanox.CRS.length == 3) {
        query = webApi.getTrainMovementsBetweenStations(currentStanox.CRS, currentToStanox.CRS, startDateQuery, endDateQuery);
    } else {
        query = webApi.getTrainMovementsBetweenLocations(currentStanox.Stanox, currentToStanox.Stanox, startDateQuery, endDateQuery);
    }

    query.done(function (data) {
        if (data && data.Movements.length > 0) {
            $("#no-results-row").hide();

            var viewModels = data.Movements.map(function (movement) {
                return new TrainNotifier.KnockoutModels.Search.CallingBetweenTrainMovement(movement, currentStanox, currentToStanox, data.Tiplocs, currentStartDate);
            });

            for (var i = 0; i < viewModels.length; i++) {
                callingBetweenSearchResults.results.push(viewModels[i]);
            }
        } else {
            $("#no-results-row").show();
        }
    }).always(function () {
        hide($(".progress"));
        thisPage.advancedSwitch(false);
    }).fail(function () {
        hide($(".progress"));
        show($("#error-row"));
    });
}

function previousDate() {
    preAjax();
    var startDate = moment(currentStartDate).subtract({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
    var endDate = moment(currentEndDate).subtract({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
    switch (currentMode) {
        case TrainNotifier.Search.SearchMode.origin:
            getOriginByStanox(null, startDate, endDate);
            break;
        case TrainNotifier.Search.SearchMode.terminate:
            getDestinationByStanox(null, startDate, endDate);
            break;
        case TrainNotifier.Search.SearchMode.callingAt:
            getCallingAtStanox(null, startDate, endDate);
            break;
        case TrainNotifier.Search.SearchMode.between:
            getCallingBetweenByStanox(null, null, startDate, endDate);
            break;
    }
}

function nextDate() {
    preAjax();
    var startDate = moment(currentStartDate).add({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
    var endDate = moment(currentEndDate).add({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
    switch (currentMode) {
        case TrainNotifier.Search.SearchMode.origin:
            getOriginByStanox(null, startDate, endDate);
            break;
        case TrainNotifier.Search.SearchMode.terminate:
            getDestinationByStanox(null, startDate, endDate);
            break;
        case TrainNotifier.Search.SearchMode.callingAt:
            getCallingAtStanox(null, startDate, endDate);
            break;
        case TrainNotifier.Search.SearchMode.between:
            getCallingBetweenByStanox(null, null, startDate, endDate);
            break;
    }
}

function clear() {
    startEndSearchResults.removeAll();
    callingAtSearchResults.removeAll();
    callingBetweenSearchResults.results.removeAll();
    nearestSearchResults.removeAll();
}

function setTitle(start) {
    var title = start;
    if (currentStanox) {
        var from = currentStanox.Description.toLowerCase();
        title += from;
        titleModel.from(from);
        switch (currentMode) {
            case TrainNotifier.Search.SearchMode.callingAt:
                titleModel.link("search/at/" + currentStanox.CRS);
                titleModel.title("Use this as a permanent link for trains calling at this location around the current time");
                break;

            case TrainNotifier.Search.SearchMode.origin:
                titleModel.link("search/from/" + currentStanox.CRS);
                titleModel.title("Use this as a permanent link for trains starting from this location around the current time");
                break;
        }
    } else {
        titleModel.from(null);
        titleModel.link(null);
        titleModel.title(null);
    }
    if (currentToStanox) {
        var to = currentToStanox.Description.toLowerCase();
        if (currentStanox) {
            title += " to ";
            titleModel.to(to);
        } else {
            titleModel.from(to);
            titleModel.to(null);
        }
        switch (currentMode) {
            case TrainNotifier.Search.SearchMode.between:
                titleModel.link("search/from/" + currentStanox.CRS + "/to/" + currentToStanox.CRS);
                titleModel.title("Use this as a permanent link for trains calling at this location around the current time");
                break;

            case TrainNotifier.Search.SearchMode.terminate:
                titleModel.link("search/to/" + currentToStanox.CRS);
                titleModel.title("Use this as a permanent link for trains terminating at this location around the current time");
                break;
        }
        title += currentToStanox.Description.toLowerCase();
    }
    if (currentStartDate && currentEndDate) {
        title += " on ";
        var date = currentStartDate.format(TrainNotifier.DateTimeFormats.dateTitleFormat) + " " + currentStartDate.format(TrainNotifier.DateTimeFormats.shortTimeFormat) + " - " + currentEndDate.format(TrainNotifier.DateTimeFormats.shortTimeFormat);
        title += date;
        titleModel.DateRange(date);
    }
    titleModel.setTitle(title);
}

function setTimeLinks() {
    var minusStartDate = moment(currentStartDate).subtract({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
    var plusStartDate = moment(currentStartDate).add({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
    var url = "";
    switch (currentMode) {
        case TrainNotifier.Search.SearchMode.origin:
            if (currentStanox.CRS) {
                url = "from/" + currentStanox.CRS;
            } else {
                url = "from/" + currentStanox.Stanox;
            }
            break;
        case TrainNotifier.Search.SearchMode.terminate:
            if (currentToStanox.CRS) {
                url = "to/" + currentToStanox.CRS;
            } else {
                url = "to/" + currentToStanox.Stanox;
            }
            break;
        case TrainNotifier.Search.SearchMode.callingAt:
            if (currentStanox.CRS) {
                url = "at/" + currentStanox.CRS;
            } else {
                url = "at/" + currentStanox.Stanox;
            }
            break;
        case TrainNotifier.Search.SearchMode.between:
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
