

function fetchStanox(stanox) {
    if (!stanox || stanox.length == 0)
        return;

    $.getJSON("http://" + server + ":82/Stanox/" + stanox, function (data) {
        var html = "";
        if (data.StationName) {
            html = data.StationName;
        } else {
            html = data.Tiploc;
        }
        if (data.CRS) {
            html += "(" + data.CRS + ")";
        }
        $(".stanox-" + stanox).html(html);
        $(".stanox-" + stanox).tooltip({
            title: stanox
        });
    });
}

function loadLocation(stanox, callback) {
    if (!stanox || stanox.length == 0)
        return;

    $.getJSON("http://" + server + ":82/Stanox/" + stanox, function (data) {
        if (!callback)
            callback = loadLocationCallback;
        callback(data);
    });
}

function filter(location) {
    if (!location || location.length == 0) {
        currentFilter = '';
        $("#table-trains tbody tr").show();
        return;
    }

    $.getJSON("http://" + server + ":82/Station/", { id: location }, function (data) {
        currentFilter = data.Name;
        $("#table-trains tbody tr").hide();
        $("#table-trains tbody tr." + data.Name).show();
    });
}

function preLoadStations(callback) {
    $.getJSON("http://" + server + ":82/Station/", null, function (results) {
        if (!results || results.length == 0)
            return;

        callback(results);
    });
}