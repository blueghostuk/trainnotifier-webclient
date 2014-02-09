/// <reference path="webApi.ts" />
/// <reference path="trainModels.ts" />
/// <reference path="../typings/knockout/knockout.d.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/moment/moment.d.ts" />

class Berth {
    public static TsFormat = "HH:mm:ss";

    public contents = ko.observable<string>();
    public timestamp = ko.observable<string>();
    public text: string = null;
    public label: boolean = false;
    public fulltimestamp: Moment = moment.utc();

    constructor(private area: string, private berth: string, text?: string, public abbr?: string) {
        if (text) {
            this.text = text;
            this.label = true;
        } else if (this.area && this.berth) {
            this.text = berth;
        }
    }

    public static empty(text?: string, abbr?: string): Berth {
        var b = new Berth(null, null, text, abbr);
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
        new RouteRow(new Berth("BN", "0215", "BHM P10", "Birmingham New Street"), new Berth("BN", "0167", "BHM P8", "Birmingham New Street")),
        new RouteRow(new Berth("BN", "0214", "BHM P11", "Birmingham New Street"), new Berth("BN", "0187", "BHM P9", "Birmingham New Street")),
        new RouteRow(new Berth("BN", "0212", "BHM P12", "Birmingham New Street"), new Berth("BN", "0215", "BHM P10", "Birmingham New Street")),
        new RouteRow(new Berth("BN", "0452"), new Berth("BN", "0191")),
        new RouteRow(new Berth("BN", "0451"), new Berth("BN", "0243")),

        new RouteRow(new Berth("BN", "0247", "FWY P2", "Five Ways"), new Berth("BN", "0453", "FWY P1", "Five Ways")),
        new RouteRow(new Berth("SA", "0056"), new Berth("BN", "0249")),

        new RouteRow(new Berth("SA", "0054", "UNI P2", "University"), new Berth("BN", "0454", "UNI P1", "University")),

        new RouteRow(new Berth("SA", "0052", "SLY P2", "Selly Oak"), new Berth("BN", "0455", "SLY P1", "Selly Oak")),
        new RouteRow(new Berth("SA", "0048"), new Berth("SA", "0051")),

        new RouteRow(new Berth("SA", "0046", "BRV P2", "Bournville"), new Berth("SA", "0047", "BRV P1", "Bournville")),
        new RouteRow(new Berth("SA", "0044"), new Berth("SA", "0044")),

        new RouteRow(new Berth("SA", "0062", "KNN P4", "Kings Norton"), new Berth("SA", "0063", "KNN P1", "Kings Norton")),
        new RouteRow(new Berth("SA", "0038"), new Berth("SA", "0039")),

        new RouteRow(new Berth("SA", "0034", "NFD P4", "Northfield"), new Berth("SA", "0033", "NFD P1", "Northfield")),
        new RouteRow(new Berth("SA", "0026"), Berth.empty()),

        new RouteRow(new Berth("SA", "0022", "LOB P2", "Longbridge"), new Berth("SA", "0029", "LOB P1", "Longbridge")),
        new RouteRow(new Berth("SA", "0028"), new Berth("SA", "0025")),
        new RouteRow(new Berth("SA", "0018"), new Berth("SA", "0019")),
        new RouteRow(new Berth("SA", "0014"), new Berth("SA", "0015")),
        new RouteRow(new Berth("SA", "0012"), new Berth("SA", "0013")),

        new RouteRow(new Berth("SA", "0008", "BTG P4", "Barnt Green"), new Berth("SA", "0009", "BTG PX", "Barnt Green")),
    ];

var routeXCNorth: Array<RouteRow> =
    [
        new RouteRow(Berth.empty("LIF", "Lichfield Trent Valley"), new Berth("AS", "TV06", "LIF", "Lichfield Trent Valley")),
        new RouteRow(Berth.empty(), new Berth("AS", "0165")),

        new RouteRow(Berth.empty("LIC", "Lichfield City"), new Berth("AS", "0161", "LIC", "Lichfield City")),
        new RouteRow(Berth.empty(), new Berth("AS", "0155")),
        new RouteRow(Berth.empty(), new Berth("AS", "0153")),
        new RouteRow(Berth.empty(), new Berth("AS", "0151")),

        new RouteRow(new Berth("AS", "0144", "SEN", "Shenstone"), new Berth("AS", "0147", "SEN", "Shenstone")),
        new RouteRow(new Berth("AS", "0142"), new Berth("AS", "0145")),
        new RouteRow(new Berth("AS", "0140"), Berth.empty()),
        new RouteRow(new Berth("AS", "0136"), Berth.empty()),

        new RouteRow(new Berth("AS", "0134", "BKT", "Blake Street"), new Berth("AS", "0141", "BKT", "Blake Street")),
        new RouteRow(new Berth("AS", "0132"), new Berth("AS", "0137")),

        new RouteRow(Berth.empty("BUL", "Butlers Lane"), new Berth("AS", "0135", "BUL", "Butlers Lane")),
        new RouteRow(new Berth("AS", "0130"), new Berth("AS", "0133")),

        new RouteRow(new Berth("AS", "0126", "FOK", "Four Oaks"), new Berth("AS", "0127", "FOK", "Four Oaks")),
        new RouteRow(new Berth("AS", "0122"), new Berth("AS", "0125")),
        new RouteRow(new Berth("AS", "0120"), new Berth("AS", "0123")),

        new RouteRow(new Berth("AS", "0116", "SUT", "Sutton Coldfield"), new Berth("AS", "0121", "SUT", "Sutton Coldfield")),
        new RouteRow(new Berth("AS", "0114"), new Berth("AS", "0117")),

        new RouteRow(new Berth("AS", "0112", "WYL", "Sutton Coldfield"), new Berth("AS", "0115", "WYL")),

        new RouteRow(new Berth("AS", "0110", "CRD", "Wylde Green"), new Berth("AS", "0113", "CRD", "Chester Road")),
        new RouteRow(new Berth("AS", "0106"), Berth.empty()),

        new RouteRow(Berth.empty("ERD", "Erdington"), new Berth("AS", "0111", "ERD", "Erdington")),
        new RouteRow(new Berth("AS", "0104"), new Berth("AS", "0107")),

        new RouteRow(new Berth("AS", "0102", "GVH", "Gravelly Hill"), new Berth("AS", "0105", "GVH", "Gravelly Hill")),
        new RouteRow(new Berth("AS", "0100"), new Berth("AS", "0103")),
        new RouteRow(new Berth("AS", "A100"), new Berth("AS", "A101")),
        new RouteRow(new Berth("AS", "0057"), Berth.empty()),

        new RouteRow(new Berth("BN", "0062", "AST", "Aston"), new Berth("BN", "0058", "AST", "Aston")),
        new RouteRow(new Berth("BN", "404"), new Berth("BN", "0068")),

        new RouteRow(new Berth("BN", "0075", "DUD", "Duddeston"), Berth.empty("DUD", "Duddeston")),
        new RouteRow(new Berth("BN", "0499"), new Berth("BN", "0443")),
        new RouteRow(new Berth("BN", "0141"), new Berth("BN", "0442")),
        new RouteRow(new Berth("BN", "0139"), Berth.empty()),

        new RouteRow(new Berth("BN", "0151", "XOZ", "Proof House Junction"), new Berth("BN", "0083", "XOZ", "Proof House Junction")),
        new RouteRow(new Berth("BN", "0184"), new Berth("BN", "0136")),
        new RouteRow(Berth.empty(), new Berth("BN", "0142")),
        new RouteRow(Berth.empty(), new Berth("BN", "0149")),

        new RouteRow(new Berth("BN", "0215", "BHM P10", "Birmingham New Street"), new Berth("BN", "0149", "BHM P8", "Birmingham New Street")),
        new RouteRow(new Berth("BN", "0214", "BHM P11", "Birmingham New Street"), new Berth("BN", "0187", "BHM P9", "Birmingham New Street")),
        new RouteRow(new Berth("BN", "0212", "BHM P12", "Birmingham New Street"), new Berth("BN", "0184", "BHM P10", "Birmingham New Street")),
    ];

var routeWvhBhm: Array<RouteRow> =
    [
        new RouteRow(new Berth("WO", "0063", "FROM XBJ", "From Bushbury Junction"), new Berth("WO", "0024", "TO XBJ", "To Bushbury Junction")),
        new RouteRow(new Berth("TD", "WNLS", "FROM BBK", "From Bilbrook"), new Berth("TD", "3703", "To Bilbrook")),

        new RouteRow(Berth.empty("WVH P1", "Wolverhampton"), new Berth("WO", "0082", "WVH P1", "Wolverhampton")),
        new RouteRow(new Berth("WO", "0099", "WVH P2", "Wolverhampton"), new Berth("WO", "0078", "WVH P2", "Wolverhampton")),
        new RouteRow(new Berth("WO", "0097", "WVH P3", "Wolverhampton"), Berth.empty("WVH P3", "Wolverhampton")),
        new RouteRow(new Berth("WO", "0105", "WVH P4", "Wolverhampton"), new Berth("WO", "0072", "WVH P4", "Wolverhampton")),
        new RouteRow(new Berth("WO", "0098", "WVH P5", "Wolverhampton"), new Berth("WO", "0098", "WVH P5", "Wolverhampton")),

        new RouteRow(new Berth("WO", "0259"), Berth.empty()),
        new RouteRow(new Berth("WO", "0115"), new Berth("WO", "0112")),
        new RouteRow(new Berth("WO", "0263"), new Berth("WO", "0114")),
        new RouteRow(new Berth("WO", "0275"), new Berth("WO", "0122")),
        new RouteRow(new Berth("WO", "0177"), new Berth("WO", "0276")),

        new RouteRow(new Berth("WO", "0277", "CSY P1", "Coseley"), new Berth("WO", "0182", "CSY P2", "Coseley")),
        new RouteRow(new Berth("WO", "0183"), new Berth("WO", "0278")),

        new RouteRow(new Berth("WO", "0187", "TIP P1", "Tipton"), new Berth("WO", "0282", "TIP P2", "Tipton")),
        new RouteRow(new Berth("BN", "0366"), new Berth("WO", "0188")),
        new RouteRow(new Berth("BN", "0489"), new Berth("WO", "0194")),

        new RouteRow(Berth.empty("DDP P2", "Dudley Port"), new Berth("BN", "0365", "DDP P1", "Dudley Port")),
        new RouteRow(new Berth("BN", "0358"), new Berth("BN", "0359")),
        new RouteRow(new Berth("BN", "0485"), new Berth("BN", "0353")),
        new RouteRow(new Berth("BN", "0483"), new Berth("BN", "0351")),

        new RouteRow(new Berth("BN", "0481", "SAD P1", "Sandwell & Dudley"), new Berth("BN", "0482", "SAD P2", "Sandwell & Dudley")),
        new RouteRow(new Berth("BN", "0349"), new Berth("BN", "0480")),
        new RouteRow(new Berth("BN", "0344"), Berth.empty()),

        new RouteRow(Berth.empty("SGB P4", "Smethwick Galton Bridge"), Berth.empty("SGB P3", "Smethwick Galton Bridge")),

        new RouteRow(new Berth("BN", "0338", "XGJ", "Galton Junction"), new Berth("BN", "0478", "XGJ", "Galton Junction")),

        new RouteRow(new Berth("BN", "0337", "SMR P1", "Smethwick Rolfe Street"), Berth.empty("SMR P2", "Smethwick Rolfe Street")),
        new RouteRow(Berth.empty(), new Berth("BN", "0339")),
        new RouteRow(new Berth("BN", "0313"), new Berth("BN", "0334")),

        new RouteRow(new Berth("BN", "0309", "XOS", "Soho Junction South"), new Berth("BN", "0322", "XOS", "Soho Junction South")),
        new RouteRow(new Berth("BN", "0301"), new Berth("BN", "0312")),
        new RouteRow(new Berth("BN", "0245"), new Berth("BN", "0305")),
        new RouteRow(new Berth("BN", "0244"), new Berth("BN", "0293")),
        new RouteRow(Berth.empty(), new Berth("BN", "0471")),
        new RouteRow(Berth.empty(), new Berth("BN", "0219")),

        new RouteRow(new Berth("BN", "0181", "BHM P1A", "Birmingham New Street"), new Berth("BN", "0209", "BHM P1B", "Birmingham New Street")),
        new RouteRow(new Berth("BN", "0179", "BHM P2A", "Birmingham New Street"), new Berth("BN", "0208", "BHM P2B", "Birmingham New Street")),
        new RouteRow(new Berth("BN", "0198", "BHM P3A", "Birmingham New Street"), new Berth("BN", "0206", "BHM P3B", "Birmingham New Street")),
        new RouteRow(new Berth("BN", "0231", "BHM PA4", "Birmingham New Street"), new Berth("BN", "0204", "BHM P4B", "Birmingham New Street")),
        new RouteRow(new Berth("BN", "0229", "BHM P4C", "Birmingham New Street"), new Berth("BN", "0229", "BHM P4C", "Birmingham New Street")),
        new RouteRow(new Berth("BN", "0201", "BHM P5A", "Birmingham New Street"), new Berth("BN", "0202", "BHM P5B", "Birmingham New Street")),
        new RouteRow(Berth.empty("BHM P6A", "Birmingham New Street"), Berth.empty("BHM P6B", "Birmingham New Street")),
        new RouteRow(new Berth("BN", "0192", "BHM P7A", "Birmingham New Street"), new Berth("BN", "0193", "BHM P7B", "Birmingham New Street")),
        new RouteRow(new Berth("BN", "0189", "BHM P8A", "Birmingham New Street"), new Berth("BN", "0191", "BHM P8B", "Birmingham New Street")),
    ];

var webApi: IWebApi = new TrainNotifier.WebApi();

var runningTrains = ko.observable<TrainNotifier.KnockoutModels.Routes.RouteTrainMovementResults>(new TrainNotifier.KnockoutModels.Routes.RouteTrainMovementResults());

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
    runningTrains().results.removeAll();
    if (berth && berth.contents()) {
        //trainDetails.id(berth.contents())
        webApi.getTrainMovementsByHeadcode(berth.contents(), berth.fulltimestamp.format(TrainNotifier.DateTimeFormats.dateQueryFormat))
            .done(function (data: ITrainMovementResults) {
                if (data && data.Movements.length > 0) {
                    var viewModels: TrainNotifier.KnockoutModels.Routes.RouteTrainMovement[] = data.Movements.map(function (movement: ITrainMovementResult) {
                        return new TrainNotifier.KnockoutModels.Routes.RouteTrainMovement(movement, data.Tiplocs, berth.fulltimestamp);
                    });

                    runningTrains().trainId(viewModels[0].headCode);

                    for (var i = 0; i < viewModels.length; i++) {
                        runningTrains().results.push(viewModels[i]);
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
var routeBinding = ko.observableArray<RouteRow>();

function switchRoute(routeId: string, updateSelector: boolean = false) {
    switch (routeId) {
        case "wvh":
            route = routeWvhBhm;
            break;
        case "xcn":
            route = routeXCNorth;
            break;
        case "xcs":
        default:
            routeId = "xcs";
            route = routeXCSouth;
            break;
    }
    if (updateSelector) {
        $("#route-selector").val(routeId);
    }
    document.location.hash = "!" + routeId;
    routeBinding.removeAll();
    for (var i = 0; i < route.length; i++) {
        routeBinding.push(route[i]);
    }
    updateBerthContents();
}

$(function () {
    ko.applyBindings(routeBinding, $("#route").get(0));
    ko.applyBindings(runningTrains, $("#route-results").get(0));

    var routeId = "";
    if (document.location.hash.length > 0) {
        routeId = document.location.hash.substring(2);
    }

    switchRoute(routeId, true);

    $("#route-selector").change(function () {
        switchRoute($(this.options[this.selectedIndex]).data('routeid'));
    });

    updateBerthContents();
    setInterval(function () {
        updateBerthContents();
    }, 5000);
});