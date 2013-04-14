/// <reference path="jquery-1.9.1.js" />
/// <reference path="knockout-2.2.1.js" />
/// <reference path="ViewModels.js" />
/// <reference path="moment.js" />

var data = ko.observableArray();
var title = {
    ts: ko.observable(),
    next: ko.observable(65)
};
var timerIntervalId;

$(function () {
    ko.applyBindings(data, $("#ppmTable").get(0));
    ko.applyBindings(data, $("#commandOptions").get(0));
    ko.applyBindings(title, $("#title").get(0));

    getPPMSectors();

    setInterval(function () {
        window.clearInterval(timerIntervalId);
        updatePPMData();
        startCountdown();
    }, 60500);
    startCountdown();
});

function parseHashCommand() {
    if (document.location.hash.length > 1) {
        viewOperator(document.location.hash.substr(1));
    } else {
        showAll();
    }
}

function startCountdown() {
    title.next(60);
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
                    var model = new PPMViewModel(ppmSectors[i]);
                    data.push(model);
                    $.getJSON("http://" + server + ":" + apiPort + "/PPM/", {
                        operatorCode: ppmSectors[i].OperatorCode,
                        name: ppmSectors[i].Description
                    }).done(function (sectorData) {
                        updateModel(sectorData);
                    });
                }
            }
            parseHashCommand();
        });
}

function updateModel(sectorData) {
    // if array
    if ($.isArray(sectorData))
        sectorData = sectorData[0];

    if (!sectorData || ($.isArray(sectorData) && sectorData.length == 0))
        return;

    title.ts(moment(sectorData.Timestamp).format("ddd DD/MM/YYYY HH:mm:ss"));
    for (var i = 0; i < data().length; i++) {
        if (data()[i].Operator() == sectorData.Name && data()[i].Code() == sectorData.Code) {
            data()[i].updateStats(sectorData);
            break;
        }
    }
}

function showAll() {
    $("#commandOptions > li.active").removeClass("active");
    $("#commandOptions > li:nth-child(2)").addClass("active");

    $("#ppmTable").show();
    $("#ppmOperator").hide();
    document.location.hash = "all";

    return false;
}

function viewOperator(id) {
    var model = null;
    for (var i = 0; i < data().length; i++) {
        if (data()[i].Id() == id) {
            model = data()[i];
            break;
        }
    }    
    if (!model)
        return;

    if (!_currentOperator) {
        _currentOperator = ko.observable(model);
        ko.applyBindings(_currentOperator, $("#ppmOperator").get(0));
    } else {
        _currentOperator(model);
    }

    updateOperatorPage();

    return false;
}

var _currentOperator;

function updateOperatorPage() {

    $("#commandOptions > li.active").removeClass("active");
    $("#commandOptions > li#op-" + _currentOperator().Id()).addClass("active");

    $("#ppmOperator").show();
    $("#ppmTable").hide();

    document.location.hash = _currentOperator().Id();
}