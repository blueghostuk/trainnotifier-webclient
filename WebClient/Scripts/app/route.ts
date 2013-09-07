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

    constructor(private area: string, private berth: string, text?: string) {
        if (text) {
            this.text = text;
            this.label = true;
        } else if (this.area && this.berth) {
            this.text = berth;
        }
    }

    public static empty(text?:string): Berth {
        var b = new Berth(null, null, text);
        return b;
    }

    public get uniqueIdentifier() {
        if (this.area && this.berth)
            return this.area + "-" + this.berth;

        return null;
    }

    public setTime(timestamp: string) {
        var ts = moment.utc(timestamp).local();
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
        new RouteRow(new Berth("SA", "0009","BTG PX"), new Berth("SA", "0008", "BTG P4")),
        new RouteRow(new Berth("SA", "0015"), new Berth("SA", "0012")),
        new RouteRow(new Berth("SA", "0019"), new Berth("SA", "0014")),
        new RouteRow(new Berth("SA", "0025"), new Berth("SA", "0018")),
        new RouteRow(Berth.empty(), new Berth("SA", "0022")),

        new RouteRow(new Berth("SA", "0029","LOB P1"), Berth.empty("LOB P2")),
        new RouteRow(Berth.empty(), new Berth("SA", "0026")),

        new RouteRow(new Berth("SA", "0033", "NFD P1"), new Berth("SA", "0034", "NFD P4")),
        new RouteRow(new Berth("SA", "0039"), new Berth("SA", "0038")),

        new RouteRow(new Berth("SA", "0043", "KNN P1"), new Berth("SA", "0062","KNN P4")),
        new RouteRow(new Berth("SA", "0047"), new Berth("SA", "0044")),

        new RouteRow(Berth.empty("BRV P1"), new Berth("SA", "0046", "BRV P2")),
        new RouteRow(new Berth("SA", "0051"), new Berth("SA", "0048")),

        new RouteRow(Berth.empty("SLY P1"), Berth.empty("SLY P2")),
        new RouteRow(new Berth("BN", "0454"), new Berth("SA", "0052")),

        new RouteRow(Berth.empty("UNI P1"), Berth.empty("UNI P3")),
        new RouteRow(new Berth("BN", "0249"), new Berth("SA", "0054")),
        new RouteRow(new Berth("BN", "0453"), new Berth("BN", "SY56")),

        new RouteRow(Berth.empty("FWY P1"), new Berth("BN", "0247", "FWY P2")),
        new RouteRow(new Berth("BN", "0243"), new Berth("BN", "0451")),
        new RouteRow(new Berth("BN", "0191"), new Berth("BN", "0452")),

        new RouteRow(new Berth("BN", "0167", "BHM P8"), Berth.empty("BHM P10/11")),
    ];

var routeWvhBhm: Array<RouteRow> =
    [
        new RouteRow(new Berth("BN", "0259", "WVH PX"), new Berth("WO", "0098", "WVH P5")),
        new RouteRow(new Berth("WO", "0115"), new Berth("WO", "0112")),
        new RouteRow(new Berth("WO", "0263"), new Berth("WO", "0114")),
        new RouteRow(new Berth("WO", "0275"), new Berth("WO", "0122")),
        new RouteRow(new Berth("WO", "0177"), new Berth("WO", "0276")),

        new RouteRow(new Berth("WO", "0277", "CSY PX"), new Berth("BN", "0182", "CSY PX")),
        new RouteRow(new Berth("WO", "0183"), new Berth("WO", "0278")),

        new RouteRow(new Berth("WO", "0187", "TIP PX"), new Berth("BN", "0282", "TIP PX")),
        new RouteRow(new Berth("BN", "0366"), new Berth("WO", "0188")),
        new RouteRow(new Berth("BN", "0489"), new Berth("WO", "0194")),

        new RouteRow(Berth.empty("DDP PX"), new Berth("BN", "0365", "DDP PX")),
        new RouteRow(new Berth("BN", "0358"), new Berth("BN", "0359")),
        new RouteRow(new Berth("BN", "0485"), new Berth("BN", "0353")),
        new RouteRow(new Berth("BN", "0483"), new Berth("BN", "0351")),

        new RouteRow(new Berth("BN", "0481", "SAD P1"), new Berth("BN", "0482", "SAD P2")),
        new RouteRow(new Berth("BN", "0349"), new Berth("BN", "0480")),
        new RouteRow(new Berth("BN", "0344"), Berth.empty()),

        new RouteRow(Berth.empty("SGB PX"), Berth.empty("SGB PX")),

        new RouteRow(new Berth("BN", "0338", "XGJ PX"), new Berth("BN", "0478", "XGJ PX")),

        new RouteRow(new Berth("BN", "0337", "SMR PX"), Berth.empty("SMR PX")),
        new RouteRow(Berth.empty(), new Berth("BN", "0339")),
        new RouteRow(new Berth("BN", "0313"), new Berth("BN", "0334")),

        new RouteRow(new Berth("BN", "0309", "XOS PX"), new Berth("BN", "0322", "XOS PX")),
        new RouteRow(new Berth("BN", "0301"), new Berth("BN", "0312")),
        new RouteRow(new Berth("BN", "0245"), new Berth("BN", "0305")),
        new RouteRow(new Berth("BN", "0244"), new Berth("BN", "0293")),
        new RouteRow(new Berth("BN", "0209"), new Berth("BN", "0471")),

        new RouteRow(Berth.empty("BHM PX"), new Berth("BN", "0206", "BHM P3"))
    ];

var webApi: IWebApi = new TrainNotifier.WebApi();

var berths: Array<string> = [];

var trainDetails = new TrainNotifier.KnockoutModels.Train.TrainTitleViewModel();

function updateBerthContents() {
    for (var i = 0; i < berths.length; i++) {
        (function (berth) {
            webApi.getBerthContents(berths[i]).done(function (data?: IBerthContents) {

                var object = route.filter(function (r) {
                    return r.down.uniqueIdentifier == berth || r.up.uniqueIdentifier == berth;
                }).map(function (r) {
                        return r.down.uniqueIdentifier == berth ? r.down : r.up;
                })[0];

                if (object) {
                    if (data) {
                        object.setTime(data.m_Item1);
                        object.contents(data.m_Item2);
                    } else {
                        object.timestamp(moment().format(Berth.TsFormat));
                        object.contents(null);
                    }
                }
            });
        })(berths[i]);
    }
}

function showTrain(berth: Berth) {
    if (!berth || !berth.contents()) {
        trainDetails.id(null);
    } else {
        trainDetails.id(berth.contents())
    }
}

var route = routeXCSouth;
var routeBinding: KnockoutObservableArray<RouteRow> = ko.observableArray();

function switchRoute(routeId: string) {
    switch (routeId) {
        case "wvh":
            route = routeWvhBhm;
            break;
        case "xcs":
        default:
            route = routeXCSouth;
            break;
    }
    berths = [];
    for (var i = 0; i < route.length; i++) {
        if (route[i].down && route[i].down.uniqueIdentifier) {
            berths.push(route[i].down.uniqueIdentifier);
        }
        if (route[i].up && route[i].up.uniqueIdentifier) {
            berths.push(route[i].up.uniqueIdentifier);
        }
    }
    routeBinding.removeAll();
    for (var i = 0; i < route.length; i++) {
        routeBinding.push(route[i]);
    }
    updateBerthContents();
}

$(function () {
    ko.applyBindings(routeBinding, $("#route").get(0));
    ko.applyBindings(trainDetails, $("#title").get(0));

    switchRoute('');

    updateBerthContents();
    setInterval(function () {
        updateBerthContents();
    }, 10000);
});