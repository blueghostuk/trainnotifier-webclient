
class Section {
    public static TsFormat = "HH:mm:ss";

    public text: KnockoutObservable<string> = ko.observable();
    public timestamp: KnockoutObservable<string> = ko.observable();

    constructor(public name: string, public berth: string = null) { }

    public setTime(timestamp: string) {
        var ts = moment.utc(timestamp).local();
        if (ts && ts.isValid()) {
            this.timestamp(ts.format(Section.TsFormat));
        }
    }
}

class Platform {
    constructor(public name: string, public sections: Array<Section>) { }
}

class Station {
    constructor(public name: string, public platforms: Array<Platform>) { }
}

var platforms: Array<Platform> = [];
for (var i = 1; i <= 12; i++) {
    platforms.push(new Platform(i.toString(),
        [
            new Section(i + "A"),
            new Section(i + "A"),
            new Section(i + "A"),
            new Section(i + "B"),
            new Section(i + "B"),
            new Section(i + "B")
        ]));
}

// XOJ = PROOF HOUSE JUNCTION

// -> 1A
platforms[0].sections[0].berth = "BN-0154";
// <- 1A
platforms[0].sections[1].berth = "BN-0149";
// 1A
platforms[0].sections[2].berth = "BN-0205";
// 1B
platforms[0].sections[3].berth = "BN-0209";
// -> 1B
platforms[0].sections[4].berth = "BN-0471";
// <- 1B
platforms[0].sections[5].berth = "BN-0244";

// -> 2A
platforms[1].sections[0].berth = "BN-0154";
// <- 2A
platforms[1].sections[1].berth = "BN-0149";
// 2A
platforms[1].sections[2].berth = "BN-0199";
// 2B
platforms[1].sections[3].berth = "BN-0208";
// -> 2B
platforms[1].sections[4].berth = "BN-0471";
// <- 2B
platforms[1].sections[5].berth = "BN-0244";

// -> 3A
platforms[2].sections[0].berth = "BN-0154";
// <- 3A
platforms[2].sections[1].berth = "BN-0149";
// 3A
platforms[2].sections[2].berth = "BN-0198";
// 3B
platforms[2].sections[3].berth = "BN-0206";
// -> 3B
platforms[2].sections[4].berth = "BN-0471";
// <- 3B
platforms[2].sections[5].berth = "BN-0244";

// -> 4A
platforms[3].sections[0].berth = "BN-0154";
// <- 4A
platforms[3].sections[1].berth = "BN-0149";
// 4A
platforms[3].sections[2].berth = "BN-0203";
// 4B
platforms[3].sections[3].berth = "BN-0204";
// -> 4B
platforms[3].sections[4].berth = "BN-0471";
// <- 4B
platforms[3].sections[5].berth = "BN-0244";

// 4C
//platforms[3].sections[3] = new Section("4C", "BN-0229");

// -> 5A
platforms[4].sections[0].berth = "BN-0154";
// <- 5A
platforms[4].sections[1].berth = "BN-0149";
// 5A
platforms[4].sections[2].berth = "BN-0201";
// 5B
platforms[4].sections[3].berth = "BN-0202";
// -> 5B
platforms[4].sections[4].berth = "BN-0452";
// <- 5B
platforms[4].sections[5].berth = "BN-0244";

// -> 6A
platforms[5].sections[0].berth = "BN-0154";
// <- 6A
platforms[5].sections[1].berth = "BN-0149";
// 6A
platforms[5].sections[2].berth = "BN-0194";
// 6B
platforms[5].sections[3].berth = "BN-0195";
// -> 6B
platforms[5].sections[4].berth = "BN-0452";
// <- 6B
platforms[5].sections[5].berth = "BN-0244";

// -> 7A
platforms[6].sections[0].berth = "BN-0154";
// <- 7A
platforms[6].sections[1].berth = "BN-0149";
// 7A
platforms[6].sections[2].berth = "BN-0192";
// 7B
platforms[6].sections[3].berth = "BN-0193";
// -> 7B
platforms[6].sections[4].berth = "BN-0452";
// <- 7B
platforms[6].sections[5].berth = "BN-0244";

// -> 8A
platforms[7].sections[0].berth = "BN-0149";
// <- 8A
platforms[7].sections[1].berth = "BN-0148";
// 8A
platforms[7].sections[2].berth = "BN-0189";
// 8B
platforms[7].sections[3].berth = "BN-0191";
// -> 8B
platforms[7].sections[4].berth = "BN-0452";
// <- 8B
platforms[7].sections[5].berth = "BN-0244";

// -> 9A
platforms[8].sections[0].berth = "BN-0151";
// <- 9A
platforms[8].sections[1].berth = "BN-0148";
// 9A
platforms[8].sections[2].berth = "BN-0187";
// 9B
platforms[8].sections[3].berth = "BN-0188";
// -> 9B
platforms[8].sections[4].berth = "BN-0452";
// <- 9B
platforms[8].sections[5].berth = "BN-0244";

// -> 10A
platforms[9].sections[0].berth = "BN-0151";
// <- 10A
platforms[9].sections[1].berth = "BN-0148";
// 10A
platforms[9].sections[2].berth = "BN-0184";
// 10B
platforms[9].sections[3].berth = "BN-0185";
// -> 10B
platforms[9].sections[4].berth = "BN-0452";
// <- 10B
platforms[9].sections[5].berth = "BN-0244";

// -> 11A
platforms[10].sections[0].berth = "BN-0151";
// <- 11A
platforms[10].sections[1].berth = "BN-0148";
// 11A
platforms[10].sections[2].berth = "BN-0183";
// 11B
platforms[10].sections[3].berth = "BN-X214";
// -> 11B
platforms[10].sections[4].berth = "BN-0452";
// <- 11B
platforms[10].sections[5].berth = "BN-0244";

// -> 12A 
platforms[11].sections[0].berth = "BN-0151";
// <- 12A
platforms[11].sections[1].berth = "BN-0148";
// 12A
platforms[11].sections[2].berth = "BN-0182";
// 12B
platforms[11].sections[3].berth = "BN-X212";
// -> 12B
platforms[11].sections[4].berth = "BN-0452";
// <- 12B
platforms[11].sections[5].berth = "BN-0244";

var station = new Station("Birmingham New Street", platforms);

var webApi: IWebApi = new TrainNotifier.WebApi();

$(function () {
    ko.applyBindings(station, $("#station").get(0));

    updatePlatformBerthContents();
    setInterval(function () {
        updatePlatformBerthContents();
    }, 10000);
});

function updatePlatformBerthContents() {
    for (var i = 0; i < station.platforms.length; i++) {
        for (var j = 0; j < station.platforms[i].sections.length; j++) {
            if (station.platforms[i].sections[j].berth) {
                (function (section: Section) {
                    webApi.getBerthContents(section.berth).done(function (data?: IBerthContents) {
                        if (data) {
                            section.setTime(data.m_Item1);
                            section.text(data.m_Item2);
                        } else {
                            section.timestamp(moment().format(Section.TsFormat));
                            section.text(null);
                        }
                    });
                })(station.platforms[i].sections[j]);
            }
        }
    }
}