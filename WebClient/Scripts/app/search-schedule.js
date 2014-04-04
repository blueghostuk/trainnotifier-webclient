var searchTitleModel = new TrainNotifier.KnockoutModels.Search.TitleViewModel();

var startEndSearchResults = ko.observableArray();
var callingAtSearchResults = ko.observableArray();
var callingBetweenSearchResults = new TrainNotifier.KnockoutModels.Search.CallingBetweenResults();
var nearestSearchResults = ko.observableArray();

var currentStanox;
var currentToStanox;
var currentStartDate = null;
var currentEndDate = null;
var currentMode = null;
var currentCommand;

var thisPage = {
    settingHash: true,
    setCommand: function (command) {
        currentCommand = command;
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
                    getCallingBetweenByCrs(args[0], args[2], convertFromCrs, getDateTime(args.slice(3, 5)), (args.length <= 5 ? null : getDateTime(args.slice(3, 4).concat(args.slice(5, 7)))));
                    return true;
                } else {
                    getStartingAtByCrs(args[0], convertFromCrs, getDateTime(args.slice(1, 3)), (args.length <= 3 ? null : getDateTime(args.slice(1, 2).concat(args.slice(3, 5)))));
                    return true;
                }
                break;
            case 'to':
                getDestinationByCrs(args[0], convertFromCrs, getDateTime(args.slice(1, 3)), (args.length <= 3 ? null : getDateTime(args.slice(1, 2).concat(args.slice(3, 5)))));
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
        return currentCommand;
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

            $(".toc-ZZ, .cat-EE, .passing, .advanced-col").removeClass("hide");
            $(".simple-col").addClass("hide");
            $(".cat-ee").show();
        } else {
            $("#advancedSwitch").html("Advanced");

            $(".toc-ZZ, .cat-EE, .passing, .advanced-col").addClass("hide");
            $(".simple-col").removeClass("hide");
        }
    }
};

TrainNotifier.Common.page = thisPage;
var webApi;
var toc;

$(function () {
    (window.onpopstate = function () {
        var match, pl = /\+/g, search = /([^&=]+)=?([^&]*)/g, decode = function (s) {
            return decodeURIComponent(s.replace(pl, " "));
        }, query = window.location.hash.substring(1);

        while (match = search.exec(query)) {
            if (match[2].length > 0) {
                toc = match[2];
                if (toc == "ZZ") {
                    thisPage.advancedMode = true;
                    thisPage.advancedSwitch(false);
                }
            }
        }
    })();
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

    ko.applyBindings(searchTitleModel, $("#title").get(0));

    ko.applyBindings(startEndSearchResults, $("#start-end-at-search-results").get(0));
    ko.applyBindings(callingAtSearchResults, $("#calling-at-search-results").get(0));
    ko.applyBindings(callingBetweenSearchResults, $("#calling-between-search-results").get(0));
    ko.applyBindings(nearestSearchResults, $("#nearest-search-results").get(0));

    loadHashCommand();

    window.onhashchange = function () {
        if (!thisPage.settingHash) {
            thisPage.settingHash = true;
            thisPage.setCommand(document.location.hash.substr(1));
            thisPage.parseCommand();
        }
        thisPage.settingHash = false;
    };
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

    var getMovements = webApi.getTrainMovementsNearLocation(lat, lon, 10);
    var getStations = webApi.getStationByLocation(lat, lon, 3);
    $.when(getStations, getMovements).done(function (stations, movements) {
        var data = movements[0];
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
        var stats = stations[0];
        var stationNames = stats.map(function (value) {
            return value.StationName;
        });
        searchTitleModel.from(stationNames.join(", ").capitalize() + ", & others");
    }).always(function () {
        hide($(".progress"));
        thisPage.advancedSwitch(false);
    }).fail(function () {
        show($("#error-row"));
    });
}

function getCallingBetweenByCrs(from, to, convertFromCrs, fromDate, toDate) {
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

    var fromQuery, toQuery;
    if (convertFromCrs) {
        fromQuery = webApi.getAllStanoxByCrsCode(from);
        toQuery = webApi.getAllStanoxByCrsCode(to);
    } else {
        fromQuery = webApi.getStanox(from);
        toQuery = webApi.getStanox(to);
    }

    preAjax();
    $.when(fromQuery, toQuery).done(function (from, to) {
        var fromTiplocs;
        var toTiplocs;
        if (!from[0].length) {
            fromTiplocs = [from[0]];
        } else {
            fromTiplocs = from[0];
        }
        if (!to[0].length) {
            toTiplocs = [to[0]];
        } else {
            toTiplocs = to[0];
        }
        getCallingBetweenByTiploc(fromTiplocs, toTiplocs, startDate, endDate);
    }).fail(function () {
        hide($(".progress"));
        show($("#error-row"));
    });
}

function getDestinationByCrs(crs, convertFromCrs, fromDate, toDate) {
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
    var query;
    preAjax();

    if (convertFromCrs) {
        query = webApi.getStanoxByCrsCode(crs);
    } else {
        query = webApi.getStanox(crs);
    }
    query.done(function (from) {
        getDestinationByTiploc(from, startDate, endDate);
    }).fail(function () {
        hide($(".progress"));
        show($("#error-row"));
    });
}

function getStartingAtByCrs(crs, convertFromCrs, fromDate, toDate) {
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

    var query;
    preAjax();
    if (convertFromCrs) {
        query = webApi.getAllStanoxByCrsCode(crs);
    } else {
        query = webApi.getStanox(crs);
    }
    query.done(function (from) {
        if (!from.length)
            from = [from];
        getStartingAtByTiploc(from, startDate, endDate);
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

    var query;
    preAjax();

    if (convertFromCrs) {
        query = webApi.getAllStanoxByCrsCode(crs);
    } else {
        query = webApi.getStanox(crs);
    }
    query.done(function (at) {
        var at;
        if (!at.length) {
            at = [at];
        }
        getCallingAtTiploc(at, startDate, endDate);
    }).fail(function () {
        hide($(".progress"));
        show($("#error-row"));
    });
}

function getDestinationByTiploc(to, startDate, endDate) {
    currentMode = 1 /* terminate */;
    if (to) {
        currentToStanox = [to];
    }
    currentStanox = null;
    currentStartDate = startDate;
    currentEndDate = endDate;
    clear();

    setTitle("Trains terminating at " + TrainNotifier.StationTiploc.toDisplayString(currentToStanox[0]));
    setTimeLinks();

    var query;
    var startDateQuery = currentStartDate.format(TrainNotifier.DateTimeFormats.dateTimeApiFormat);
    var endDateQuery = currentEndDate.format(TrainNotifier.DateTimeFormats.dateTimeApiFormat);
    if (currentToStanox[0].CRS && currentToStanox[0].CRS.length == 3) {
        query = webApi.getTrainMovementsTerminatingAtStation(currentToStanox[0].CRS, startDateQuery, endDateQuery, toc);
    } else {
        query = webApi.getTrainMovementsTerminatingAtLocation(currentToStanox[0].Stanox, startDateQuery, endDateQuery, toc);
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

function getStartingAtByTiploc(from, startDate, endDate) {
    currentMode = 2 /* origin */;
    if (from) {
        currentStanox = from;
    }
    currentToStanox = null;
    currentStartDate = startDate;
    currentEndDate = endDate;
    clear();
    setTitle("Trains starting at " + TrainNotifier.StationTiploc.toDisplayString(currentStanox[0]));
    setTimeLinks();

    var query;
    var startDateQuery = currentStartDate.format(TrainNotifier.DateTimeFormats.dateTimeApiFormat);
    var endDateQuery = currentEndDate.format(TrainNotifier.DateTimeFormats.dateTimeApiFormat);
    if (currentStanox[0].CRS && currentStanox[0].CRS.length == 3) {
        query = webApi.getTrainMovementsStartingAtStation(currentStanox[0].CRS, startDateQuery, endDateQuery, toc);
    } else {
        query = webApi.getTrainMovementsStartingAtLocation(currentStanox[0].Stanox, startDateQuery, endDateQuery, toc);
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

function getCallingAtTiploc(at, startDate, endDate) {
    currentMode = 3 /* callingAt */;
    if (at && at.length > 0) {
        currentStanox = at;
    }
    currentToStanox = null;
    currentStartDate = startDate;
    currentEndDate = endDate;
    clear();
    setTitle("Trains calling at " + TrainNotifier.StationTiploc.toDisplayString(currentStanox[0]));
    setTimeLinks();

    var query;
    var startDateQuery = currentStartDate.format(TrainNotifier.DateTimeFormats.dateTimeApiFormat);
    var endDateQuery = currentEndDate.format(TrainNotifier.DateTimeFormats.dateTimeApiFormat);
    if (currentStanox[0].CRS && currentStanox[0].CRS.length == 3) {
        query = webApi.getTrainMovementsCallingAtStation(currentStanox[0].CRS, startDateQuery, endDateQuery, toc);
    } else {
        query = webApi.getTrainMovementsCallingAtLocation(currentStanox[0].Stanox, startDateQuery, endDateQuery, toc);
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

function getCallingBetweenByTiploc(from, to, startDate, endDate) {
    currentMode = 4 /* between */;
    if (from) {
        currentStanox = from;
    }
    if (to) {
        currentToStanox = to;
    }
    currentStartDate = startDate;
    currentEndDate = endDate;
    clear();
    setTitle("Trains from " + TrainNotifier.StationTiploc.toDisplayString(currentStanox[0]) + " to " + TrainNotifier.StationTiploc.toDisplayString(currentToStanox[0]));
    callingBetweenSearchResults.fromStation(TrainNotifier.StationTiploc.toDisplayString(currentStanox[0]));
    callingBetweenSearchResults.fromShortStation(currentStanox[0].CRS ? currentStanox[0].CRS : "");
    callingBetweenSearchResults.toStation(TrainNotifier.StationTiploc.toDisplayString(currentToStanox[0]));
    callingBetweenSearchResults.toShortStation(currentToStanox[0].CRS ? currentToStanox[0].CRS : "");
    setTimeLinks();

    var query;
    var startDateQuery = currentStartDate.format(TrainNotifier.DateTimeFormats.dateTimeApiFormat);
    var endDateQuery = currentEndDate.format(TrainNotifier.DateTimeFormats.dateTimeApiFormat);
    if (currentStanox[0].CRS && currentStanox[0].CRS.length == 3 && currentToStanox[0].CRS && currentToStanox[0].CRS.length == 3) {
        query = webApi.getTrainMovementsBetweenStations(currentStanox[0].CRS, currentToStanox[0].CRS, startDateQuery, endDateQuery, toc);
    } else {
        query = webApi.getTrainMovementsBetweenLocations(currentStanox[0].Stanox, currentToStanox[0].Stanox, startDateQuery, endDateQuery, toc);
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
        case 2 /* origin */:
            getStartingAtByTiploc(null, startDate, endDate);
            break;
        case 1 /* terminate */:
            getDestinationByTiploc(null, startDate, endDate);
            break;
        case 3 /* callingAt */:
            getCallingAtTiploc(null, startDate, endDate);
            break;
        case 4 /* between */:
            getCallingBetweenByTiploc(null, null, startDate, endDate);
            break;
    }
}

function nextDate() {
    preAjax();
    var startDate = moment(currentStartDate).add({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
    var endDate = moment(currentEndDate).add({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
    switch (currentMode) {
        case 2 /* origin */:
            getStartingAtByTiploc(null, startDate, endDate);
            break;
        case 1 /* terminate */:
            getDestinationByTiploc(null, startDate, endDate);
            break;
        case 3 /* callingAt */:
            getCallingAtTiploc(null, startDate, endDate);
            break;
        case 4 /* between */:
            getCallingBetweenByTiploc(null, null, startDate, endDate);
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
    if (currentStanox && currentStanox.length > 0) {
        var from = TrainNotifier.StationTiploc.toDisplayString(currentStanox[0]);
        title += from;
        searchTitleModel.from(from);
        switch (currentMode) {
            case 3 /* callingAt */:
                searchTitleModel.link("search/at/" + currentStanox[0].CRS);
                searchTitleModel.title("Use this as a permanent link for trains calling at this location around the current time");
                break;

            case 2 /* origin */:
                searchTitleModel.link("search/from/" + currentStanox[0].CRS);
                searchTitleModel.title("Use this as a permanent link for trains starting from this location around the current time");
                break;
        }
    } else {
        searchTitleModel.from(null);
        searchTitleModel.link(null);
        searchTitleModel.title(null);
    }
    if (currentToStanox && currentToStanox.length > 0) {
        var to = TrainNotifier.StationTiploc.toDisplayString(currentToStanox[0]);
        if (currentStanox) {
            title += " to ";
            searchTitleModel.to(to);
        } else {
            searchTitleModel.from(to);
            searchTitleModel.to(null);
        }
        switch (currentMode) {
            case 4 /* between */:
                searchTitleModel.link("search/from/" + currentStanox[0].CRS + "/to/" + currentToStanox[0].CRS);
                searchTitleModel.title("Use this as a permanent link for trains calling at this location around the current time");
                break;

            case 1 /* terminate */:
                searchTitleModel.link("search/to/" + currentToStanox[0].CRS);
                searchTitleModel.title("Use this as a permanent link for trains terminating at this location around the current time");
                break;
        }
        title += TrainNotifier.StationTiploc.toDisplayString(currentToStanox[0]);
    }
    if (currentStartDate && currentEndDate) {
        title += " on ";
        var date = currentStartDate.format(TrainNotifier.DateTimeFormats.dateTitleFormat) + " " + currentStartDate.format(TrainNotifier.DateTimeFormats.shortTimeFormat) + " - " + currentEndDate.format(TrainNotifier.DateTimeFormats.shortTimeFormat);
        title += date;
        searchTitleModel.DateRange(date);
    }
    searchTitleModel.setTitle(title);
}

function setTimeLinks() {
    var minusStartDate = moment(currentStartDate).subtract({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
    var plusStartDate = moment(currentStartDate).add({ hours: TrainNotifier.DateTimeFormats.timeFrameHours });
    var url = "";
    switch (currentMode) {
        case 2 /* origin */:
            if (currentStanox[0].CRS) {
                url = "from/" + currentStanox[0].CRS;
            } else {
                url = "from/" + currentStanox[0].Stanox;
            }
            break;
        case 1 /* terminate */:
            if (currentToStanox[0].CRS) {
                url = "to/" + currentToStanox[0].CRS;
            } else {
                url = "to/" + currentToStanox[0].Stanox;
            }
            break;
        case 3 /* callingAt */:
            if (currentStanox[0].CRS) {
                url = "at/" + currentStanox[0].CRS;
            } else {
                url = "at/" + currentStanox[0].Stanox;
            }
            break;
        case 4 /* between */:
            if (currentStanox[0].CRS && currentToStanox[0].CRS) {
                url = "from/" + currentStanox[0].CRS + "/to/" + currentToStanox[0].CRS;
            } else {
                url = "from/" + currentStanox[0].Stanox + "/to/" + currentToStanox[0].Stanox;
            }
            break;
    }

    var tocUrl = "";
    if (toc)
        tocUrl = "?toc=" + toc;

    $(".neg-hrs").attr("href", "search/" + url + minusStartDate.format("/YYYY/MM/DD/HH-mm") + tocUrl);
    $(".plus-hrs").attr("href", "search/" + url + plusStartDate.format("/YYYY/MM/DD/HH-mm") + tocUrl);

    setHash("!" + url, moment(currentStartDate).format("YYYY-MM-DD/HH-mm") + moment(currentEndDate).format("/HH-mm"), true);
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
    if (toc)
        hash += "?toc=" + toc;
    if (document.location.hash != "#" + hash) {
        if (dontLoad)
            thisPage.settingHash = true;
        document.location.hash = hash;
    }
    if (!dontLoad) {
        loadHashCommand();
    }
    thisPage.setCommand(hash);
}
