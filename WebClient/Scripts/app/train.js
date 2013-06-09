var currentLocation = new LocationViewModel();
var mixModel = new TrainNotifier.ViewModels.ScheduleTrainViewModel();
var titleModel = new TrainNotifier.ViewModels.TrainTitleViewModel();
var detailsModel = new TrainDetailsViewModel();
var scheduleStops = ko.observableArray();
var liveStops = ko.observableArray();
var _lastLiveData;
var _lastScheduleData;
var _lastStopNumber = 0;
var map;
var webSockets = new TrainNotifier.WebSockets();
var thisPage = {
    setCommand: function (command) {
        $("#global-search-box").val(command);
        document.location.hash = command;
    },
    parseCommand: function () {
        var cmdString = this.getCommand();
        var idx = cmdString.indexOf("/");
        if(idx == -1) {
            return false;
        }
        var cmd = cmdString.substring(0, idx);
        var args = cmdString.substring(idx + 1);
        $("#commandOptions > li.active").removeClass("active");
        $("#commandOptions > li#" + cmd).addClass("active");
        if(cmd == "id") {
            getById(args);
            return true;
        } else {
            var subscribe = cmd == "sub";
            var hashIdx = args.indexOf('/');
            var date = "";
            var trainUid = "";
            if(hashIdx === -1) {
                trainUid = args;
                date = moment().format(TrainNotifier.DateTimeFormats.dateQueryFormat);
                this.setCommand(cmdString + "/" + moment().format(TrainNotifier.DateTimeFormats.dateQueryFormat));
            } else {
                trainUid = args.substring(0, hashIdx);
                date = args.substring(hashIdx + 1);
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
    setStatus: function (status) {
        $("#status").html(status);
    }
};
TrainNotifier.Common.page = thisPage;
var webApi;
$(function () {
    webApi = new TrainNotifier.WebApi();
    TrainNotifier.Common.webApi = webApi;
    ko.applyBindings(liveStops, $("#trains").get(0));
    ko.applyBindings(currentLocation, $(".station-details").get(0));
    ko.applyBindings(scheduleStops, $("#schedule").get(0));
    ko.applyBindings(mixModel, $("#mix").get(0));
    ko.applyBindings(titleModel, $("#title").get(0));
    ko.applyBindings(detailsModel, $("#details").get(0));
    if(document.location.hash.length > 0) {
        thisPage.setCommand(document.location.hash.substr(1));
    }
    $('a[data-toggle="tab"]').on('shown', function (e) {
        if($(e.target).attr("href") == "#map" && !map) {
            map = new L.Map('map').setView(new L.LatLng(51.505, -0.09), 13);
            var layer = new L.TileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
                subdomains: "1 2 3 4",
                attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a><img src="http://developer.mapquest.com/content/osm/mq_logo.png">. Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>.',
                maxZoom: 18
            });
            layer.addTo(map);
            loadScheduleMap();
            loadLiveMap();
        }
    });
    try  {
        connectWs();
    } catch (err) {
        console.error("Failed to connect to web socket server: {0}", err);
    }
});
function reset() {
    scheduleStops.removeAll();
    liveStops.removeAll();
}
function loadScheduleMap() {
    var points = [];
    for(var i in _lastScheduleData.Stops) {
        var tiploc = _lastScheduleData.Stops[i].Tiploc;
        if(tiploc && tiploc.Lat && tiploc.Lon) {
            points.push(new L.LatLng(tiploc.Lat, tiploc.Lon));
            var marker = new L.Marker(new L.LatLng(tiploc.Lat, tiploc.Lon), {
                title: tiploc.Description
            });
            marker.addTo(map);
        }
    }
    map.fitBounds(points);
}
function loadLiveMap() {
}
function connectWs() {
    webSockets.connect();
    webSockets.onMessageHandler(function (msg) {
        var data = jQuery.parseJSON(msg.data);
        if(data.Command == "subtrainupdate") {
            data = data.Response;
            var lu = moment().format(TrainNotifier.DateTimeFormats.dateTimeFormat);
            for(var i in data) {
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
        } else if(data.Command == "subtrainupdate-berth") {
            data = data.Response;
            for(var i in data) {
            }
        }
    });
    setTimeout(function () {
        if(webSockets.state !== WebSocket.OPEN) {
            thisPage.wsOpenCommand();
        }
    }, 2000);
}
function addStop(stopEl, terminateStop, mixIn) {
    if(mixIn) {
        mixInLiveStop(stopEl);
    }
}
function fetchLocation(stanox) {
    webApi.getStanox(stanox).done(function (data) {
        if(!data) {
            return;
        }
        var html = "";
        if(data.StationName) {
            html = data.StationName;
        } else {
            html = data.Tiploc;
        }
        if(data.CRS) {
            html += "(" + data.CRS + ")";
        }
        $("." + data.Stanox).html(html);
        $("." + data.Stanox).attr('title', data.Description + '(' + data.Stanox + ')');
        $("." + data.Stanox).tooltip();
        $("." + data.Stanox).data("title", html);
    });
}
function sendWsCommand(command) {
    if(webSockets && webSockets && webSockets.state == WebSocket.OPEN) {
        webSockets.send(command);
    }
}
function subTrain() {
    if(_lastLiveData) {
        $("#commandOptions > li.active").removeClass("active");
        $("#commandOptions > li#sub").addClass("active");
        thisPage.setCommand("sub/" + _lastLiveData.TrainUid + "/" + moment(_lastLiveData.SchedOriginDeparture).format(TrainNotifier.DateTimeFormats.dateQueryFormat));
        doSubTrain();
    }
}
function getById(id) {
    $(".progress").show();
    $("#no-results-row").hide();
    webApi.getTrainMovementById(id).done(function (data) {
        if(data) {
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
function getTrainData(trainUid, date, subscribe) {
    $(".progress").show();
    $("#no-results-row").hide();
    sendWsCommand("unsubtrain:");
    reset();
    webApi.getTrainMovementByUid(trainUid, date).done(function (data) {
        if(!data) {
            $("#no-results-row").show();
            return;
        }
        if(data.Movement) {
            if(data.Movement.Schedule && data.Movement.Schedule.Stops.length > 0) {
                for(var i = 0; i < data.Movement.Schedule.Stops.length; i++) {
                    scheduleStops.push(new TrainNotifier.KnockoutModels.Train.ScheduleStop(data.Movement.Schedule.Stops[i], data.Tiplocs));
                }
            }
            if(data.Movement.Actual) {
                titleModel.Id(data.Movement.Actual.HeadCode);
                if(data.Movement.Actual.Stops.length > 0) {
                    var arrivals = data.Movement.Actual.Stops.filter(function (stop) {
                        return stop.EventType === TrainNotifier.EventType.Arrival;
                    });
                    var departures = data.Movement.Actual.Stops.filter(function (stop) {
                        return stop.EventType === TrainNotifier.EventType.Departure;
                    });
                    var modelStops = [];
                    for(var i = 0; i < arrivals.length; i++) {
                        modelStops.push(new TrainNotifier.KnockoutModels.Train.ExistingLiveStop(data.Tiplocs, arrivals[i]));
                    }
                    for(var i = 0; i < departures.length; i++) {
                        var departure = departures[i];
                        var setDept = false;
                        for(var j = 0; j < modelStops.length; j++) {
                            if(modelStops[j].validDeparture(departure.TiplocStanoxCode, data.Tiplocs)) {
                                modelStops[j].updateExistingDeparture(departure, data.Tiplocs);
                                setDept = true;
                                break;
                            }
                        }
                        if(!setDept) {
                            modelStops.push(new TrainNotifier.KnockoutModels.Train.ExistingLiveStop(data.Tiplocs, null, departure));
                        }
                    }
                    var orderedModelStops = modelStops.sort(function (a, b) {
                        var aTime = a.timeStampForSorting;
                        var bTime = b.timeStampForSorting;
                        if(aTime < bTime) {
                            return -1;
                        }
                        if(aTime > bTime) {
                            return 1;
                        }
                        return 0;
                    });
                    for(var i = 0; i < orderedModelStops.length; i++) {
                        liveStops.push(orderedModelStops[i]);
                    }
                }
            }
        }
        $(".tooltip-dynamic").tooltip();
    }).fail(function () {
        $("#error-row").show();
    }).always(function () {
        $(".progress").hide();
    });
}
function doSubTrain() {
    sendWsCommand("subtrain:" + _lastLiveData.TrainId);
}
function getAssociations(data) {
    detailsModel.clearAssociations();
    if(!data) {
        return;
    }
    return webApi.getTrainMovementAssociations(data.TrainUid, moment(data.SchedOriginDeparture).format(TrainNotifier.DateTimeFormats.dateQueryFormat)).done(function (associations) {
        if(associations.length == 0) {
            return;
        }
        for(var i in associations) {
            detailsModel.addAssociation(associations[i], data.TrainUid, moment(data.SchedOriginDeparture));
        }
    });
}
function getSchedule(data) {
    _lastLiveData = data;
    return webApi.getSchedule(data.TrainUid, moment(data.SchedOriginDeparture).format(TrainNotifier.DateTimeFormats.dateQueryFormat)).done(function (schedule) {
        _lastScheduleData = schedule;
        mixModel.updateFromJson(schedule);
        detailsModel.updateFromJson(schedule, _lastLiveData);
        if(schedule && schedule.Stops && schedule.Stops.length > 0) {
            if(_lastLiveData && _lastLiveData.ChangeOfOrigin && _lastLiveData.ChangeOfOrigin.NewOrigin) {
                titleModel.From(_lastLiveData.ChangeOfOrigin.NewOrigin.Description.toLowerCase());
                titleModel.Start(moment(_lastLiveData.ChangeOfOrigin.NewDepartureTime).format(TrainNotifier.DateTimeFormats.shortTimeFormat));
            } else {
                titleModel.From(schedule.Stops[0].Tiploc.Description.toLowerCase());
                var departure = schedule.Stops[0].PublicDeparture ? schedule.Stops[0].PublicDeparture : schedule.Stops[0].Departure;
                titleModel.Start(moment(departure, TrainNotifier.DateTimeFormats.timeFormat).format(TrainNotifier.DateTimeFormats.shortTimeFormat));
            }
            if(_lastLiveData && _lastLiveData.Cancellation && _lastLiveData.Cancellation.CancelledAt) {
                titleModel.To(_lastLiveData.Cancellation.CancelledAt.Description.toLowerCase());
                titleModel.End(moment(_lastLiveData.Cancellation.CancelledTimestamp).format(TrainNotifier.DateTimeFormats.shortTimeFormat));
            } else if(schedule.Stops.length > 1) {
                titleModel.To(schedule.Stops[schedule.Stops.length - 1].Tiploc.Description.toLowerCase());
                var arrival = schedule.Stops[schedule.Stops.length - 1].PublicArrival ? schedule.Stops[schedule.Stops.length - 1].PublicArrival : schedule.Stops[schedule.Stops.length - 1].Arrival;
                titleModel.End(moment(arrival, TrainNotifier.DateTimeFormats.timeFormat).format(TrainNotifier.DateTimeFormats.shortTimeFormat));
            } else {
                titleModel.To(null);
            }
        } else {
            titleModel.To(null);
            titleModel.From(null);
            titleModel.Start(null);
            titleModel.End(null);
        }
        for(var i = 0; i < _lastLiveData.Steps.length; i++) {
            mixInStop(_lastLiveData.Steps[i]);
        }
    });
}
function mixInStop(step, stopNumber) {
    var stopNumber = stopNumber || step.ScheduleStopNumber;
    if(stopNumber || stopNumber == 0) {
        var time = moment(step.ActualTimeStamp).format(TrainNotifier.DateTimeFormats.timeFormat);
        switch(step.EventType) {
            case "DEPARTURE":
                mixModel.Stops()[stopNumber].setActualDepartureTime(time);
                break;
            case "ARRIVAL":
                mixModel.Stops()[stopNumber].setActualArrivalTime(time);
                break;
        }
        _lastStopNumber = stopNumber;
    }
}
function mixInLiveStop(stop, stopNumber) {
    var stopLook = stopNumber || _lastStopNumber;
    try  {
        var latestStanox = mixModel.Stops()[stopLook].Tiploc.Stanox();
        if(stop.Stanox == latestStanox) {
            mixInStop(stop, stopLook);
        } else {
            mixInLiveStop(stop, ++stopLook);
        }
    } catch (err) {
    }
}
function listStation(stanox) {
    webApi.getStanox(stanox).done(function (data) {
        currentLocation.locationStanox(data.Stanox);
        currentLocation.locationTiploc(data.Tiploc);
        currentLocation.locationDescription(data.Description);
        currentLocation.locationCRS(data.CRS);
        currentLocation.stationName(data.StationName);
    });
}
function tryConnect() {
    if(webSockets && webSockets.state === WebSocket.CLOSED) {
        webSockets.connect();
    }
}
