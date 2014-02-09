// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var settings = {
    apiUrl: "api.trainnotifier.co.uk",
    wsUrl: "ws.trainnotifier.co.uk:81"
};
var webApi;

var websocket;

function loadWebApi() {
    webApi = new TrainNotifier.WebApi(settings);
}

function loadWebSocket() {
    if (websocket && websocket.readyState == WebSocket.OPEN)
        return false;

    websocket = new WebSocket("ws://" + settings.wsUrl);    
    return true;
}

var currentTiplocs;
var movement;

// Called when the url of a tab changes.
function checkForValidUrl(tabId, changeInfo, tab) {
    // If the letter 'g' is found in the tab's URL...
    if (tab.url.indexOf('trainnotifier.co.uk/train') > -1) {
        // ... show the page action.
        var idx = tab.url.indexOf("#");
        if (idx == -1)
            return;

        var cmdString = tab.url.substring(idx + 1);

        idx = cmdString.indexOf("/");
        if (idx == -1)
            return;

        var cmd = cmdString.substring(0, idx);
        var args = cmdString.substring(idx + 1);
        if (cmd == "get" || cmd == "sub") {
            loadWebApi();
            var hashIdx = args.indexOf('/');
            var advancedMode = args.indexOf('/advanced');
            if (advancedMode != -1) {
                args = args.substring(0, advancedMode);
            }
            var trainUid = args.substring(0, hashIdx);
            var date = args.substring(hashIdx + 1);

            webApi.getTrainMovementByUid(trainUid, date).done(function (data) {
                if (data && data.Movement && data.Movement.Actual) {
                    currentTiplocs = data.Tiplocs;
                    movement = data.Movement;
                    var ws = loadWebSocket();
                    if (ws) {
                        websocket.onopen = function () {
                            this.send("subtrain:" + data.Movement.Actual.TrainId);
                        };
                        websocket.onmessage = function (msg) {
                            var data = jQuery.parseJSON(msg.data);
                            if (data.Command == "subtrainupdate") {
                                var stops = data.Response;

                                for (var i = 0; i < stops.length; i++) {
                                    var stop = stops[i];
                                    var stopTiploc = TrainNotifier.StationTiploc.findStationTiploc(stop.Stanox, currentTiplocs);
                                    var nextStopTiploc = TrainNotifier.StationTiploc.findStationTiploc(stop.NextStanox, currentTiplocs);

                                    if (stopTiploc) {
                                        var notification = webkitNotifications.createNotification(
                                          'icon-48.png',  // icon url - can be relative
                                          movement.Schedule.Headcode,  // notification title
                                          stop.EventType + ' at ' + stopTiploc.StationName + ' @ ' + stop.ActualTimeStamp  // notification body text
                                        );
                                        notification.show();
                                    }
                                }

                            }
                            //else if (data.Command == "subtrainupdate-berth") {
                            //    var berthSteps: IWebSocketBerthStep[] = data.Response;
                            //    for (var i = 0; i < berthSteps.length; i++) {
                            //        liveStops.push(new TrainNotifier.KnockoutModels.Train.BerthLiveStop(berthSteps[i]));
                            //    }
                            //}
                        };
                    } else {
                        websocket.send("unsubtrain");
                        websocket.send("subtrain:" + data.Movement.Actual.TrainId);
                    }
                }
            });

            chrome.pageAction.show(tabId);
        }
    } else {
        if (websocket) {
            try {
                websocket.send("unsubtrain");
                websocket.close();
            } catch (err) { }
        }
    }
};

// Listen for any changes to the URL of any tab.
chrome.tabs.onUpdated.addListener(checkForValidUrl);