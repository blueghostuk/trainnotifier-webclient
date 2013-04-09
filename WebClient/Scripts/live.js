/// <reference path="moment.js" />
/// <reference path="jquery-1.9.1.js" />
/// 
function sortTrainId(trainId) {
    if (!trainId || trainId.length == 0)
        return;

    var rows = $("#table-trains tbody tr." + trainId).not(".info, .warning");
    if (rows.length <= 1)
        return;

    var header = $("#table-trains tbody tr." + trainId + ".info").get(0);

    $(rows).each(function (el) {
        $(el).detach();
    });

    var ordered = rows.get().sort(function (a, b) {
        return $(a).data("timestamp") - $(b).data("timestamp");
    });

    $(header).after(ordered);
}

function padTime(time) {
    if (time < 10)
        return "0" + time;
    return time;
}

function setStatus(status) {
    $("#status").html(status);
}

function addMessage(message, parent) {
    if (parent) {
        $("#" + parent).after(message);
    } else {
        $("#data").append(message);
    }
}

var currentFilter = '';

function clearTable() {
    $("#table-trains tbody tr").detach();
}

var _locations;

var currentLocation = new LocationViewModel();

function preLoadStationsCallback(results) {
    var locations = [];
    for (i in results) {
        locations.push(results[i].StaionName + ' (' + results[i].CRS + ')');
    }
    $("#filter-location").typeahead({
        source: results,
        updater: function (item) {
            filter(item.substring(0, (item.indexOf('(') - 1)));
            return item;
        }
    });
}

$(function () {
    ko.applyBindings(currentLocation, $("#locationDetails").get(0));

    preLoadStations(preLoadStationsCallback);

    preLoadMap();

    $('#filter-location').on('change', function (evt) {
        if ($(evt.target).val() == '') {
            filter(null);
        }
    });
});

function wsOpenCommand() {
    ws.send("subscribe");
}

function connectWs() {
    connect();

    ws.onmessage = function (msg) {
        var data = jQuery.parseJSON(msg.data);
        console.debug(data);
        setStatus("Received " + data.length + " messages at " + new Date(Date.now()).toLocaleString());

        $("#status").removeClass("btn-warning");
        $("#status").removeClass("btn-success");
        $("#status").addClass("btn-info");

        for (var i = 0; i < data.length; i++) {
            var message = data[i]; //.body;

            var existing = $("#" + message.train_id).length == 1;
            var cls = "";
            if (existing) {
                $("." + message.train_id).addClass(message.loc_stanox);
                cls = $("#" + message.train_id).attr('class');
                cls = cls.replace(" info", "");
                parent = message.train_id;
            } else {
                parent = null;
                cls = message.loc_stanox + " " + message.train_id;
            }

            var style = "";
            if (currentFilter &&
                currentFilter.length > 0 &&
                cls.indexOf(currentFilter) == -1) {
                style = "display:none;";
            }

            var date = new Date(new Number(message.actual_timestamp));
            var html = "";

            if (!existing) {
                html += "<tr class=\"" + cls + " info\" style=\"" + style + "\" id=\"" + message.train_id + "\">";
                html += "<td><a href=\"trains/" + message.train_id + "\" title=\"View this train\">" + message.train_id + "</a></td>";
                html += "<td colspan=\"6\">" + message.train_service_code + "</td>";
                html += "</tr>";
            }

            html += "<tr class=\"" + cls + "\" style=\"" + style + "\" data-timestamp=\"" + message.actual_timestamp + "\">";
            html += "<td colspan=\"2\">&nbsp;&nbsp;</td>";
            html += "<td>" + message.event_type + "</td>";
            html += "<td>" + padTime(date.getUTCHours()) + ":" + padTime(date.getUTCMinutes()) + ":" + padTime(date.getUTCSeconds()) + "</td>";
            html += "<td>" + message.direction_ind + "</td>";
            html += "<td>" + message.platform + "</td>";
            html += "<td><a href=\"search/from/" + message.loc_stanox + "\" class=\"stanox-" + message.loc_stanox + "\" title=\"View this location\">" + message.loc_stanox + "</a></td>";

            html += "</tr>";

            if (message.train_terminated && message.train_terminated == "true") {
                html += "<tr class=\"" + cls + " " + message.train_id + " warning\"  style=\"" + style + "\"><td colspan=\"7\">Terminated</td></tr>";
            }

            addMessage(html, parent);

            sortTrainId(message.train_id);

            fetchStanox(message.loc_stanox);
        }
    };
}