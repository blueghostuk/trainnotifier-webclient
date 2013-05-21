var _locations;
var currentLocation = new LocationViewModel();
var webSockets = new TrainNotifier.WebSockets();
var thisPage = {
    setStatus: function (status) {
        $("#status").html(status);
    },
    wsOpenCommand: function () {
        var station = $("#filter-location").val();
        var atCrs = null;
        if(station.length > 0) {
            var fromCrs = station.substr(station.lastIndexOf('(') + 1, 3);
            if(fromCrs.length == 3) {
                TrainNotifier.Common.webApi.getStanoxByCrsCode(fromCrs).done(function (tiplocCode) {
                    webSockets.send("substanox:" + tiplocCode.Stanox);
                });
                return;
            }
        }
        webSockets.send("subscribe");
    }
};
TrainNotifier.Common.page = thisPage;
var webApi;
$(function () {
    webApi = new TrainNotifier.WebApi();
    TrainNotifier.Common.webApi = webApi;
    ko.applyBindings(currentLocation, $("#locationDetails").get(0));
    $("#filter-location").attr("placeholder", "Loading stations ...");
    webApi.getStations().done(function (results) {
        var locations = [];
        for(var i in results) {
            locations.push(results[i].StationName + ' (' + results[i].CRS + ' - ' + results[i].Tiploc + ')');
        }
        $("#filter-location").typeahead({
            source: locations,
            sorter: function (items) {
                var self = this;
                return items.sort(function (a, b) {
                    var aCrs = a.substr(a.lastIndexOf('(') + 1, 3);
                    var bCrs = b.substr(b.lastIndexOf('(') + 1, 3);
                    if(self.query.toLowerCase() == aCrs.toLowerCase()) {
                        return -1;
                    } else if(self.query.toLowerCase() == bCrs.toLowerCase()) {
                        return 1;
                    } else {
                        return aCrs > bCrs ? 1 : -1;
                    }
                });
            }
        });
        $("#filter-location").attr("placeholder", "Filter By Location");
    });
});
function sortTrainId(trainId) {
    if(!trainId || trainId.length == 0) {
        return;
    }
    var rows = $("#table-trains tbody tr." + trainId).not(".info, .warning");
    if(rows.length <= 1) {
        return;
    }
    var header = $("#table-trains tbody tr." + trainId + ".info").get(0);
    $(rows).each(function (el) {
        $(el).detach();
    });
    var ordered = rows.get().sort(function (a, b) {
        return $(a).data("timestamp") - $(b).data("timestamp");
    });
    $(header).after(ordered);
}
function addMessage(message, parent) {
    if(parent) {
        $("#" + parent).after(message);
    } else {
        $("#data").append(message);
    }
}
function clearTable() {
    $("#table-trains tbody tr").detach();
}
function connectWs() {
    webSockets.connect();
    webSockets.onMessageHandler(function (msg) {
        var data = jQuery.parseJSON(msg.data);
        if(data.Response) {
            data = data.Response;
        }
        thisPage.setStatus("Received " + data.length + " messages at " + new Date(Date.now()).toLocaleString());
        $("#status").removeClass("btn-warning");
        $("#status").removeClass("btn-success");
        $("#status").addClass("btn-info");
        for(var i = 0; i < data.length; i++) {
            var message = data[i];
            if(message.body) {
                message = message.body;
            }
            var existing = $("#" + message.train_id).length == 1;
            var cls = "";
            var parent;
            if(existing) {
                $("." + message.train_id).addClass(message.loc_stanox);
                cls = $("#" + message.train_id).attr('class');
                cls = cls.replace(" info", "");
                parent = message.train_id;
            } else {
                parent = null;
                cls = message.loc_stanox + " " + message.train_id;
            }
            var style = "";
            var date = moment.utc(+message.actual_timestamp);
            var html = "";
            if(!existing) {
                html += "<tr class=\"" + cls + " info\" style=\"" + style + "\" id=\"" + message.train_id + "\">";
                html += "<td><a href=\"trains/" + message.train_id + "\" title=\"View this train\">" + message.train_id + "</a></td>";
                html += "<td colspan=\"6\">" + message.train_service_code + "</td>";
                html += "</tr>";
            }
            html += "<tr class=\"" + cls + "\" style=\"" + style + "\" data-timestamp=\"" + message.actual_timestamp + "\">";
            html += "<td colspan=\"2\">&nbsp;&nbsp;</td>";
            html += "<td>" + message.event_type + "</td>";
            html += "<td>" + date.format(TrainNotifier.DateTimeFormats.dateTimeFormat) + "</td>";
            html += "<td>" + message.direction_ind + "</td>";
            html += "<td>" + message.platform + "</td>";
            html += "<td><a href=\"search/from/" + message.loc_stanox + "\" class=\"stanox-" + message.loc_stanox + "\" title=\"View this location\">" + message.loc_stanox + "</a></td>";
            html += "</tr>";
            if(message.train_terminated && message.train_terminated == "true") {
                html += "<tr class=\"" + cls + " " + message.train_id + " warning\"  style=\"" + style + "\"><td colspan=\"7\">Terminated</td></tr>";
            }
            addMessage(html, parent);
            sortTrainId(message.train_id);
            TrainNotifier.Common.webApi.getStanox(message.loc_stanox).done(function (stanox) {
                TrainNotifier.Common.displayStanox(stanox);
            });
        }
    });
}
function disconnect() {
    webSockets.disconnect();
}
