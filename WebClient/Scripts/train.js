/// <reference path="moment.js" />
/// <reference path="jquery-1.9.1.js" />
/// <reference path="ViewModels.js" />
/// <reference path="knockout.mapping-latest.js" />
/// <reference path="knockout-2.2.1.js" />

var currentLocation = new LocationViewModel();
var currentTrain = new LiveTrainViewModel();
var mixModel = new ScheduleTrainViewModel();
var titleModel = new TrainTitleViewModel();

var timeFormat = "HH:mm:ss";
var dateFormat = "DD/MM/YY HH:mm:ss";
var _lastLiveData;
var _lastStopNumber = 0;

$(function () {

    var commands = [];
    commands.push('getuid:');
    commands.push('gettrain:');
    commands.push('subtrain:');
    $("#filter-command").typeahead({
        source: commands
    });

    ko.applyBindings(currentTrain, $("#trains").get(0));
    ko.applyBindings(currentLocation, $("#stationDetails").get(0));
    ko.applyBindings(mixModel, $("#schedule").get(0));
    ko.applyBindings(mixModel, $("#mix").get(0));
    ko.applyBindings(titleModel, $("#title").get(0));

    if (document.location.hash.length > 0) {
        setCommand(document.location.hash.substr(1));
    }

    try {
        connectWs();
    } catch (err) {
        console.error("Failed to connect to web socket server: {0}", err)
    }

    preLoadMap();
});

function setStatus(status) {
    $("#status").html(status);
}

function connectWs() {
    connect();

    ws.onmessage = function (msg) {
        var data = jQuery.parseJSON(msg.data);
        switch (data.Command) {
            case "subtrainupdate":
                data = data.Response;
                var lu = moment().format(dateFormat);
                currentTrain.LastUpdate(lu);
                if (mixModel) {
                    mixModel.LastUpdate(lu);
                }
                for (i in data) {
                    addStop(data[i], true, true);
                    $.when(mapStop(data[i])).then(function () {
                        centreMap();
                    });
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
                break;
        }
    };
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


function sendCommand(resetSub) {
    if (resetSub) {
        sendWsCommand("unsubtrain:");
    }
    var cmd = $("#filter-command").val();
    sendWsCommand(cmd);
    document.location.hash = cmd;
}

function sendWsCommand(command) {
    ws.send(command);
}

function setCommand(command) {
    $("#filter-command").val(command);
    document.location.hash = command;
}

function loadTrainSub(el) {
    setCommand('subtrain:' + $(el).html());
    _currentTrainSub = $(el).html();
    sendCommand(true);
}

function parseCommand() {
    var cmdString = $("#filter-command").val();
    var idx = cmdString.indexOf(":");
    if (idx == -1)
        return;

    var cmd = cmdString.substring(0, idx);
    var args = cmdString.substring(idx + 1);

    switch (cmd) {
        case 'gettrain':
            getTrain(args);
            return;
            break;
        case 'subtrain':
            getTrain(args, true);
            // still send command
            break;
        case 'getuid':
            var hashIdx = args.indexOf('#');
            if (hashIdx != -1) {
                getByUid(args.substring(0, hashIdx), args.substring(hashIdx + 1));
            }
            break;
    }
    sendCommand(true);
}

function getByUid(trainUid, date) {
    sendWsCommand("unsubtrain:");
    getTrainData("http://" + server + ":" + apiPort + "/TrainMovement/Uid/" + trainUid + "/" + date);
}

function getTrain(trainId, dontUnSub) {
    if (!dontUnSub) {
        sendWsCommand("unsubtrain:");
        setCommand('gettrain:' + trainId);
    }
    var split = trainId.split(':');
    if (split && split.length == 2) {
        trainId = split[0] + '/' + split[1];
    }
    getTrainData("http://" + server + ":" + apiPort + "/TrainMovement/" + trainId);
}

function getTrainData(url) {
    $(".progress").show();
    $("#no-results-row").hide();

    $.getJSON(url)
    .done(function (data, textStatus, jqXHR) {
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

        showCurrentTrainMap();
        for (i in data.Steps) {
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
    })
    .always(function () {
        $(".progress").hide();
    });
}

function getAssociations(data) {
    mixModel.clearAssociations();
    if (!data) {
        return;
    }
    return $.getJSON("http://" + server + ":" + apiPort + "/Association/" + data.TrainUid, {
        date: data.SchedOriginDeparture
    }).done(function (associations) {
        if (associations.length == 0)
            return;

        for (var i in associations) {
            mixModel.addAssociation(associations[i], data.TrainUid, moment(data.SchedOriginDeparture));
        }
    });
}

function getSchedule(data) {
    _lastLiveData = data;
    return $.getJSON("http://" + server + ":" + apiPort + "/Schedule?trainId=" + data.TrainId + "&trainUid=" + data.TrainUid)
        .done(function (schedule) {
            mixModel.updateFromJson(schedule, _lastLiveData);

            if (schedule && schedule.Stops && schedule.Stops.length > 0) {
                titleModel.From(schedule.Stops[0].Tiploc.Description.toLowerCase());
                if (schedule.Stops.length > 1) {
                    titleModel.To(schedule.Stops[schedule.Stops.length - 1].Tiploc.Description.toLowerCase());
                }
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

var markersArray = new Array();

function showCurrentTrainMap() {
    clearMarkers();
    if (!currentTrain || currentTrain.Stops().length == 0) {
        return;
    }

    var stops = currentTrain.Stops();
    var deffered = new Array();
    for (i in stops) {
        deffered.push(mapStop(stops[i]));
    }
    $.when.apply(null, deffered).then(function () {
        centreMap();
    });
}

function mapStop(stop) {
    try {
        var stanox = stop.Stanox();
        var ts = stop.DepartActualTimeStamp();
    } catch (err) {
        var stanox = stop.Stanox;
        var ts = stop.DepartActualTimeStamp;
    }
    return $.getJSON("http://" + server + ":" + apiPort + "/Stanox/" + stanox)
        .done(function (data) {
            if (data.Lat && data.Lon) {
                marker = new google.maps.Marker({
                    position: new google.maps.LatLng(data.Lat, data.Lon),
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 3
                    },
                    draggable: false,
                    map: map,
                    title: $("." + stanox).data("title") + " - " + ts
                });
                markersArray.push(marker);
            }
        });
}

function listStation(stanox) {
    $('html, body').animate({
        scrollTop: $("#locationDetails").offset().top
    }, 1000);

    $.getJSON("http://" + server + ":" + apiPort + "/Stanox/" + stanox)
        .done(function (data) {
            currentLocation.locationStanox(data.Name);
            currentLocation.locationTiploc(data.Tiploc);
            currentLocation.locationDescription(data.Description);
            currentLocation.locationCRS(data.CRS);
            currentLocation.stationName(data.StationName);
        });
}
