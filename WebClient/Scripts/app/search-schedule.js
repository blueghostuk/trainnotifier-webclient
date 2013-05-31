var currentLocation = new LocationViewModel();
var currentOriginResults = new ScheduleSearchResults();
var currentCallingAtResults = new ScheduleSearchResults();
var titleModel = new TitleViewModel();
var startingAtSearchResults = ko.observableArray();
var currentStanox;
var currentToStanox;
var currentStartDate = null;
var currentEndDate = null;
var currentMode;
var timeTitleFormat = "HH:mm";
var titleFormat = "ddd Do MMM YYYY";
var dateApiQuery = "YYYY-MM-DDTHH:mm";
var timeFrameHours = 1;
var thisPage = {
    setCommand: function (command) {
        $("#global-search-box").val(command);
    },
    parseCommand: function () {
        var cmdString = this.getCommand();
        var idx = cmdString.indexOf("/");
        if(idx == -1) {
            return false;
        }
        var cmd = cmdString.substring(0, idx);
        var args = cmdString.substring(idx + 1).split('/');
        $("#commandOptions > li.active").removeClass("active");
        var convertFromCrs = args[0].length == 3;
        switch(cmd) {
            case 'from':
                if(args.length >= 3 && args[1] == "to") {
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
var webApi;
$(function () {
    webApi = new TrainNotifier.WebApi();
    TrainNotifier.Common.webApi = webApi;
    ko.applyBindings(currentLocation, $("#stationDetails").get(0));
    ko.applyBindings(currentOriginResults, $("#origin-search-results").get(0));
    ko.applyBindings(currentCallingAtResults, $("#callingAt-search-results").get(0));
    ko.applyBindings(titleModel, $("#title").get(0));
    ko.applyBindings(startingAtSearchResults, $("#starting-at-search-results").get(0));
    loadHashCommand();
});
function getDateTime(args) {
    if(args.length > 0) {
        if(args.length == 2) {
            return moment(args.join('/'), TrainNotifier.DateTimeFormats.dateTimeHashFormat);
        } else if(args[0] && args[0].length > 0) {
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
    if(toDate) {
        var startDate = fromDate;
        var endDate = toDate;
    } else {
        var startDate = moment(fromDate).subtract({
            hours: timeFrameHours
        });
        var endDate = moment(fromDate).add({
            hours: timeFrameHours
        });
    }
    if(endDate.isBefore(startDate)) {
        endDate.add('days', 1);
    }
    var hash = "from/" + from + "/to/" + to;
    var fromQuery, toQuery;
    if(convertFromCrs) {
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
    if(toDate) {
        var startDate = fromDate;
        var endDate = toDate;
    } else {
        var startDate = moment(fromDate).subtract({
            hours: timeFrameHours
        });
        var endDate = moment(fromDate).add({
            hours: timeFrameHours
        });
    }
    if(endDate.isBefore(startDate)) {
        endDate.add('days', 1);
    }
    var hash = "to/" + crs;
    var query;
    setHash(hash, null, true);
    preAjax();
    if(convertFromCrs) {
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
function getOrigin(crs, convertFromCrs, fromDate, toDate) {
    $("#commandOptions > li#from" + (convertFromCrs ? "-crs" : "")).addClass("active");
    if(toDate) {
        var startDate = fromDate;
        var endDate = toDate;
    } else {
        var startDate = moment(fromDate).subtract({
            hours: timeFrameHours
        });
        var endDate = moment(fromDate).add({
            hours: timeFrameHours
        });
    }
    if(endDate.isBefore(startDate)) {
        endDate.add('days', 1);
    }
    var hash = "from/" + crs;
    var query;
    setHash(hash, null, true);
    preAjax();
    if(convertFromCrs) {
        query = webApi.getStanoxByCrsCode(crs);
    } else {
        query = webApi.getStanox(crs);
    }
    query.done(function (from) {
        getOriginByStanox(from, startDate, endDate);
    }).fail(function () {
        $(".progress").hide();
        $("#error-row").show();
    });
}
function getStation(crs, convertFromCrs, fromDate, toDate) {
    $("#commandOptions > li#at" + (convertFromCrs ? "-crs" : "")).addClass("active");
    if(toDate) {
        var startDate = fromDate;
        var endDate = toDate;
    } else {
        var startDate = moment(fromDate).subtract({
            hours: timeFrameHours
        });
        var endDate = moment(fromDate).add({
            hours: timeFrameHours
        });
    }
    if(endDate.isBefore(startDate)) {
        endDate.add('days', 1);
    }
    var hash = "at/" + crs;
    var query;
    setHash(hash, null, true);
    preAjax();
    if(convertFromCrs) {
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
    if(to) {
        currentToStanox = to;
        listStation(currentToStanox);
    }
    currentStanox = null;
    currentStartDate = startDate;
    currentEndDate = endDate;
    clear();
    setTitle("Trains terminating at ");
    setTimeLinks();
    webApi.getTrainMovementsTerminatingAtLocation(currentToStanox.Stanox, currentStartDate.format(dateApiQuery), currentEndDate.format(dateApiQuery)).done(function (data) {
        if(data && data.Movements.length > 0) {
            $("#no-results-row").hide();
            for(var i = 0; i < data.Movements.length; i++) {
                currentOriginResults.addTrain(createTrainElement(data.Movements[i], data.Tiplocs));
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
function getOriginByStanox(from, startDate, endDate) {
    currentMode = scheduleResultsMode.Origin;
    if(from) {
        currentStanox = from;
        listStation(currentStanox);
    }
    currentToStanox = null;
    currentStartDate = startDate;
    currentEndDate = endDate;
    clear();
    setTitle("Trains starting at ");
    setTimeLinks();
    var query;
    var startDateQuery = currentStartDate.format(dateApiQuery);
    var endDateQuery = currentEndDate.format(dateApiQuery);
    if(currentStanox.CRS && currentStanox.CRS.length == 3) {
        query = webApi.getTrainMovementsStartingAtStation(currentStanox.CRS, startDateQuery, endDateQuery);
    } else {
        query = webApi.getTrainMovementsStartingAtLocation(currentStanox.Stanox, startDateQuery, endDateQuery);
    }
    query.done(function (data) {
        if(data && data.Movements.length > 0) {
            $("#no-results-row").hide();
            var viewModels = data.Movements.map(function (movement) {
                return new TrainNotifier.KnockoutModels.StartingAtTrainMovement(movement, data.Tiplocs);
            });
            for(var i = 0; i < viewModels.length; i++) {
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
function getCallingAtStanox(at, startDate, endDate) {
    currentMode = scheduleResultsMode.CallingAt;
    if(at) {
        currentStanox = at;
        listStation(currentStanox);
    }
    currentToStanox = null;
    currentStartDate = startDate;
    currentEndDate = endDate;
    clear();
    setTitle("Trains calling at ");
    setTimeLinks();
    webApi.getTrainMovementsCallingAtLocation(currentStanox.Stanox, currentStartDate.format(dateApiQuery), currentEndDate.format(dateApiQuery)).done(function (data) {
        if(data && data.Movements.length > 0) {
            $("#no-results-row").hide();
            for(var i = 0; i < data.Movements.length; i++) {
                currentCallingAtResults.addTrain(createTrainElement(data.Movements[i], data.Tiplocs));
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
function getCallingBetweenByStanox(from, to, startDate, endDate) {
    currentMode = scheduleResultsMode.Between;
    if(from) {
        currentStanox = from;
        listStation(currentStanox);
    }
    if(to) {
        currentToStanox = to;
    }
    currentStartDate = startDate;
    currentEndDate = endDate;
    clear();
    setTitle("Trains from ");
    setTimeLinks();
    webApi.getTrainMovementsBetweenLocations(currentStanox.Stanox, currentToStanox.Stanox, currentStartDate.format(dateApiQuery), currentEndDate.format(dateApiQuery)).done(function (data) {
        if(data && data.Movements.length > 0) {
            $("#no-results-row").hide();
            for(var i = 0; i < data.Movements.length; i++) {
                currentCallingAtResults.addTrain(createTrainElement(data.Movements[i], data.Tiplocs));
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
function createTrainElement(data, tiplocs) {
}
function previousDate() {
    preAjax();
    var startDate = moment(currentStartDate).subtract({
        hours: timeFrameHours
    });
    var endDate = moment(currentEndDate).subtract({
        hours: timeFrameHours
    });
    switch(currentMode) {
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
    var startDate = moment(currentStartDate).add({
        hours: timeFrameHours
    });
    var endDate = moment(currentEndDate).add({
        hours: timeFrameHours
    });
    switch(currentMode) {
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
    startingAtSearchResults.removeAll();
}
function setTitle(start) {
    var title = start;
    if(currentStanox) {
        var from = currentStanox.Description.toLowerCase();
        title += from;
        titleModel.From(from);
    } else {
        titleModel.From(null);
    }
    if(currentToStanox) {
        var to = currentToStanox.Description.toLowerCase();
        if(currentStanox) {
            title += " to ";
            titleModel.To(to);
        } else {
            titleModel.From(to);
            titleModel.To(null);
        }
        title += currentToStanox.Description.toLowerCase();
    }
    title += " on ";
    var date = currentStartDate.format(titleFormat) + " " + currentStartDate.format(timeTitleFormat) + " - " + currentEndDate.format(timeTitleFormat);
    title += date;
    titleModel.DateRange(date);
    titleModel.setTitle(title);
}
function setTimeLinks() {
    var minusStartDate = moment(currentStartDate).subtract({
        hours: timeFrameHours
    });
    var plusStartDate = moment(currentStartDate).add({
        hours: timeFrameHours
    });
    var url = "";
    switch(currentMode) {
        case scheduleResultsMode.Origin:
            if(currentStanox.CRS) {
                url = "from/" + currentStanox.CRS;
            } else {
                url = "from/" + currentStanox.Stanox;
            }
            break;
        case scheduleResultsMode.Terminate:
            if(currentToStanox.CRS) {
                url = "to/" + currentToStanox.CRS;
            } else {
                url = "to/" + currentToStanox.Stanox;
            }
            break;
        case scheduleResultsMode.CallingAt:
            if(currentStanox.CRS) {
                url = "at/" + currentStanox.CRS;
            } else {
                url = "at/" + currentStanox.Stanox;
            }
            break;
        case scheduleResultsMode.Between:
            if(currentStanox.CRS && currentToStanox.CRS) {
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
function listStation(stanox) {
    currentLocation.locationStanox(stanox.Stanox);
    currentLocation.locationTiploc(stanox.Tiploc);
    currentLocation.locationDescription(stanox.Description);
    currentLocation.locationCRS(stanox.CRS);
    currentLocation.stationName(stanox.StationName);
}
function loadHashCommand() {
    if(document.location.hash.length > 0) {
        thisPage.setCommand(document.location.hash.substr(1));
        thisPage.parseCommand();
    }
    return false;
}
var _lastHash;
function setHash(hash, dateHash, dontLoad) {
    if(!hash) {
        hash = _lastHash;
    } else {
        _lastHash = hash;
    }
    if(dateHash) {
        hash += "/" + dateHash;
    }
    document.location.hash = hash;
    if(!dontLoad) {
        loadHashCommand();
    }
    thisPage.setCommand(hash);
}
