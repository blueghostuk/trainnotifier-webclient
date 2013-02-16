var currentLocation = new LocationViewModel();

function setCommand(command) {
    $("#filter-command").val(command);
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
            break;
        case 'listorigin':
            getOrigin(args);
            break;
        case 'listorigin-crs':
            getOrigin(args, true);
            break;
        case 'liststation':
            getStation(args);
            break;
        case 'liststation-crs':
            getStation(args, true);
            break;
    }
}

function createWttSearchResult(trainMovement) {
    var result = new WttSearchResult();
    result.TrainId(trainMovement.Id);
    result.TrainUid(trainMovement.TrainUid);
    result.Headcode(trainMovement.HeadCode);
    result.WttId(trainMovement.WorkingTTId);
    result.From(trainMovement.SchedOriginStanox);
    result.Depart(trainMovement.SchedOriginDeparture);
    result.To('');
    result.Arrive('');
    return result;
}

var currentWttResult = new WttSearchResults();

function getService(wttId) {
    document.location.hash = "getservice:" + wttId;
    $.getJSON("http://" + server + ":82/TrainMovement/WithWttId/" + wttId, function (data) {
        currentWttResult.clearTrains();
        if (data.length > 0) {
            $("#no-results-row").hide();
            for (i in data) {
                var result = createWttSearchResult(data[i]);

                currentWttResult.addTrain(result);

                fetchLocation(data[i].From);
            }
        } else {
            $("#no-results-row").show();
        }
    });
}

function getOrigin(args, convertFromCrs) {
    if (convertFromCrs) {
        document.location.hash = "listorigin-crs:" + args;
        $.getJSON("http://" + server + ":82/Stanox/?GetByCrs&crsCode=" + args, function (data) {
            getOriginByStanox(data.Name);
        });
    } else {
        document.location.hash = "listorigin:" + args;
        getOriginByStanox(args);
    }
}

function getStation(args, convertFromCrs) {
    if (convertFromCrs) {
        document.location.hash = "liststation-crs:" + args;
        $.getJSON("http://" + server + ":82/Stanox/?GetByCrs&crsCode=" + args, function (data) {
            getCallingAtStanox(data.Name);
        });
    } else {
        document.location.hash = "liststation:" + args;
        getCallingAtStanox(args);
    }
}

function getOriginByStanox(stanox) {
    listStation(stanox);
    $.getJSON("http://" + server + ":82/TrainMovement/StartingAtStation/" + stanox, function (data) {
        currentWttResult.clearTrains();
        if (data.length > 0) {
            $("#no-results-row").hide();
            for (i in data) {
                var result = createWttSearchResult(data[i]);

                currentWttResult.addTrain(result);
            }
        } else {
            $("#no-results-row").show();
        }

        fetchLocation(stanox);
    });
}

function getCallingAtStanox(stanox) {
    listStation(stanox);
    $.getJSON("http://" + server + ":82/TrainMovement/CallingAtStation/" + stanox, function (data) {
        currentWttResult.clearTrains();
        if (data.length > 0) {
            $("#no-results-row").hide();
            for (i in data) {
                var result = createWttSearchResult(data[i]);

                currentWttResult.addTrain(result);

                fetchLocation(data[i].SchedOriginStanox);
            }
        } else {
            $("#no-results-row").show();
        }
    });
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
    currentWttResult.clearTrains();
}

function preLoadStationsCallback(results) {
    var commands = [];
    commands.push('getservice:');
    commands.push('listorigin:');
    for (i in results) {
        commands.push('listorigin:' + results[i].Name)
    }
    commands.push('listorigin-crs:');
    for (i in results) {
        commands.push('listorigin-crs:' + results[i].CRS)
    }
    commands.push('liststation:');
    for (i in results) {
        commands.push('liststation:' + results[i].Name)
    }
    commands.push('liststation-crs:');
    for (i in results) {
        commands.push('liststation-crs:' + results[i].CRS)
    }
    $("#filter-command").typeahead({
        source: commands
    });
}

function listStation(stanox) {
    $.getJSON("http://" + server + ":82/Stanox/" + stanox, function (data) {
        currentLocation.locationStanox(data.Name);
        currentLocation.locationTiploc(data.Tiploc);
        currentLocation.locationDescription(data.Description);
        currentLocation.locationCRS(data.CRS);
        currentLocation.stationName(data.StationName);
    });
}

$(function () {
    preLoadStations(preLoadStationsCallback);

    ko.applyBindings(currentWttResult, $("#train-id-result").get(0));

    ko.applyBindings(currentLocation, $("#stationDetails").get(0));

    loadHashCommand();
});

function loadHashCommand() {
    if (document.location.hash.length > 0) {
        setCommand(document.location.hash.substr(1));
        parseCommand();
    }
    return false;
}

function setHash(hash) {
    document.location.hash = hash;
    loadHashCommand();
}