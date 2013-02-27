/// <reference path="jquery-1.9.1.js" />
/// <reference path="common.js" />
/// <reference path="ViewModels.js" />
/// <reference path="knockout.mapping-latest.js" />
/// <reference path="knockout-2.2.1.js" />

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

    preLoadMap();
});

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

function addStop(stopEl, terminateStop) {
    // train terminated so unsubscribe
    if (terminateStop && stopEl.State == 1) {
        sendWsCommand("unsubtrain:");
    }

    currentTrain.addStop(stopEl);

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
    }).then(function (data) {
        if (data.length && data.length >= 0)
            data = data[0];

        $.getJSON("http://" + server + ":82/Schedule?trainId=" + data.TrainId + "&trainUid=" + data.TrainUid, function (schedule) {
            var viewModel = ko.mapping.fromJS(schedule);

            viewModel.STPValue = ko.observable(getSTP(schedule.STPIndicator));
            viewModel.Runs = ko.observable(getRuns(schedule.Schedule));

            ko.applyBindings(viewModel, $("#schedule").get(0));
        });
    });
    
}

function getRuns(schedule) {
    var result = "Runs:";
    if (schedule.Monday) {
        result += "M,";
    }
    if (schedule.Tuesday) {
        result += "Tu,";
    }
    if (schedule.Wednesday) {
        result += "W,";
    }
    if (schedule.Thursday) {
        result += "Th,";
    }
    if (schedule.Friday) {
        result += "F,";
    }
    if (schedule.Saturday) {
        result += "Sa,";
    }
    if (schedule.Sunday) {
        result += "Su,";
    }
    return result.substring(0, result.length - 1);
}

function getSTP(stpIndicatorId) {
    switch (stpIndicatorId) {
        case 1:
            return "Cancellation";
        case 2:
            return "STP";
        case 3:
            return "Overlay";
        case 4:
            return "Permanent";
    }
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
    $.when(deffered).then(function () {
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
    return $.getJSON("http://" + server + ":82/Stanox/" + stanox, function (data) {
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

    $.getJSON("http://" + server + ":82/Stanox/" + stanox, function (data) {
        currentLocation.locationStanox(data.Name);
        currentLocation.locationTiploc(data.Tiploc);
        currentLocation.locationDescription(data.Description);
        currentLocation.locationCRS(data.CRS);
        currentLocation.stationName(data.StationName);
    });
}
