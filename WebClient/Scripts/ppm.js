/// <reference path="jquery-1.9.1.js" />
/// <reference path="knockout-2.2.1.js" />
/// <reference path="ViewModels.js" />
/// <reference path="moment.js" />

var data = ko.observableArray();
var title = {
    ts: ko.observable(),
    next: ko.observable(65)
}
var timerIntervalId;

$(function () {
    ko.applyBindings(data, $("#ppm").get(0));
    ko.applyBindings(title, $("#title").get(0));

    getPPMSectors();

    setInterval(function () {
        window.clearInterval(timerIntervalId);
        updatePPMData();
        startCountdown();
    }, 65000);
    startCountdown();    
});

function startCountdown() {
    title.next(65);
    timerIntervalId = setInterval(function () {
        title.next(title.next()-1);
    }, 1000);
}

function updatePPMData() {
    for (var i = 0; i < data().length; i++){
        var model = data()[i];
        $.getJSON("http://" + server + ":" + apiPort + "/PPM/", {
            operatorCode: model.Code(),
            name: model.Operator()
        }).done(function (sectorData) {
            updateModel(sectorData);
        });
    }
}

function getPPMSectors() {
    return $.getJSON("http://" + server + ":" + apiPort + "/PPM/")
        .done(function (ppmSectors) {
            if (ppmSectors && ppmSectors.length > 0) {
                for (i in ppmSectors) {
                    var model = new PPMViewModel(ppmSectors[i], i);
                    data.push(model);
                    $.getJSON("http://" + server + ":" + apiPort + "/PPM/", {
                        operatorCode: ppmSectors[i].OperatorCode,
                        name: ppmSectors[i].Description
                    }).done(function (sectorData) {
                        updateModel(sectorData);
                    });
                }
            }
        });
}

function updateModel(sectorData) {
    title.ts(moment(sectorData.Timestamp).format("ddd DD/MM/YYYY HH:mm:ss"));
    for (var i = 0; i < data().length; i++) {
        if (data()[i].Operator() == sectorData.Name && data()[i].Code() == sectorData.Code) {
            data()[i].updateStats(sectorData);
            break;
        }
    }
}

function fetchOperator(element, index) {
    var model = data()[index];
    if (!model || model.LoadedSub)
        return;
    model.LoadedSub = true;
    return $.getJSON("http://" + server + ":" + apiPort + "/PPM/" + model.Code())
        .done(function (sectors) {
            for (i in sectors) {
                var model = new PPMViewModel(sectors[i], 0, true);
                data.splice((index + 1), 0, model);
                for (var ix = 0 ; ix < data().length; ix++) {
                    data()[ix].Index(ix);
                }
                $.getJSON("http://" + server + ":" + apiPort + "/PPM/", {
                    operatorCode: sectors[i].OperatorCode,
                    name: sectors[i].Description
                }).done(function (sectorData) {
                    updateModel(sectorData);
                });
            }
        });
}