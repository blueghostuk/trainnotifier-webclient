/// <reference path="websockets.ts" />
/// <reference path="../typings/leaflet/leaflet.d.ts" />
/// <reference path="global.ts" />
/// <reference path="ViewModels.ts" />
/// <reference path="webApi.ts" />
/// <reference path="../typings/knockout.mapping/knockout.mapping.d.ts" />
/// <reference path="../typings/knockout/knockout.d.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/moment/moment.d.ts" />

var currentLocation = new LocationViewModel();
var currentTrain = new LiveTrainViewModel();
var mixModel = new ScheduleTrainViewModel(currentLocation);
var titleModel = new TrainTitleViewModel();
var detailsModel = new TrainDetailsViewModel();

var _lastLiveData;
var _lastScheduleData;
var _lastStopNumber = 0;
var map: L.Map;
var webSockets = new TrainNotifier.WebSockets();

var thisPage : IPage = {
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
        } else {
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
            getByUid(trainUid, date, subscribe);
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

    ko.applyBindings(currentTrain, $("#trains").get(0));
    ko.applyBindings(currentLocation, $(".station-details").get(0));
    ko.applyBindings(mixModel, $("#schedule").get(0));
    ko.applyBindings(mixModel, $("#mix").get(0));
    ko.applyBindings(titleModel, $("#title").get(0));
    ko.applyBindings(detailsModel, $("#details").get(0));

    if (document.location.hash.length > 0) {
        thisPage.setCommand(document.location.hash.substr(1));
    }
    $('a[data-toggle="tab"]').on('shown', function (e) {
        if ($(e.target).attr("href") == "#map" && !map) {
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

    try {
        connectWs();
    } catch (err) {
        console.error("Failed to connect to web socket server: {0}", err);
    }
});

function loadScheduleMap() {
    var points = [];
    for (var i in _lastScheduleData.Stops) {
        var tiploc = _lastScheduleData.Stops[i].Tiploc;
        if (tiploc && tiploc.Lat && tiploc.Lon) {
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
    // need co-ords of stops from schedule
}

function connectWs() {
    webSockets.connect();

    webSockets.ws.onmessage = function (msg) {
        var data : any = jQuery.parseJSON(msg.data);
        if (data.Command == "subtrainupdate") {
            data = data.Response;
            var lu = moment().format(TrainNotifier.DateTimeFormats.dateTimeFormat);
            currentTrain.LastUpdate(lu);

            for (var i in data) {
                addStop(data[i], true, true);
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
            data = data.Response;
            for (var i in data) {
                currentTrain.addBerthStop(data[i]);
            }
        }
    };
    setTimeout(function () {
        if (webSockets.ws.readyState != WebSocket.OPEN) {
            thisPage.wsOpenCommand();
        }
    }, 2000);
}

function addStop(stopEl, terminateStop?, mixIn?) {
    // train terminated so unsubscribe
    if (terminateStop && stopEl.State == 1) {
        sendWsCommand("unsubtrain:");
    }

    currentTrain.addStop(stopEl);

    if (mixIn)
        mixInLiveStop(stopEl);

    fetchLocation(stopEl.Stanox);
    if (stopEl.NextStanox && stopEl.NextStanox.length > 0)
        fetchLocation(stopEl.NextStanox);
}

function fetchLocation(stanox) {
    webApi.getStanox(stanox).done(function (data) {
        if (!data)
            return;

        var html = "";
        if (data.StationName) {
            html = data.StationName;
        } else {
            html = data.Tiploc;
        }
        if (data.CRS) {
            html += "(" + data.CRS + ")";
        }
        $("." + data.Name).html(html);
        $("." + data.Name).attr('title', data.Description + '(' + data.Name + ')');
        $("." + data.Name).tooltip();
        $("." + data.Name).data("title", html);
    });
}

function sendWsCommand(command) {
    if (webSockets && webSockets.ws && webSockets.ws.readyState == WebSocket.OPEN) {
        webSockets.ws.send(command);
    }
}

function subTrain() {
    if (_lastLiveData) {
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
        if (data) {
            $("#commandOptions > li.active").removeClass("active");
            $("#commandOptions > li#get").addClass("active");
            thisPage.setCommand("get/" + data.TrainUid + "/" + moment(data.SchedOriginDeparture).format(TrainNotifier.DateTimeFormats.dateUrlFormat));
            getByUid(data.TrainUid, moment(data.SchedOriginDeparture).format(TrainNotifier.DateTimeFormats.dateQueryFormat), false);
        } else {
            $("#no-results-row").show();
            $(".progress").hide();
        }
    }).fail(function () {
        $(".progress").hide();
        $("#error-row").show();
    });
}

function getByUid(trainUid, date, subscribe) {
    getTrainData(webApi.getTrainMovementByUid(trainUid, date), subscribe);
}

function getTrainData(action : JQueryPromise, subscribe : bool) {
    $(".progress").show();
    $("#no-results-row").hide();
    sendWsCommand("unsubtrain:");

    action.done(function (data, textStatus, jqXHR) {
        if (!data) {
            $("#no-results-row").show();
            return;
        }
        // if multiple, take first
        if (data.length && data.length > 0)
            data = data[0];

        titleModel.Id(data.HeadCode);

        currentTrain.updateFromJSON(data);

        if (data.SchedOriginStanox && data.SchedOriginStanox.length > 0)
            fetchLocation(data.SchedOriginStanox);

        for (var i in data.Steps) {
            addStop(data.Steps[i]);
        }
        $(".tooltip-dynamic").tooltip();
    }).then(function (data) {
        if (!data) {
            return;
        }
        // if array returned, use the first value
        if (data.length && data.length >= 0)
            data = data[0];

        return getSchedule(data);
    }).then(function () {
        return getAssociations(_lastLiveData);
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
    sendWsCommand("subtrain:" + _lastLiveData.TrainId);
}

function getAssociations(data) {
    detailsModel.clearAssociations();
    if (!data) {
        return;
    }
    return webApi.getTrainMovementAssociations(
        data.TrainUid,
        moment(data.SchedOriginDeparture).format(TrainNotifier.DateTimeFormats.dateQueryFormat))
        .done(function (associations) {
            if (associations.length == 0)
                return;

            for (var i in associations) {
                detailsModel.addAssociation(associations[i], data.TrainUid, moment(data.SchedOriginDeparture));
            }
        });
}

function getSchedule(data) {
    _lastLiveData = data;
    return webApi.getSchedule(
        data.TrainUid,
        moment(data.SchedOriginDeparture).format(TrainNotifier.DateTimeFormats.dateQueryFormat))
        .done(function (schedule) {
            _lastScheduleData = schedule;
            mixModel.updateFromJson(schedule);
            detailsModel.updateFromJson(schedule, _lastLiveData);

            if (schedule && schedule.Stops && schedule.Stops.length > 0) {
                if (_lastLiveData && _lastLiveData.ChangeOfOrigin && _lastLiveData.ChangeOfOrigin.NewOrigin) {
                    titleModel.From(_lastLiveData.ChangeOfOrigin.NewOrigin.Description.toLowerCase());
                    titleModel.Start(moment(_lastLiveData.ChangeOfOrigin.NewDepartureTime).format(TrainNotifier.DateTimeFormats.timeFormat));
                } else {
                    titleModel.From(schedule.Stops[0].Tiploc.Description.toLowerCase());
                    var departure = schedule.Stops[0].PublicDeparture ?
                        schedule.Stops[0].PublicDeparture : schedule.Stops[0].Departure;
                    titleModel.Start(moment(departure, TrainNotifier.DateTimeFormats.timeFormat).format(TrainNotifier.DateTimeFormats.timeFormat));
                }
                if (_lastLiveData && _lastLiveData.Cancellation && _lastLiveData.Cancellation.CancelledAt) {
                    titleModel.To(_lastLiveData.Cancellation.CancelledAt.Description.toLowerCase());
                    titleModel.End(moment(_lastLiveData.Cancellation.CancelledTimestamp).format(TrainNotifier.DateTimeFormats.timeFormat));
                } else if (schedule.Stops.length > 1) {
                    titleModel.To(schedule.Stops[schedule.Stops.length - 1].Tiploc.Description.toLowerCase());
                    var arrival = schedule.Stops[schedule.Stops.length - 1].PublicArrival ?
                        schedule.Stops[schedule.Stops.length - 1].PublicArrival : schedule.Stops[schedule.Stops.length - 1].Arrival;
                    titleModel.End(moment(arrival, TrainNotifier.DateTimeFormats.timeFormat).format(TrainNotifier.DateTimeFormats.timeFormat));
                } else {
                    titleModel.To(null);
                }
            } else {
                titleModel.To(null);
                titleModel.From(null);
                titleModel.Start(null);
                titleModel.End(null);
            }

            for (var i = 0; i < _lastLiveData.Steps.length; i++) {
                mixInStop(_lastLiveData.Steps[i]);
            }
        });
}

function mixInStop(step, stopNumber?) {
    var stopNumber = stopNumber || step.ScheduleStopNumber;
    if (stopNumber || stopNumber == 0) {
        var time = moment(step.ActualTimeStamp).format(TrainNotifier.DateTimeFormats.timeFormat);
        switch (step.EventType) {
            case "DEPARTURE":
                mixModel.Stops()[stopNumber].ActualDeparture(time);
                break;
            case "ARRIVAL":
                mixModel.Stops()[stopNumber].ActualArrival(time);
                break;
        }
        _lastStopNumber = stopNumber;
    }
}

function mixInLiveStop(stop, stopNumber?) {
    var stopLook = stopNumber || _lastStopNumber;
    try {
        var latestStanox = mixModel.Stops()[stopLook].Tiploc.Stanox();
        if (stop.Stanox == latestStanox) {
            mixInStop(stop, stopLook);
        } else {
            mixInLiveStop(stop, ++stopLook);
        }
    } catch (err) { }
}

function listStation(stanox) {
    webApi.getStanox(stanox).done(function (data: IStanox) {
        currentLocation.locationStanox(data.Name);
        currentLocation.locationTiploc(data.Tiploc);
        currentLocation.locationDescription(data.Description);
        currentLocation.locationCRS(data.CRS);
        currentLocation.stationName(data.StationName);
    });
}
