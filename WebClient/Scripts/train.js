/// <reference path="moment.js" />
/// <reference path="jquery-1.9.1.js" />
/// <reference path="ViewModels.js" />
/// <reference path="knockout.mapping-latest.js" />
/// <reference path="knockout-2.2.1.js" />

var currentLocation = new LocationViewModel();
var currentTrain = new LiveTrainViewModel();
var mixModel = new ScheduleTrainViewModel(currentLocation);
var titleModel = new TrainTitleViewModel();
var detailsModel = new TrainDetailsViewModel();

var timeFormat = "HH:mm:ss";
var dateFormat = "DD/MM/YY HH:mm:ss";
var dateQueryFormat = "YYYY-MM-DD";
var dateUrlFormat = "YYYY/MM/DD";
var _lastLiveData;
var _lastScheduleData;
var _lastStopNumber = 0;
var map;

var self = this;

thisPage = {
    setCommand: function (command) {
        self.setCommand(command);
    },
    parseCommand: function () {
        return self.parseCommand();
    },
    getCommand: function () {
        return $("#global-search-box").val();
    }
};

$(function () {
    ko.applyBindings(currentTrain, $("#trains").get(0));
    ko.applyBindings(currentLocation, $(".station-details").get(0));
    ko.applyBindings(mixModel, $("#schedule").get(0));
    ko.applyBindings(mixModel, $("#mix").get(0));
    ko.applyBindings(titleModel, $("#title").get(0));
    ko.applyBindings(detailsModel, $("#details").get(0));

    if (document.location.hash.length > 0) {
        setCommand(document.location.hash.substr(1));
    }
    $('a[data-toggle="tab"]').on('shown', function (e) {
        if ($(e.target).attr("href") == "#map" && !map) {
            map = L.map('map').setView([51.505, -0.09], 13);
            L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
                subdomains: ['1', '2', '3', '4'],
                attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a><img src="http://developer.mapquest.com/content/osm/mq_logo.png">. Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>.',
                maxZoom: 18
            }).addTo(map);

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
            points.push([tiploc.Lat, tiploc.Lon]);
            L.marker([tiploc.Lat, tiploc.Lon], {
                title: tiploc.Description
            }).addTo(map);
        }
    }
    map.fitBounds(points);
}

function loadLiveMap() {
    // need co-ords of stops from schedule
}

function setStatus(status) {
    $("#status").html(status);
}

function connectWs() {
    connect();

    ws.onmessage = function (msg) {
        var data = jQuery.parseJSON(msg.data);
        if (data.Command == "subtrainupdate") {
            data = data.Response;
            var lu = moment().format(dateFormat);
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
        if (ws.readyState != WebSocket.OPEN) {
            wsOpenCommand();
        }
    }, 2000);
}

function wsOpenCommand() {
    parseCommand();
}

function addStop(stopEl, terminateStop, mixIn) {
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
    loadLocation(stanox, function (data) {
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
    if (ws && ws.readyState == WebSocket.OPEN) {
        ws.send(command);
    }
}

function setCommand(command) {
    $("input.search-query").val(command);
    document.location.hash = command;
}

function subTrain() {
    if (_lastLiveData) {
        $("#commandOptions > li.active").removeClass("active");
        $("#commandOptions > li#sub").addClass("active");
        setCommand("sub/" + _lastLiveData.TrainUid + "/" + moment(_lastLiveData.SchedOriginDeparture).format(dateQueryFormat));
        doSubTrain();
    }
}

function parseCommand() {
    var cmdString = thisPage.getCommand();
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
            date = moment().format(dateQueryFormat);
            setCommand(cmdString + "/" + moment().format(dateQueryFormat));
        } else {
            trainUid = args.substring(0, hashIdx);
            date = args.substring(hashIdx + 1)
        }
        getByUid(trainUid, date, subscribe);
        return true;
    }

    return false;
}

function getById(id) {
    $(".progress").show();
    $("#no-results-row").hide();
    $.getJSON("http://" + server + ":" + apiPort + "/TrainMovement/" + id)
        .then(function (data) {
            if (data) {
                $("#commandOptions > li.active").removeClass("active");
                $("#commandOptions > li#get").addClass("active");
                setCommand("get/" + data.TrainUid + "/" + moment(data.SchedOriginDeparture).format(dateUrlFormat));
                getByUid(data.TrainUid, moment(data.SchedOriginDeparture).format(dateQueryFormat), false);
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
    getTrainData("http://" + server + ":" + apiPort + "/TrainMovement/Uid/" + trainUid + "/" + date, subscribe);
}

function getTrainData(url, subscribe) {
    $(".progress").show();
    $("#no-results-row").hide();
    sendWsCommand("unsubtrain:");

    $.getJSON(url).done(function (data, textStatus, jqXHR) {
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

        return getSchedule(data, data.TrainId, data.TrainUid);
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
    return $.getJSON("http://" + server + ":" + apiPort + "/Association/" + data.TrainUid + "/" + moment(data.SchedOriginDeparture).format(dateQueryFormat))
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
    return $.getJSON("http://" + server + ":" + apiPort + "/Schedule/uid/" + data.TrainUid + "/" + moment(data.SchedOriginDeparture).format(dateQueryFormat))
        .done(function (schedule) {
            _lastScheduleData = schedule;
            mixModel.updateFromJson(schedule);
            detailsModel.updateFromJson(schedule, _lastLiveData);

            if (schedule && schedule.Stops && schedule.Stops.length > 0) {
                if (_lastLiveData && _lastLiveData.ChangeOfOrigin && _lastLiveData.ChangeOfOrigin.NewOrigin) {
                    titleModel.From(_lastLiveData.ChangeOfOrigin.NewOrigin.Description.toLowerCase());
                    titleModel.Start(moment(_lastLiveData.ChangeOfOrigin.NewDepartureTime).format(timeFormat));
                } else {
                    titleModel.From(schedule.Stops[0].Tiploc.Description.toLowerCase());
                    var departure = schedule.Stops[0].PublicDeparture ?
                        schedule.Stops[0].PublicDeparture : schedule.Stops[0].Departure;
                    titleModel.Start(moment(departure, "HH:mm:ss").format(timeFormat));
                }
                if (_lastLiveData && _lastLiveData.Cancellation && _lastLiveData.Cancellation.CancelledAt) {
                    titleModel.To(_lastLiveData.Cancellation.CancelledAt.Description.toLowerCase());
                    titleModel.End(moment(_lastLiveData.Cancellation.CancelledTimestamp).format(timeFormat));
                } else if (schedule.Stops.length > 1) {
                    titleModel.To(schedule.Stops[schedule.Stops.length - 1].Tiploc.Description.toLowerCase());
                    var arrival = schedule.Stops[schedule.Stops.length - 1].PublicArrival ?
                        schedule.Stops[schedule.Stops.length - 1].PublicArrival : schedule.Stops[schedule.Stops.length - 1].Arrival;
                    titleModel.End(moment(arrival, "HH:mm:ss").format(timeFormat));
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

function mixInStop(step, stopNumber) {
    var stopNumber = stopNumber || step.ScheduleStopNumber;
    if (stopNumber || stopNumber == 0) {
        var time = moment(step.ActualTimeStamp).format(timeFormat);
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

function mixInLiveStop(stop, stopNumber) {
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
    $.getJSON("http://" + server + ":" + apiPort + "/Stanox/" + stanox)
        .done(function (data) {
            currentLocation.locationStanox(data.Name);
            currentLocation.locationTiploc(data.Tiploc);
            currentLocation.locationDescription(data.Description);
            currentLocation.locationCRS(data.CRS);
            currentLocation.stationName(data.StationName);
        });
}
