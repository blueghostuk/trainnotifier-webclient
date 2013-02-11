/// <reference path="jquery-1.9.1.js" />

function padTime(time) {
    if (time < 10)
        return "0" + time;
    return time;
}

function setStatus(status) {
    $("#status").html(status);
}

var currentLocation = new LocationViewModel();

var currentTrain = new TrainViewModel();

$(function () {
    
    var commands = [];
    commands.push('gettrain:');
    commands.push('subtrain:');
    $("#filter-command").typeahead({
        source: commands
    });

    ko.applyBindings(currentTrain, $("#trains").get(0));

    ko.applyBindings(currentLocation, $("#stationDetails").get(0));

    if (document.location.hash.length > 0) {
        setCommand(document.location.hash.substr(1));
    }

    connectWs();
});

function formatDateString(d) {
    function pad(n) { return n < 10 ? '0' + n : n }
    return pad(d.getUTCDate()) + '/'
        + pad(d.getUTCMonth() + 1) + '/'
        + d.getUTCFullYear() + ' '
        + pad(d.getUTCHours()) + ':'
        + pad(d.getUTCMinutes()) + ':'
        + pad(d.getUTCSeconds());
}

function connectWs() {
    connect();

    ws.onmessage = function (msg) {
        var data = jQuery.parseJSON(msg.data);
        switch (data.Command) {
            case "subtrainupdate":
                data = data.Response;
                currentTrain.LastUpdate(formatDateString(new Date()));
                for (i in data) {
                    addStop(data[i], true);
                    mapStop(data[i], true);
                }
                $(".tooltip-dynamic").tooltip();
                // scroll to last table element
                $('html, body').animate({
                    scrollTop: $("#train-id-result table tr:last").offset().top
                }, 1000);
                // highlight last element and last update
                $("#train-id-result table tr:last, #lastUpdate").animate(
                {
                    // essentially bootstrap success class
                    backgroundColor: '#dff0d8'
                },
                {
                    duration: 1000,
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

function addStop(stopEl, terminateStop) {
    var stop = new StopViewModel();
    stop.Stanox(stopEl.Stanox);

    var setTimes = true;
    if (stopEl.ActualTimeStamp && stopEl.ActualTimeStamp.length > 0) {
        var actualTime = new Date(stopEl.ActualTimeStamp);
        stop.ActualTimeStamp(formatDateString(actualTime));
    } else {
        stop.ActualTimeStamp("");
        setTimes = false;
    }

    if (stopEl.PlannedTime && stopEl.PlannedTime.length > 0) {
        var plannedTime = new Date(stopEl.PlannedTime);
        stop.PlannedTime(formatDateString(plannedTime));
    } else if (stopEl.ActualTimeStamp && stopEl.ActualTimeStamp.length > 0) {
        var plannedTime = new Date(stopEl.ActualTimeStamp);
        stop.PlannedTime(formatDateString(actualTime));
    } else {
        stop.PlannedTime("");
        setTimes = false;
    }

    if (setTimes) {
        stop.Delay((actualTime - plannedTime) / 60000);
    } else {
        stop.Delay(0);
    }

    stop.EventType(stopEl.EventType);
    stop.Line(stopEl.Line);
    stop.Platform(stopEl.Platform);

    stop.State(stopEl.State);

    // train terminated so unsubscribe
    if (terminateStop && stopEl.State == 1) {
        sendWsCommand("unsubtrain:");
    }

    currentTrain.addStop(stop);

    fetchLocation(stopEl.Stanox);
}

function fetchLocation(stanox) {
    loadLocation(stanox, function (data) {
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

function clearData() {
    currentTrain.Id('');
    currentTrain.ServiceCode('');
    currentTrain.clearStops();
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
        case 'getservice':
            getService(args);
            return;
            break;
        case 'gettrain':
            getTrain(args);
            return;
            break;
        case 'subtrain':
            getTrain(args, true);
            // still send command
            break;
    }
    sendCommand(true);
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
    $.getJSON("http://" + server + ":82/TrainMovement/" + trainId, function (data) {
        // if multiple, take first
        if (data.length && data.length > 0)
            data = data[0];

        currentTrain.clearStops();
        currentTrain.Id(data.Id);
        currentTrain.Headcode(data.HeadCode);
        currentTrain.ServiceCode(data.ServiceCode);
        var activated = "";
        if (data.Activated) {
            activated = formatDateString(new Date(data.Activated));
        }
        currentTrain.Activated(activated);
        if (data.WorkingTTId && data.WorkingTTId.length > 0) {
            currentTrain.WttId(data.WorkingTTId.substring(0, data.WorkingTTId.length - 1));
        } else {
            currentTrain.WttId('');
        }

        currentTrain.SchedOrigin(data.SchedOriginStanox);
        if (data.SchedOriginStanox && data.SchedOriginStanox.length > 0)
            fetchLocation(data.SchedOriginStanox);
        var schedDepart = "";
        if (data.SchedOriginDeparture) {
            schedDepart = formatDateString(new Date(data.SchedOriginDeparture));
        }
        currentTrain.SchedDepart(schedDepart);
        currentTrain.LastUpdate(formatDateString(new Date()));
        showCurrentTrainMap();
        for (i in data.Steps) {
            addStop(data.Steps[i]);
        }
        $(".tooltip-dynamic").tooltip();
    });
}

var currentView = 'table';

function switchView(view) {
    currentView = view;
    switch (currentView) {
        case 'table':
            $("#tableView").show();
            $("#map_canvas").hide();
            break;
        case 'map':
            $("#map_canvas").show();
            $("#tableView").hide();
            preLoadMap();
            showCurrentTrainMap();
            break;
    }
}

var markersArray = new Array();

function showCurrentTrainMap() {
    clearMarkers();
    if (!currentTrain || currentTrain.Stops().length == 0) {
        return;
    }

    var stops = currentTrain.Stops();

    for (i in stops) {
        mapStop(stops[i]);
    }
    centreMap();
}

function mapStop(stop, centre) {
    try {
        var stanox = stop.Stanox();
        var ts = stop.ActualTimeStamp();
    } catch (err) {
        var stanox = stop.Stanox;
        var ts = stop.ActualTimeStamp;
    }
    $.ajax({
        type: "GET",
        url: "http://" + server + ":82/Stanox/" + stanox,
        dataType: "json",
        success: function (data) {
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
        },
        async: false
    });
    if (centre) {
        centreMap();
    }
}

function listStation(stanox) {
    $('html, body').animate({
        scrollTop: $("#locationDetails").offset().top
    }, 1000);

    $.getJSON("http://" + server + ":82/Stanox/" + stanox, function (data) {
        currentLocation.locationStanox(data.Name);
        currentLocation.locationTiploc(data.Tiploc);
        currentLocation.locationDescription(data.Description);
        currentLocation.locationCRS(data.CRS);
        currentLocation.stationName(data.StationName);
    });
}