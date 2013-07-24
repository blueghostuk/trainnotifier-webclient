/// <reference path="trainModels.ts" />
/// <reference path="webApi.ts" />
/// <reference path="websockets.ts" />
/// <reference path="../typings/leaflet/leaflet.d.ts" />
/// <reference path="global.ts" />
/// <reference path="ViewModels.ts" />
/// <reference path="../typings/knockout.mapping/knockout.mapping.d.ts" />
/// <reference path="../typings/knockout/knockout.d.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/moment/moment.d.ts" />

var currentLocation = new TrainNotifier.KnockoutModels.CurrentLocation();
var titleModel = new TrainNotifier.KnockoutModels.Train.TrainTitleViewModel();

var _lastTrainData: ISingleTrainMovementResult;

var scheduleStops: KnockoutObservableArray<TrainNotifier.KnockoutModels.Train.ScheduleStop> = ko.observableArray();
var liveStops: KnockoutObservableArray<TrainNotifier.KnockoutModels.Train.LiveStopBase> = ko.observableArray();
var currentTrainDetails = new TrainNotifier.KnockoutModels.Train.TrainDetails();

var currentTiplocs: IStationTiploc[] = [];

var map: L.Map;
var webSockets = new TrainNotifier.WebSockets();

var thisPage: IPage = {
    setCommand: function (command) {
        $("#global-search-box").val(command);
        document.location.hash = command;
    },
    parseCommand: function () {
        var cmdString = this.getCommand();
        var idx = cmdString.indexOf("/");
        if (idx == -1)
            return false;

        var cmd = cmdString.substring(0, idx);
        var args = cmdString.substring(idx + 1);

        $("#commandOptions > li.active").removeClass("active");
        $("#commandOptions > li#" + cmd).addClass("active");

        if (cmd == "id") {
            getById(args);
            return true;
        } else if (cmd == "get" || cmd == "sub") {
            var subscribe = cmd == "sub";
            var hashIdx = args.indexOf('/');
            var date = "";
            var trainUid = "";
            if (hashIdx === -1) {
                trainUid = args;
                date = moment().format(TrainNotifier.DateTimeFormats.dateQueryFormat);
                this.setCommand(cmdString + "/" + moment().format(TrainNotifier.DateTimeFormats.dateQueryFormat));
            } else {
                trainUid = args.substring(0, hashIdx);
                date = args.substring(hashIdx + 1)
            }
            getTrainData(trainUid, date, subscribe);
            return true;
        }

        return false;
    },
    getCommand: function () {
        return $("#global-search-box").val();
    },
    wsOpenCommand: function () {
        this.parseCommand();
    },
    setStatus: function (status: string) {
        $("#status").html(status);
    }
};

TrainNotifier.Common.page = thisPage;
var webApi: IWebApi;

$(function () {
    webApi = new TrainNotifier.WebApi();
    TrainNotifier.Common.webApi = webApi;

    ko.applyBindings(liveStops, $("#trains").get(0));
    ko.applyBindings(currentLocation, $(".station-details").get(0));
    ko.applyBindings(scheduleStops, $("#schedule").get(0));
    ko.applyBindings(scheduleStops, $("#mix").get(0));
    ko.applyBindings(titleModel, $("#title").get(0));
    ko.applyBindings(currentTrainDetails, $("#details").get(0));

    if (document.location.hash.length > 0) {
        thisPage.setCommand(document.location.hash.substr(1));
    }
    $('a[data-toggle="tab"]').on('shown', function (e) {
        if ($(e.target).attr("href") == "#map" && !map) {
            map = new L.Map('map').setView(new L.LatLng(51.505, -0.09), 13);
            var layer = new L.TileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
                subdomains: ["1", "2", "3", "4"],
                attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a><img src="http://developer.mapquest.com/content/osm/mq_logo.png">. Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>.',
                maxZoom: 18
            });
            layer.addTo(map);

            loadScheduleMap();
            loadLiveMap();
        }
    });

    try {
        connectWs();
    } catch (err) {
        console.error("Failed to connect to web socket server: {0}", err);
    }
});

function reset() {
    scheduleStops.removeAll();
    liveStops.removeAll();
    currentTrainDetails.reset();
    currentTiplocs = [];
}

function loadScheduleMap() {
    if (!_lastTrainData
        || !_lastTrainData.Movement
        || !_lastTrainData.Movement.Schedule
        || !_lastTrainData.Movement.Schedule.Stops
        || !currentTiplocs)
        return;

    var points: Array<L.LatLng> = [];

    for (var i = 0; i < _lastTrainData.Movement.Schedule.Stops.length; i++) {
        var stop = _lastTrainData.Movement.Schedule.Stops[i];
        var stopTiploc = TrainNotifier.StationTiploc.findStationTiploc(stop.TiplocStanoxCode, currentTiplocs);
        if (stopTiploc && stopTiploc.Lat && stopTiploc.Lon) {
            var location = new L.LatLng(stopTiploc.Lat, stopTiploc.Lon);
            points.push(location);
            var marker = new L.Marker(location, {
                title: stopTiploc.Description
            });
            marker.addTo(map);
        }
    }
    var bounds = new L.LatLngBounds(points);
    map.fitBounds(bounds);
}

function loadLiveMap() {
    // need co-ords of stops from schedule
}

function connectWs() {
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
            for (var i = 0; i < stops.length; i++) {
                liveStops.push(new TrainNotifier.KnockoutModels.Train.BerthLiveStop(berthSteps[i]));
            }
        }
    });
    setTimeout(function () {
        if (webSockets.state !== WebSocket.OPEN) {
            thisPage.wsOpenCommand();
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
    if (webSockets && webSockets.state == WebSocket.OPEN) {
        webSockets.send(command);
    }
}

function subTrain() {
    if (_lastTrainData && _lastTrainData.Movement.Actual && webSockets && webSockets.state == WebSocket.OPEN) {
        $("#commandOptions > li.active").removeClass("active");
        $("#commandOptions > li#sub").addClass("active");
        thisPage.setCommand("sub/"
            + _lastTrainData.Movement.Schedule.TrainUid + "/"
            + moment(_lastTrainData.Movement.Actual.OriginDepartTimestamp).format(TrainNotifier.DateTimeFormats.dateQueryFormat));
        doSubTrain();
    }
}

function getById(id) {
    $(".progress").show();
    $("#no-results-row").hide();
    webApi.getTrainMovementById(id).done(function (data) {
        if (data) {
            $("#commandOptions > li.active").removeClass("active");
            $("#commandOptions > li#get").addClass("active");
            thisPage.setCommand("get/" + data.TrainUid + "/" + moment(data.SchedOriginDeparture).format(TrainNotifier.DateTimeFormats.dateUrlFormat));
            getTrainData(data.TrainUid, moment(data.SchedOriginDeparture).format(TrainNotifier.DateTimeFormats.dateQueryFormat), false);
        } else {
            $("#no-results-row").show();
            $(".progress").hide();
        }
    }).fail(function () {
        $(".progress").hide();
        $("#error-row").show();
    });
}

function getTrainData(trainUid, date, subscribe: bool) {
    $(".progress").show();
    $("#no-results-row").hide();
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
                titleModel.id(data.Movement.Schedule.Headcode);
            }
            if (data.Movement.Schedule && data.Movement.Schedule.Stops.length > 0) {
                for (var i = 0; i < data.Movement.Schedule.Stops.length; i++) {
                    scheduleStops.push(new TrainNotifier.KnockoutModels.Train.ScheduleStop(
                        data.Movement.Schedule.Stops[i], currentTiplocs));
                }

                if (data.Movement.ChangeOfOrigins.length > 0) {
                    var coo = data.Movement.ChangeOfOrigins[0];
                    var cooTiploc = TrainNotifier.StationTiploc.findStationTiploc(coo.NewOriginStanoxCode, currentTiplocs);
                    titleModel.from(cooTiploc.Description.toLowerCase());
                    titleModel.start(moment(coo.NewDepartureTime).format(TrainNotifier.DateTimeFormats.shortTimeFormat));
                } else {
                    var start = data.Movement.Schedule.Stops[0];
                    var startTiploc = TrainNotifier.StationTiploc.findStationTiploc(
                        start.TiplocStanoxCode, currentTiplocs);
                    titleModel.from(startTiploc.Description.toLowerCase());
                    var departureTs = start.PublicDeparture ? start.PublicDeparture : start.Departure;
                    titleModel.start(moment(departureTs, TrainNotifier.DateTimeFormats.timeFormat)
                        .format(TrainNotifier.DateTimeFormats.shortTimeFormat));
                }
                if (data.Movement.Cancellations.length > 0) {
                    var cancel = data.Movement.Cancellations[0];
                    var cancelAtTiploc = TrainNotifier.StationTiploc.findStationTiploc(cancel.CancelledAtStanoxCode, currentTiplocs);
                    titleModel.to(cancelAtTiploc.Description.toLowerCase());
                    titleModel.end(moment(cancel.CancelledTimestamp).format(TrainNotifier.DateTimeFormats.shortTimeFormat));
                } else if (data.Movement.Schedule.Stops.length > 1) {
                    var end = data.Movement.Schedule.Stops[data.Movement.Schedule.Stops.length - 1];
                    var endTiploc = TrainNotifier.StationTiploc.findStationTiploc(
                        end.TiplocStanoxCode, currentTiplocs);
                    titleModel.to(endTiploc.Description.toLowerCase());
                    var arrivalTs = end.PublicArrival ? end.PublicArrival : end.Arrival;
                    titleModel.end(moment(arrivalTs, TrainNotifier.DateTimeFormats.timeFormat).format(TrainNotifier.DateTimeFormats.shortTimeFormat));
                }
            } else {
                titleModel.to(null);
                titleModel.from(null);
                titleModel.start(null);
                titleModel.end(null);
            }
            if (data.Movement.Actual) {
                titleModel.id(data.Movement.Actual.HeadCode);
                if (data.Movement.Actual.Stops.length > 0) {
                    var arrivals = data.Movement.Actual.Stops.filter(function (stop: IRunningTrainActualStop) {
                        return stop.EventType === TrainNotifier.EventType.Arrival;
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
        $("#error-row").show();
    }).always(function () {
        $(".progress").hide();
    });
}

function doSubTrain() {
    sendWsCommand("subtrain:" + _lastTrainData.Movement.Actual.TrainId);
}

function getAssociations(date?: string) {
    if (!_lastTrainData || !_lastTrainData.Movement || !_lastTrainData.Movement.Schedule || (!_lastTrainData.Movement.Actual && !date)) {
        return;
    }
    var queryDate = _lastTrainData.Movement.Actual ? _lastTrainData.Movement.Actual.OriginDepartTimestamp : date;
    return webApi.getTrainMovementAssociations(
        _lastTrainData.Movement.Schedule.TrainUid,
        moment(queryDate).format(TrainNotifier.DateTimeFormats.dateQueryFormat))
        .done(function (associations : IAssociation[]) {
            if (associations.length == 0)
                return;

            for(var i = 0; i < associations.length; i++){
                currentTrainDetails.associations.push(new TrainNotifier.KnockoutModels.Train.TrainAssociation(
                    associations[i], _lastTrainData.Movement.Schedule.TrainUid, _lastTrainData.Movement.Actual.OriginDepartTimestamp));
            }
        });
}

function listStation(stanox) {
    var tiploc = TrainNotifier.StationTiploc.findStationTiploc(stanox, currentTiplocs);
    if (tiploc) {
        currentLocation.update(tiploc);
    } else {
        webApi.getStanox(stanox).done(function (data: IStationTiploc) {
            currentLocation.update(data);
        });
    }
}

function tryConnect() {
    if (webSockets && webSockets.state === WebSocket.CLOSED) {
        webSockets.connect();
    }
}
