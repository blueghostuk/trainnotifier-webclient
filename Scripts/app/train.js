var currentTrainUid = ko.observable();
var trainTitleModel = new TrainNotifier.KnockoutModels.Train.TrainTitleViewModel();
var scheduleStops = ko.observableArray().extend({ method: "notifyWhenChangesStop", rateLimit: 500 });
;
var liveStops = ko.observableArray().extend({ method: "notifyWhenChangesStop", rateLimit: 500 });
var currentTrainDetails = new TrainNotifier.KnockoutModels.Train.TrainDetails();
var _lastTrainData;
var currentTiplocs = [];
var webSockets = new TrainNotifier.WebSockets();
var currentCommand;
var thisPage = {
    settingHash: false,
    setCommand: function (command) {
        var original = command;
        var advancedMode = command.indexOf('/advanced');
        if (advancedMode != -1) {
            command = command.substring(0, advancedMode);
        }
        document.location.hash = original;
        currentCommand = original.replace("!", "");
        ;
    },
    parseCommand: function () {
        var cmdString = thisPage.getCommand();
        var cmd = "get";
        var args = cmdString.split('/');
        if (args.length == 3) {
            cmd = args[2];
        }
        if (cmd == "id") {
            getById(args[1]);
            return true;
        }
        else if (cmd == "get" || cmd == "sub") {
            var subscribe = cmd == "sub";
            var date = args[1];
            var trainUid = args[0];
            getTrainData(trainUid, date, subscribe);
            return true;
        }
        return false;
    },
    getCommand: function () {
        return currentCommand;
    },
    wsOpenCommand: function () {
        this.parseCommand();
    },
    setStatus: function (status) {
        $("#status").html(status);
    },
    advancedMode: ko.observable(false),
    advancedSwitch: function (change) {
        if (change === void 0) { change = true; }
        if (change) {
            this.advancedMode(!this.advancedMode());
            $.cookie("advancedMode-train", this.advancedMode() ? "on" : "off", { expires: 365 });
        }
        if (this.advancedMode()) {
            $("#advancedSwitch").html("Simple");
            $(".pass, .advanced-col").removeClass("hide");
            $(".simple-col").addClass("hide");
        }
        else {
            $("#advancedSwitch").html("Advanced");
            $(".pass, .advanced-col").addClass("hide");
            $(".simple-col").removeClass("hide");
        }
    }
};
TrainNotifier.Common.page = thisPage;
var webApi;
$(function () {
    webApi = new TrainNotifier.WebApi();
    TrainNotifier.Common.webApi = webApi;
    ko.applyBindings(liveStops, $("#trains").get(0));
    ko.applyBindings(scheduleStops, $("#schedule").get(0));
    ko.applyBindings(scheduleStops, $("#mix").get(0));
    ko.applyBindings(trainTitleModel, $("#title").get(0));
    ko.applyBindings(currentTrainDetails, $("#details").get(0));
    ko.applyBindings(currentTrainUid, $("#trainNav").get(0));
    if (document.location.hash.length > 0) {
        thisPage.setCommand(document.location.hash.substr(1));
    }
    $("#advancedSwitch").click(function (e) {
        e.preventDefault();
        thisPage.advancedSwitch();
    });
    var advancedCookie = $.cookie("advancedMode-train");
    if (advancedCookie && advancedCookie == "on") {
        thisPage.advancedMode(true);
        thisPage.advancedSwitch(false);
    }
    try {
        connectToWebsocketServer();
    }
    catch (err) {
        console.error("Failed to connect to web socket server: {0}", err);
    }
    window.onhashchange = function () {
        if (!thisPage.settingHash) {
            thisPage.setCommand(document.location.hash.substr(1));
            thisPage.parseCommand();
        }
        thisPage.settingHash = false;
    };
    thisPage.parseCommand();
});
function reset() {
    scheduleStops.removeAll();
    liveStops.removeAll();
    currentTrainDetails.reset();
    currentTiplocs = [];
}
function connectToWebsocketServer() {
    webSockets.connect();
    webSockets.onMessageHandler(function (msg) {
        var data = jQuery.parseJSON(msg.data);
        if (data.Command == "subtrainupdate") {
            var stops = data.Response;
            for (var i = 0; i < stops.length; i++) {
                var added = addStop(stops[i]);
                while (added.state() === "pending") {
                }
            }
            $(".tooltip-dynamic").tooltip();
            $('html, body').animate({
                scrollTop: $("#tableView tr:last").offset().top
            }, 1000);
            $("#tableView tr:last, #lastUpdate").animate({
                backgroundColor: '#dff0d8'
            }, {
                duration: 30000,
                complete: function () {
                    $(this).animate({
                        backgroundColor: '#FFF'
                    });
                }
            });
        }
        else if (data.Command == "subtrainupdate-berth") {
            var berthSteps = data.Response;
            for (var i = 0; i < berthSteps.length; i++) {
                liveStops.push(new TrainNotifier.KnockoutModels.Train.BerthLiveStop(berthSteps[i]));
            }
        }
    });
    setInterval(function () {
        if (webSockets.state == WebSocket.CLOSED) {
            webSockets.connect();
        }
    }, 2000);
}
function addStop(stop) {
    if (stop.State === 1) {
        sendWsCommand("unsubtrain:");
    }
    var stopTiploc = TrainNotifier.StationTiploc.findStationTiploc(stop.Stanox, currentTiplocs);
    var nextStopTiploc = TrainNotifier.StationTiploc.findStationTiploc(stop.NextStanox, currentTiplocs);
    var queries = [];
    if (!stopTiploc) {
        queries.push(webApi.getStanox(stop.Stanox));
    }
    if (!nextStopTiploc && stop.NextStanox) {
        queries.push(webApi.getStanox(stop.NextStanox));
    }
    return $.when(queries).done(function (tiplocA, tiplocB) {
        if (tiplocA && tiplocA.Stanox)
            currentTiplocs.push(tiplocA);
        if (tiplocB && tiplocB.Stanox)
            currentTiplocs.push(tiplocB);
    }).done(function () {
        var mixedIn = false;
        for (var i = 0; i < liveStops().length; i++) {
            var liveStop = liveStops()[i];
            switch (stop.EventType) {
                case TrainNotifier.WebSocketCommands.Arrival:
                    if (liveStop.validArrival(stop.Stanox, currentTiplocs)) {
                        liveStop.updateWebSocketArrival(stop, currentTiplocs);
                        mixedIn = true;
                    }
                    break;
                case TrainNotifier.WebSocketCommands.Departure:
                    if (liveStop.validDeparture(stop.Stanox, currentTiplocs)) {
                        liveStop.updateWebSocketDeparture(stop, currentTiplocs);
                        mixedIn = true;
                    }
                    break;
            }
            if (mixedIn)
                break;
        }
        if (!mixedIn) {
            var arrivalStop;
            var departureStop;
            switch (stop.EventType) {
                case TrainNotifier.WebSocketCommands.Arrival:
                    arrivalStop = stop;
                    break;
                case TrainNotifier.WebSocketCommands.Departure:
                    departureStop = stop;
                    break;
            }
            var newStop = new TrainNotifier.KnockoutModels.Train.NewLiveStop(currentTiplocs, arrivalStop, departureStop);
            liveStops.push(newStop);
            for (var i = 0; i < scheduleStops().length; i++) {
                var scheduleStop = scheduleStops()[i];
                if (scheduleStop.validateAssociation(newStop)) {
                    scheduleStop.associateWithLiveStop(newStop);
                    break;
                }
            }
        }
    });
}
function sendWsCommand(command) {
}
function subTrain() {
    if (_lastTrainData && _lastTrainData.Movement.Actual && webSockets && webSockets.state == WebSocket.OPEN) {
        thisPage.setCommand("!" + _lastTrainData.Movement.Schedule.TrainUid + "/" + moment(_lastTrainData.Movement.Actual.OriginDepartTimestamp).format(TrainNotifier.DateTimeFormats.dateUrlFormat) + "/sub");
        doSubTrain();
    }
}
function getById(id) {
    preAjax();
    webApi.getTrainMovementById(id).done(function (data) {
        if (data) {
            thisPage.setCommand("!" + data.TrainUid + "/" + moment(data.OriginDepartTimestamp).format(TrainNotifier.DateTimeFormats.dateUrlFormat));
            getTrainData(data.TrainUid, moment(data.OriginDepartTimestamp).format(TrainNotifier.DateTimeFormats.dateUrlFormat), false);
        }
        else {
            show($("#no-results-row"));
        }
    }).fail(function () {
        show($("#error-row"));
    }).always(function () {
        hide($(".progress"));
    });
}
function getTrainData(trainUid, date, subscribe) {
    currentTrainUid(trainUid);
    preAjax();
    sendWsCommand("unsubtrain:");
    reset();
    webApi.getTrainMovementByUid(trainUid, date).done(function (data) {
        if (!data) {
            $("#no-results-row").show();
            return;
        }
        _lastTrainData = data;
        currentTiplocs = data.Tiplocs;
        if (data.Movement) {
            if (data.Movement.Schedule) {
                if (data.Movement.Schedule.Headcode) {
                    trainTitleModel.id(data.Movement.Schedule.Headcode);
                }
                else {
                    trainTitleModel.id("");
                }
            }
            if (data.Movement.Schedule && data.Movement.Schedule.Stops.length > 0) {
                var previousStop;
                for (var i = 0; i < data.Movement.Schedule.Stops.length; i++) {
                    var thisStop = new TrainNotifier.KnockoutModels.Train.ScheduleStop(data.Movement.Schedule.Stops[i], currentTiplocs, thisPage.advancedMode);
                    previousStop = thisStop;
                    scheduleStops.push(thisStop);
                }
                if (data.Movement.ChangeOfOrigins.length > 0) {
                    var coo = data.Movement.ChangeOfOrigins[0];
                    var cooTiploc = TrainNotifier.StationTiploc.findStationTiploc(coo.NewOriginStanoxCode, currentTiplocs);
                    trainTitleModel.from(cooTiploc.Description ? cooTiploc.Description.toLowerCase() : cooTiploc.Tiploc);
                    trainTitleModel.start(moment(coo.NewDepartureTime).format(TrainNotifier.DateTimeFormats.shortTimeFormat));
                    var matchingStops = data.Movement.Schedule.Stops.filter(function (stop) {
                        return stop.TiplocStanoxCode == cooTiploc.Stanox;
                    });
                    if (matchingStops.length > 0) {
                        var startStopNumber = matchingStops[0].StopNumber;
                        for (var i = 0; i < scheduleStops().length; i++) {
                            if (scheduleStops()[i].stopNumber == startStopNumber) {
                                break;
                            }
                            scheduleStops()[i].cancel(true);
                        }
                    }
                }
                else {
                    var start = data.Movement.Schedule.Stops[0];
                    var startTiploc = TrainNotifier.StationTiploc.findStationTiploc(start.TiplocStanoxCode, currentTiplocs);
                    trainTitleModel.from(startTiploc.Description ? startTiploc.Description.toLowerCase() : startTiploc.Tiploc);
                    var departureTs = start.PublicDeparture ? start.PublicDeparture : start.Departure;
                    trainTitleModel.start(moment(departureTs, TrainNotifier.DateTimeFormats.timeFormat).format(TrainNotifier.DateTimeFormats.shortTimeFormat));
                }
                if (data.Movement.Cancellations.length > 0) {
                    var cancel = data.Movement.Cancellations[0];
                    var cancelAtTiploc = TrainNotifier.StationTiploc.findStationTiploc(cancel.CancelledAtStanoxCode, currentTiplocs);
                    trainTitleModel.to(cancelAtTiploc.Description ? cancelAtTiploc.Description.toLowerCase() : cancelAtTiploc.Tiploc);
                    trainTitleModel.end(moment(cancel.CancelledTimestamp).format(TrainNotifier.DateTimeFormats.shortTimeFormat));
                }
                else if (data.Movement.Schedule.Stops.length > 1) {
                    var end = data.Movement.Schedule.Stops[data.Movement.Schedule.Stops.length - 1];
                    var endTiploc = TrainNotifier.StationTiploc.findStationTiploc(end.TiplocStanoxCode, currentTiplocs);
                    trainTitleModel.to(endTiploc.Description ? endTiploc.Description.toLowerCase() : endTiploc.Tiploc);
                    var arrivalTs = end.PublicArrival ? end.PublicArrival : end.Arrival;
                    trainTitleModel.end(moment(arrivalTs, TrainNotifier.DateTimeFormats.timeFormat).format(TrainNotifier.DateTimeFormats.shortTimeFormat));
                }
            }
            else {
                trainTitleModel.clear(false);
            }
            if (data.Movement.Actual) {
                trainTitleModel.id(data.Movement.Actual.HeadCode);
                if (data.Movement.Actual.Stops.length > 0) {
                    var arrivals = data.Movement.Actual.Stops.filter(function (stop) {
                        return stop.EventType === 2 /* Arrival */ && (stop.ScheduleStopNumber != 0 || (stop.ScheduleStopNumber == 0 && stop.Source == 1 /* TD */));
                    });
                    var departures = data.Movement.Actual.Stops.filter(function (stop) {
                        return stop.EventType === 1 /* Departure */;
                    });
                    var modelStops = [];
                    for (var i = 0; i < arrivals.length; i++) {
                        modelStops.push(new TrainNotifier.KnockoutModels.Train.ExistingLiveStop(currentTiplocs, arrivals[i]));
                    }
                    for (var i = 0; i < departures.length; i++) {
                        var departure = departures[i];
                        var setDept = false;
                        for (var j = 0; j < modelStops.length; j++) {
                            if (modelStops[j].validDeparture(departure.TiplocStanoxCode, currentTiplocs)) {
                                modelStops[j].updateExistingDeparture(departure, currentTiplocs);
                                setDept = true;
                                break;
                            }
                        }
                        if (!setDept) {
                            modelStops.push(new TrainNotifier.KnockoutModels.Train.ExistingLiveStop(currentTiplocs, null, departure));
                        }
                    }
                    for (var i = 0; i < modelStops.length; i++) {
                        for (var j = 0; j < scheduleStops().length; j++) {
                            var scheduleStop = scheduleStops()[j];
                            if (scheduleStop.validateAssociation(modelStops[i])) {
                                scheduleStop.associateWithLiveStop(modelStops[i]);
                                break;
                            }
                        }
                    }
                    var orderedModelStops = modelStops.sort(function (a, b) {
                        var aTime = a.timeStampForSorting;
                        var bTime = b.timeStampForSorting;
                        if (aTime < bTime)
                            return -1;
                        if (aTime > bTime)
                            return 1;
                        return 0;
                    });
                    for (var i = 0; i < orderedModelStops.length; i++) {
                        liveStops.push(orderedModelStops[i]);
                    }
                }
            }
            currentTrainDetails.updateFromTrainMovement(data.Movement, currentTiplocs, date);
        }
        $(".tooltip-dynamic").tooltip();
    }).then(function () {
        return getAssociations(date);
    }).then(function () {
        if (subscribe) {
            doSubTrain();
        }
    }).fail(function () {
        show($("#error-row"));
    }).always(function () {
        hide($(".progress"));
    });
}
function doSubTrain() {
}
function getAssociations(date) {
    if (!_lastTrainData || !_lastTrainData.Movement || !_lastTrainData.Movement.Schedule || (!_lastTrainData.Movement.Actual && !date)) {
        return;
    }
    var queryDate = _lastTrainData.Movement.Actual ? _lastTrainData.Movement.Actual.OriginDepartTimestamp : date;
    return webApi.getTrainMovementAssociations(_lastTrainData.Movement.Schedule.TrainUid, moment(queryDate).format(TrainNotifier.DateTimeFormats.dateUrlFormat)).done(function (associations) {
        if (associations.length == 0)
            return;
        for (var i = 0; i < associations.length; i++) {
            currentTrainDetails.associations.push(new TrainNotifier.KnockoutModels.Train.TrainAssociation(associations[i], _lastTrainData.Movement.Schedule.TrainUid, queryDate));
        }
    });
}
function tryConnect() {
}
