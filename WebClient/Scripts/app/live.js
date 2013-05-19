/// <reference path="moment.js" />
/// <reference path="jquery-1.9.1.js" />
/// <reference path="webApi.js" />
/// <reference path="global.js" />

var webApi = new TrainNotifier.WebApi(serverSettings);

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

function clearTable() {
    $("#table-trains tbody tr").detach();
}

var _locations;

var currentLocation = new LocationViewModel();

$(function () {
    ko.applyBindings(currentLocation, $("#locationDetails").get(0));

    $("#filter-location").attr("placeholder", "Loading stations ...");

    webApi.getStations().done(function (results) {
        var locations = [];
        for (i in results) {
            locations.push(results[i].StationName + ' (' + results[i].CRS + ' - ' + results[i].Tiploc + ')');
        }
        $("#filter-location").typeahead({
            source: locations,
            sorter: function (items) {
                var self = this;
                return items.sort(function (a, b) {
                    var aCrs = a.substr(a.lastIndexOf('(') + 1, 3);
                    var bCrs = b.substr(b.lastIndexOf('(') + 1, 3);

                    if (self.query.toLowerCase() == aCrs.toLowerCase())
                        return -1;
                    else if (self.query.toLowerCase() == bCrs.toLowerCase())
                        return 1;
                    else
                        return aCrs > bCrs;
                });
            }
        });
        $("#filter-location").attr("placeholder", "Filter By Location");
    });
});

function wsOpenCommand() {
    var station = $("#filter-location").val();
    var atCrs = null;
    if (station.length > 0) {
        fromCrs = station.substr(station.lastIndexOf('(') + 1, 3);
        if (fromCrs.length == 3) {
            $.getJSON("http://" + server + ":" + apiPort + "/Stanox/?GetByCrs&crsCode=" + fromCrs)
                .done(function (tiplocCode) {
                    ws.send("substanox:" + tiplocCode.Stanox)
                });
            return;
        }
    }
    ws.send("subscribe");
}

function connectWs() {
    connect();

    ws.onmessage = function (msg) {
        var data = jQuery.parseJSON(msg.data);
        if (data.Response)
            data = data.Response;
        setStatus("Received " + data.length + " messages at " + new Date(Date.now()).toLocaleString());

        $("#status").removeClass("btn-warning");
        $("#status").removeClass("btn-success");
        $("#status").addClass("btn-info");

        for (var i = 0; i < data.length; i++) {
            var message = data[i];
            if (message.body)
                message = message.body;

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

            webApi.getStanox(message.loc_stanox).done(function (stanox) {
                TrainNotifier.Common.displayStanox(stanox);
            });
        }
    };
}