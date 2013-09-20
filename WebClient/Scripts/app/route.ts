/// <reference path="webApi.ts" />
/// <reference path="trainModels.ts" />
/// <reference path="../typings/knockout/knockout.d.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/moment/moment.d.ts" />

class Berth {
    public static TsFormat = "HH:mm:ss";

    public contents: KnockoutObservable<string> = ko.observable();
    public timestamp: KnockoutObservable<string> = ko.observable();
    public text: string = null;
    public label: boolean = false;
    public fulltimestamp: Moment = moment.utc();

    constructor(private area: string, private berth: string, text?: string) {
        if (text) {
            this.text = text;
            this.label = true;
        } else if (this.area && this.berth) {
            this.text = berth;
        }
    }

    public static empty(text?: string): Berth {
        var b = new Berth(null, null, text);
        return b;
    }

    public get uniqueIdentifier() {
        if (this.area && this.berth)
            return this.area + "-" + this.berth;

        return null;
    }

    public setTime(timestamp: string) {
        this.fulltimestamp = moment.utc(timestamp);
        var ts = this.fulltimestamp.local();
        if (ts && ts.isValid()) {
            this.timestamp(ts.format(Berth.TsFormat));
        }
    }
}

class RouteRow {
    constructor(public down: Berth, public up: Berth) { }
}

var routeXCSouth: Array<RouteRow> =
    [
        new RouteRow(new Berth("BN", "0215", "BHM P10"), new Berth("BN", "0167", "BHM P8")),
        new RouteRow(new Berth("BN", "0214", "BHM P11"), new Berth("BN", "0187", "BHM P9")),
        new RouteRow(new Berth("BN", "0212", "BHM P12"), new Berth("BN", "0215", "BHM P10")),
        new RouteRow(new Berth("BN", "0452"), new Berth("BN", "0191")),
        new RouteRow(new Berth("BN", "0451"), new Berth("BN", "0243")),

        new RouteRow(new Berth("BN", "0247", "FWY P2"), new Berth("BN", "0453", "FWY P1")),
        new RouteRow(new Berth("SA", "0056"), new Berth("BN", "0249")),

        new RouteRow(new Berth("SA", "0054", "UNI P3"), new Berth("BN", "0454", "UNI P1")),

        new RouteRow(new Berth("SA", "0052", "SLY P2"), new Berth("BN", "0455", "SLY P1")),
        new RouteRow(new Berth("SA", "0048"), new Berth("SA", "0051")),

        new RouteRow(new Berth("SA", "0046", "BRV P2"), new Berth("SA", "0047", "BRV P1")),
        new RouteRow(new Berth("SA", "0044"), new Berth("SA", "0044")),

        new RouteRow(new Berth("SA", "0062", "KNN P4"), new Berth("SA", "0063", "KNN P1")),
        new RouteRow(new Berth("SA", "0038"), new Berth("SA", "0039")),

        new RouteRow(new Berth("SA", "0034", "NFD P4"), new Berth("SA", "0033", "NFD P1")),
        new RouteRow(new Berth("SA", "0026"), Berth.empty()),

        new RouteRow(new Berth("SA", "0022", "LOB P2"), new Berth("SA", "0029", "LOB P1")),
        new RouteRow(new Berth("SA", "0028"), new Berth("SA", "0025")),
        new RouteRow(new Berth("SA", "0018"), new Berth("SA", "0019")),
        new RouteRow(new Berth("SA", "0014"), new Berth("SA", "0015")),
        new RouteRow(new Berth("SA", "0012"), new Berth("SA", "0013")),

        new RouteRow(new Berth("SA", "0008", "BTG P4"), new Berth("SA", "0009", "BTG PX")),
    ];

var routeXCNorth: Array<RouteRow> =
    [
        new RouteRow(Berth.empty("LIF"), new Berth("AS", "TV06", "LIF")),
        new RouteRow(Berth.empty(), new Berth("AS", "0165")),

        new RouteRow(Berth.empty("LIC"), new Berth("AS", "0161", "LIC")),
        new RouteRow(Berth.empty(), new Berth("AS", "0155")),
        new RouteRow(Berth.empty(), new Berth("AS", "0153")),
        new RouteRow(Berth.empty(), new Berth("AS", "0151")),

        new RouteRow(new Berth("AS", "0144", "SEN"), new Berth("AS", "0147", "SEN")),
        new RouteRow(new Berth("AS", "0142"), new Berth("AS", "0145")),
        new RouteRow(new Berth("AS", "0140"), Berth.empty()),
        new RouteRow(new Berth("AS", "0136"), Berth.empty()),

        new RouteRow(new Berth("AS", "0134", "BKT"), new Berth("AS", "0141", "BKT")),
        new RouteRow(new Berth("AS", "0132"), new Berth("AS", "0137")),

        new RouteRow(Berth.empty("BUL"), new Berth("AS", "0135", "BUL")),
        new RouteRow(new Berth("AS", "0130"), new Berth("AS", "0133")),

        new RouteRow(new Berth("AS", "0126", "FOK"), new Berth("AS", "0127", "FOK")),
        new RouteRow(new Berth("AS", "0122"), new Berth("AS", "0125")),
        new RouteRow(new Berth("AS", "0120"), new Berth("AS", "0123")),

        new RouteRow(new Berth("AS", "0116", "SUT"), new Berth("AS", "0121", "SUT")),
        new RouteRow(new Berth("AS", "0114"), new Berth("AS", "0117")),

        new RouteRow(new Berth("AS", "0112", "WYL"), new Berth("AS", "0115", "WYL")),

        new RouteRow(new Berth("AS", "0110", "CRD"), new Berth("AS", "0113", "CRD")),
        new RouteRow(new Berth("AS", "0106"), Berth.empty()),

        new RouteRow(Berth.empty("ERD"), new Berth("AS", "0111", "ERD")),
        new RouteRow(new Berth("AS", "0104"), new Berth("AS", "0107")),

        new RouteRow(new Berth("AS", "0102", "GVH"), new Berth("AS", "0105", "GVH")),
        new RouteRow(new Berth("AS", "0100"), new Berth("AS", "0103")),
        new RouteRow(new Berth("AS", "A100"), new Berth("AS", "A101")),
        new RouteRow(new Berth("AS", "0057"), Berth.empty()),

        new RouteRow(new Berth("BN", "0062", "AST"), new Berth("BN", "0058", "AST")),
        new RouteRow(new Berth("BN", "404"), new Berth("BN", "0068")),

        new RouteRow(new Berth("BN", "0075", "DUD"), Berth.empty("DUD")),
        new RouteRow(new Berth("BN", "0499"), new Berth("BN", "0443")),
        new RouteRow(new Berth("BN", "0141"), new Berth("BN", "0442")),
        new RouteRow(new Berth("BN", "0139"), Berth.empty()),

        new RouteRow(new Berth("BN", "0151", "XOZ"), new Berth("BN", "0083", "XOZ")),
        new RouteRow(new Berth("BN", "0184"), new Berth("BN", "0136")),
        new RouteRow(Berth.empty(), new Berth("BN", "0142")),
        new RouteRow(Berth.empty(), new Berth("BN", "0149")),

        new RouteRow(new Berth("BN", "0215", "BHM P10"), new Berth("BN", "0149", "BHM P8")),
        new RouteRow(new Berth("BN", "0214", "BHM P11"), new Berth("BN", "0187", "BHM P9")),
        new RouteRow(new Berth("BN", "0212", "BHM P12"), new Berth("BN", "0184", "BHM P10")),
    ];

var routeWvhBhm: Array<RouteRow> =
    [
        new RouteRow(new Berth("WO", "0063", "FROM XBJ"), new Berth("WO", "0024", "TO XBJ")),
        new RouteRow(new Berth("TD", "WNLS", "FROM BBK"), new Berth("TD", "3703", "TO BBK")),

        new RouteRow(Berth.empty("WVH P1"), new Berth("WO", "0082", "WVH P1")),
        new RouteRow(new Berth("WO", "0099", "WVH P2"), new Berth("WO", "0078", "WVH P2")),
        new RouteRow(new Berth("WO", "0097", "WVH P3"), Berth.empty("WVH P3")),
        new RouteRow(new Berth("WO", "0105", "WVH P4"), new Berth("WO", "0072", "WVH P4")),
        new RouteRow(new Berth("WO", "0098", "WVH P5"), new Berth("WO", "0098", "WVH P5")),

        new RouteRow(new Berth("WO", "0259"), Berth.empty()),
        new RouteRow(new Berth("WO", "0115"), new Berth("WO", "0112")),
        new RouteRow(new Berth("WO", "0263"), new Berth("WO", "0114")),
        new RouteRow(new Berth("WO", "0275"), new Berth("WO", "0122")),
        new RouteRow(new Berth("WO", "0177"), new Berth("WO", "0276")),

        new RouteRow(new Berth("WO", "0277", "CSY P1"), new Berth("WO", "0182", "CSY P2")),
        new RouteRow(new Berth("WO", "0183"), new Berth("WO", "0278")),

        new RouteRow(new Berth("WO", "0187", "TIP P1"), new Berth("WO", "0282", "TIP P2")),
        new RouteRow(new Berth("BN", "0366"), new Berth("WO", "0188")),
        new RouteRow(new Berth("BN", "0489"), new Berth("WO", "0194")),

        new RouteRow(Berth.empty("DDP P2"), new Berth("BN", "0365", "DDP P1")),
        new RouteRow(new Berth("BN", "0358"), new Berth("BN", "0359")),
        new RouteRow(new Berth("BN", "0485"), new Berth("BN", "0353")),
        new RouteRow(new Berth("BN", "0483"), new Berth("BN", "0351")),

        new RouteRow(new Berth("BN", "0481", "SAD P1"), new Berth("BN", "0482", "SAD P2")),
        new RouteRow(new Berth("BN", "0349"), new Berth("BN", "0480")),
        new RouteRow(new Berth("BN", "0344"), Berth.empty()),

        new RouteRow(Berth.empty("SGB P4"), Berth.empty("SGB P3")),

        new RouteRow(new Berth("BN", "0338", "XGJ"), new Berth("BN", "0478", "XGJ")),

        new RouteRow(new Berth("BN", "0337", "SMR P1"), Berth.empty("SMR P2")),
        new RouteRow(Berth.empty(), new Berth("BN", "0339")),
        new RouteRow(new Berth("BN", "0313"), new Berth("BN", "0334")),

        new RouteRow(new Berth("BN", "0309", "XOS"), new Berth("BN", "0322", "XOS")),
        new RouteRow(new Berth("BN", "0301"), new Berth("BN", "0312")),
        new RouteRow(new Berth("BN", "0245"), new Berth("BN", "0305")),
        new RouteRow(new Berth("BN", "0244"), new Berth("BN", "0293")),

        new RouteRow(new Berth("BN", "0181", "BHM P1A"), new Berth("BN", "0209", "BHM P1B")),
        new RouteRow(new Berth("BN", "0179", "BHM P2A"), new Berth("BN", "0208", "BHM P2V")),
        new RouteRow(new Berth("BN", "0198", "BHM P3A"), new Berth("BN", "0206", "BHM P3V")),
        new RouteRow(new Berth("BN", "0231", "BHM PA4"), new Berth("BN", "0204", "BHM P4V")),
        new RouteRow(new Berth("BN", "0229", "BHM P4C"), new Berth("BN", "0229", "BHM P4C")),
        new RouteRow(new Berth("BN", "0201", "BHM P5A"), new Berth("BN", "0202", "BHM P5V")),
        new RouteRow(Berth.empty("BHM P6A"), Berth.empty("BHM P6V")),
        new RouteRow(new Berth("BN", "0192", "BHM P7A"), new Berth("BN", "0193", "BHM P7V")),
        new RouteRow(new Berth("BN", "0167", "BHM P8A"), new Berth("BN", "0191", "BHM P8V")),
    ];

var webApi: IWebApi = new TrainNotifier.WebApi();

var runningTrains: KnockoutObservableArray<TrainNotifier.KnockoutModels.Routes.RouteTrainMovement> = ko.observableArray();

function updateBerthContents() {
    for (var i = 0; i < route.length; i++) {
        var updateData = (function (berth: Berth) {
            webApi.getBerthContents(berth.uniqueIdentifier).done(function (data?: IBerthContents) {
                if (data) {
                    berth.setTime(data.m_Item1);
                    berth.contents(data.m_Item2);
                } else {
                    berth.timestamp(moment().format(Berth.TsFormat));
                    berth.contents(null);
                }
            });
        });

        if (route[i].down && route[i].down.uniqueIdentifier) {
            updateData(route[i].down);
        }
        if (route[i].up && route[i].up.uniqueIdentifier) {
            updateData(route[i].up);
        }
    }
}

function showTrain(berth: Berth) {
    $(".progress").show();
    $("#error-row").hide();
    $("#no-results-row").hide();
    runningTrains.removeAll();
    if (berth && berth.contents()) {
        //trainDetails.id(berth.contents())
        webApi.getTrainMovementsByHeadcode(berth.contents(), berth.fulltimestamp.format(TrainNotifier.DateTimeFormats.dateQueryFormat))
            .done(function (data: ITrainMovementResults) {
                if (data && data.Movements.length > 0) {
                    var viewModels: TrainNotifier.KnockoutModels.Routes.RouteTrainMovement[] = data.Movements.map(function (movement: ITrainMovementResult) {
                        return new TrainNotifier.KnockoutModels.Routes.RouteTrainMovement(movement, data.Tiplocs, berth.fulltimestamp);
                    });

                    for (var i = 0; i < viewModels.length; i++) {
                        runningTrains.push(viewModels[i]);
                    }
                } else {
                    $("#no-results-row").show();
                }
            })
            .always(function () {
                $(".progress").hide();
            })
            .fail(function () {
                $("#error-row").show();
            });
    } else {
        $("#no-results-row").show();
    }
}

var route = routeXCSouth;
var routeBinding: KnockoutObservableArray<RouteRow> = ko.observableArray();

function switchRoute(routeId: string) {
    switch (routeId) {
        case "wvh":
            route = routeWvhBhm;
            break;
        case "xcn":
            route = routeXCNorth;
            break;
        case "xcs":
        default:
            route = routeXCSouth;
            break;
    }
    routeBinding.removeAll();
    for (var i = 0; i < route.length; i++) {
        routeBinding.push(route[i]);
    }
    updateBerthContents();
}

$(function () {
    ko.applyBindings(routeBinding, $("#route").get(0));
    ko.applyBindings(runningTrains, $("#route-results").get(0));

    switchRoute('');

    updateBerthContents();
    setInterval(function () {
        updateBerthContents();
    }, 10000);
});