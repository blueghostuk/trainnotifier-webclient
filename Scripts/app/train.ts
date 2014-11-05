/// <reference path="trainModels.ts" />
/// <reference path="webApi.ts" />
/// <reference path="websockets.ts" />
/// <reference path="global.ts" />
/// <reference path="../typings/jquery.cookie/jquery.cookie.d.ts" />
/// <reference path="../typings/knockout/knockout.d.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/moment/moment.d.ts" />

var currentTrainUid = ko.observable<string>();
var trainTitleModel = new TrainNotifier.KnockoutModels.Train.TrainTitleViewModel();
var scheduleStops = ko.observableArray<TrainNotifier.KnockoutModels.Train.ScheduleStop>();
var liveStops = ko.observableArray<TrainNotifier.KnockoutModels.Train.LiveStopBase>();
var currentTrainDetails = new TrainNotifier.KnockoutModels.Train.TrainDetails();

var _lastTrainData: ISingleTrainMovementResult;
var currentTiplocs: IStationTiploc[] = [];
var webSockets = new TrainNotifier.WebSockets();
var currentCommand: string;

var thisPage: IPage = {
    settingHash: false,
    setCommand: function (command: string) {
        var original = command;
        var advancedMode = command.indexOf('/advanced');
        if (advancedMode != -1) {
            command = command.substring(0, advancedMode);
        }
        document.location.hash = original;
        currentCommand = original.replace("!", "");;
    },
    parseCommand: function () {
        var cmdString = thisPage.getCommand();
        var cmd = "get";
        var args = cmdString.split('/');
        if (args.length == 5) {
            cmd = args[4];
        } else if (args.length == 2) {
            cmd = args[0];
        }

        if (cmd == "id") {
            getById(args[1]);
            return true;
        } else if (cmd == "get" || cmd == "sub") {
            var subscribe = cmd == "sub";
            var date = "";
            var trainUid = "";
            trainUid = args[0]
            date = args[1] + "-" + args[2] + "-" + args[3];
            getTrainData(trainUid, date, subscribe);
            return true;
        }

        return false;
    },
    getCommand: function (): string {
        return currentCommand;
    },
    wsOpenCommand: function () {
        this.parseCommand();
    },
    setStatus: function (status: string) {
        $("#status").html(status);
    },
    advancedMode: false,
    advancedSwitch: function (change: boolean = true) {
        if (change) {
            this.advancedMode = !this.advancedMode;
            $.cookie("advancedMode-train", this.advancedMode ? "on" : "off", { expires: 365 });
        }
        if (this.advancedMode) {
            $("#advancedSwitch").html("Simple");

            $(".pass, .advanced-col").removeClass("hide");
            $(".simple-col").addClass("hide");
        } else {
            $("#advancedSwitch").html("Advanced");

            $(".pass, .advanced-col").addClass("hide");
            $(".simple-col").removeClass("hide");
        }
    }
};

TrainNotifier.Common.page = thisPage;
var webApi: IWebApi;

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
        thisPage.advancedMode = true;
        thisPage.advancedSwitch(false);
    }

    try {
        connectToWebsocketServer();
    } catch (err) {
        console.error("Failed to connect to web socket server: {0}", err);
    }

    window.onhashchange = function () {
        if (!thisPage.settingHash) {
            thisPage.setCommand(document.location.hash.substr(1));
            thisPage.parseCommand();
        }
        thisPage.settingHash = false;
    };

    // load straightaway
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
        var data: any = jQuery.parseJSON(msg.data);
        if (data.Command == "subtrainupdate") {
            var stops: IWebSocketTrainMovement[] = data.Response;

            for (var i = 0; i < stops.length; i++) {
                var added = addStop(stops[i]);
                // wait for each add to complete
                while (added.state() === "pending") { }
            }
            $(".tooltip-dynamic").tooltip();
            // scroll to last table element
            $('html, body').animate({
                scrollTop: $("#tableView tr:last").offset().top
            }, 1000);
            // highlight last element and last update
            $("#tableView tr:last, #lastUpdate").animate(
                {
                    // essentially bootstrap success class
                    backgroundColor: '#dff0d8'
                },
                {
                    duration: 30000,
                    complete: function () {
                        $(this).animate({
                            // white
                            backgroundColor: '#FFF'
                        });
                    }
                });
        } else if (data.Command == "subtrainupdate-berth") {
            var berthSteps: IWebSocketBerthStep[] = data.Response;
            for (var i = 0; i < berthSteps.length; i++) {
                liveStops.push(new TrainNotifier.KnockoutModels.Train.BerthLiveStop(berthSteps[i]));
            }
        }
    });
    // try to keep websockets open
    setInterval(function () {
        if (webSockets.state == WebSocket.CLOSED) {
            webSockets.connect();
        }
    }, 2000);
}

function addStop(stop: IWebSocketTrainMovement) {
    // train terminated so unsubscribe
    if (stop.State === 1) {
        sendWsCommand("unsubtrain:");
    }

    var stopTiploc = TrainNotifier.StationTiploc.findStationTiploc(stop.Stanox, currentTiplocs);
    var nextStopTiploc = TrainNotifier.StationTiploc.findStationTiploc(stop.NextStanox, currentTiplocs);

    var queries: JQueryPromise<any>[] = [];

    if (!stopTiploc) {
        queries.push(webApi.getStanox(stop.Stanox));
    }
    if (!nextStopTiploc && stop.NextStanox) {
        queries.push(webApi.getStanox(stop.NextStanox));
    }

    return <JQueryDeferred<any>>$.when(queries).done(function (tiplocA: IStationTiploc, tiplocB: IStationTiploc) {
        if (tiplocA && tiplocA.Stanox)
            currentTiplocs.push(tiplocA)
        if (tiplocB && tiplocB.Stanox)
            currentTiplocs.push(tiplocB)
    }).done(function () {
            var mixedIn = false;
            for (var i = 0; i < liveStops().length; i++) {
                var liveStop: TrainNotifier.KnockoutModels.Train.LiveStopBase = liveStops()[i];
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
                var arrivalStop: IWebSocketTrainMovement;
                var departureStop: IWebSocketTrainMovement;
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
    /*if (webSockets && webSockets.state == WebSocket.OPEN) {
        webSockets.send(command);
    }*/
}

function subTrain() {
    if (_lastTrainData && _lastTrainData.Movement.Actual && webSockets && webSockets.state == WebSocket.OPEN) {
        thisPage.setCommand("!"
            + _lastTrainData.Movement.Schedule.TrainUid
            + "/"
            + moment(_lastTrainData.Movement.Actual.OriginDepartTimestamp).format(TrainNotifier.DateTimeFormats.dateUrlFormat)
            + "/sub");
        doSubTrain();
    }
}

function getById(id: string) {
    preAjax();
    webApi.getTrainMovementById(id).done(function (data: ITrainMovementLink) {
        if (data) {
            thisPage.setCommand("!"
                + data.TrainUid
                + "/"
                + moment(data.OriginDepartTimestamp).format(TrainNotifier.DateTimeFormats.dateUrlFormat));
            getTrainData(data.TrainUid, moment(data.OriginDepartTimestamp).format(TrainNotifier.DateTimeFormats.dateQueryFormat), false);
        } else {
            show($("#no-results-row"));
        }
    }).fail(function () {
            show($("#error-row"));
        }).always(function () {
            hide($(".progress"));
        });
}

function getTrainData(trainUid: string, date, subscribe: boolean) {
    currentTrainUid(trainUid);
    preAjax();
    sendWsCommand("unsubtrain:");
    reset();
    webApi.getTrainMovementByUid(trainUid, date).done(function (data: ISingleTrainMovementResult) {
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
                } else {
                    trainTitleModel.id("");
                }
            }
            if (data.Movement.Schedule && data.Movement.Schedule.Stops.length > 0) {
                var previousStop: TrainNotifier.KnockoutModels.Train.ScheduleStop;
                for (var i = 0; i < data.Movement.Schedule.Stops.length; i++) {
                    var thisStop = new TrainNotifier.KnockoutModels.Train.ScheduleStop(
                        data.Movement.Schedule.Stops[i], currentTiplocs);

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
                } else {
                    var start = data.Movement.Schedule.Stops[0];
                    var startTiploc = TrainNotifier.StationTiploc.findStationTiploc(
                        start.TiplocStanoxCode, currentTiplocs);
                    trainTitleModel.from(startTiploc.Description ? startTiploc.Description.toLowerCase() : startTiploc.Tiploc);
                    var departureTs = start.PublicDeparture ? start.PublicDeparture : start.Departure;
                    trainTitleModel.start(moment(departureTs, TrainNotifier.DateTimeFormats.timeFormat)
                        .format(TrainNotifier.DateTimeFormats.shortTimeFormat));
                }
                if (data.Movement.Cancellations.length > 0) {
                    var cancel = data.Movement.Cancellations[0];
                    var cancelAtTiploc = TrainNotifier.StationTiploc.findStationTiploc(cancel.CancelledAtStanoxCode, currentTiplocs);
                    trainTitleModel.to(cancelAtTiploc.Description ? cancelAtTiploc.Description.toLowerCase() : cancelAtTiploc.Tiploc);
                    trainTitleModel.end(moment(cancel.CancelledTimestamp).format(TrainNotifier.DateTimeFormats.shortTimeFormat));
                } else if (data.Movement.Schedule.Stops.length > 1) {
                    var end = data.Movement.Schedule.Stops[data.Movement.Schedule.Stops.length - 1];
                    var endTiploc = TrainNotifier.StationTiploc.findStationTiploc(
                        end.TiplocStanoxCode, currentTiplocs);
                    trainTitleModel.to(endTiploc.Description ? endTiploc.Description.toLowerCase() : endTiploc.Tiploc);
                    var arrivalTs = end.PublicArrival ? end.PublicArrival : end.Arrival;
                    trainTitleModel.end(moment(arrivalTs, TrainNotifier.DateTimeFormats.timeFormat).format(TrainNotifier.DateTimeFormats.shortTimeFormat));
                }
            } else {
                trainTitleModel.clear(false);
            }
            if (data.Movement.Actual) {
                trainTitleModel.id(data.Movement.Actual.HeadCode);
                if (data.Movement.Actual.Stops.length > 0) {
                    var arrivals = data.Movement.Actual.Stops.filter(function (stop: IRunningTrainActualStop) {
                        return stop.EventType === TrainNotifier.EventType.Arrival &&
                            (stop.ScheduleStopNumber != 0 || (stop.ScheduleStopNumber == 0 && stop.Source == TrainNotifier.LiveTrainStopSource.TD));
                    });

                    var departures = data.Movement.Actual.Stops.filter(function (stop: IRunningTrainActualStop) {
                        return stop.EventType === TrainNotifier.EventType.Departure;
                    });

                    var modelStops: TrainNotifier.KnockoutModels.Train.LiveStopBase[] = [];

                    for (var i = 0; i < arrivals.length; i++) {
                        modelStops.push(new TrainNotifier.KnockoutModels.Train.ExistingLiveStop(
                            currentTiplocs, arrivals[i]));
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
                            modelStops.push(new TrainNotifier.KnockoutModels.Train.ExistingLiveStop(
                                currentTiplocs, null, departure));
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

                    var orderedModelStops = modelStops.sort(function (a: TrainNotifier.KnockoutModels.Train.LiveStopBase, b: TrainNotifier.KnockoutModels.Train.LiveStopBase) {
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
            thisPage.advancedSwitch(false);
            hide($(".progress"));
        });
}

function doSubTrain() {
    //sendWsCommand("subtrain:" + _lastTrainData.Movement.Actual.TrainId);
}

function getAssociations(date?: string) {
    if (!_lastTrainData || !_lastTrainData.Movement || !_lastTrainData.Movement.Schedule || (!_lastTrainData.Movement.Actual && !date)) {
        return;
    }
    var queryDate = _lastTrainData.Movement.Actual ? _lastTrainData.Movement.Actual.OriginDepartTimestamp : date;
    return webApi.getTrainMovementAssociations(
        _lastTrainData.Movement.Schedule.TrainUid,
        moment(queryDate).format(TrainNotifier.DateTimeFormats.dateQueryFormat))
        .done(function (associations: IAssociation[]) {
            if (associations.length == 0)
                return;

            for (var i = 0; i < associations.length; i++) {
                currentTrainDetails.associations.push(new TrainNotifier.KnockoutModels.Train.TrainAssociation(
                    associations[i], _lastTrainData.Movement.Schedule.TrainUid, queryDate));
            }
        });
}

function tryConnect() {
    /*if (webSockets && webSockets.state !== WebSocket.OPEN) {
        webSockets.connect();
    }*/
}
