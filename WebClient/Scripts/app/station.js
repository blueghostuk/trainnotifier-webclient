var Section = (function () {
    function Section(name, berth) {
        if (typeof berth === "undefined") { berth = null; }
        this.name = name;
        this.berth = berth;
        this.text = ko.observable();
        this.timestamp = ko.observable();
    }
    Section.prototype.setTime = function (timestamp) {
        var ts = moment.utc(timestamp).local();
        if (ts && ts.isValid()) {
            this.timestamp(ts.format(Section.TsFormat));
        }
    };
    Section.TsFormat = "HH:mm:ss";
    return Section;
})();

var Platform = (function () {
    function Platform(name, sections) {
        this.name = name;
        this.sections = sections;
    }
    return Platform;
})();

var Station = (function () {
    function Station(name, platforms) {
        this.name = name;
        this.platforms = platforms;
    }
    return Station;
})();

var platforms = [];
for (var i = 1; i <= 12; i++) {
    platforms.push(new Platform(i.toString(), [
        new Section(i + "A"),
        new Section(i + "A"),
        new Section(i + "A"),
        new Section(i + "B"),
        new Section(i + "B"),
        new Section(i + "B")
    ]));
}

platforms[0].sections[0].berth = "BN-0154";

platforms[0].sections[1].berth = "BN-0149";

platforms[0].sections[2].berth = "BN-0205";

platforms[0].sections[3].berth = "BN-0209";

platforms[0].sections[4].berth = "BN-0471";

platforms[0].sections[5].berth = "BN-0244";

platforms[1].sections[0].berth = "BN-0154";

platforms[1].sections[1].berth = "BN-0149";

platforms[1].sections[2].berth = "BN-0199";

platforms[1].sections[3].berth = "BN-0208";

platforms[1].sections[4].berth = "BN-0471";

platforms[1].sections[5].berth = "BN-0244";

platforms[2].sections[0].berth = "BN-0154";

platforms[2].sections[1].berth = "BN-0149";

platforms[2].sections[2].berth = "BN-0198";

platforms[2].sections[3].berth = "BN-0206";

platforms[2].sections[4].berth = "BN-0471";

platforms[2].sections[5].berth = "BN-0244";

platforms[3].sections[0].berth = "BN-0154";

platforms[3].sections[1].berth = "BN-0149";

platforms[3].sections[2].berth = "BN-0203";

platforms[3].sections[3].berth = "BN-0204";

platforms[3].sections[4].berth = "BN-0471";

platforms[3].sections[5].berth = "BN-0244";

platforms[4].sections[0].berth = "BN-0154";

platforms[4].sections[1].berth = "BN-0149";

platforms[4].sections[2].berth = "BN-0201";

platforms[4].sections[3].berth = "BN-0202";

platforms[4].sections[4].berth = "BN-0452";

platforms[4].sections[5].berth = "BN-0244";

platforms[5].sections[0].berth = "BN-0154";

platforms[5].sections[1].berth = "BN-0149";

platforms[5].sections[2].berth = "BN-0194";

platforms[5].sections[3].berth = "BN-0195";

platforms[5].sections[4].berth = "BN-0452";

platforms[5].sections[5].berth = "BN-0244";

platforms[6].sections[0].berth = "BN-0154";

platforms[6].sections[1].berth = "BN-0149";

platforms[6].sections[2].berth = "BN-0192";

platforms[6].sections[3].berth = "BN-0193";

platforms[6].sections[4].berth = "BN-0452";

platforms[6].sections[5].berth = "BN-0244";

platforms[7].sections[0].berth = "BN-0149";

platforms[7].sections[1].berth = "BN-0148";

platforms[7].sections[2].berth = "BN-0189";

platforms[7].sections[3].berth = "BN-0191";

platforms[7].sections[4].berth = "BN-0452";

platforms[7].sections[5].berth = "BN-0244";

platforms[8].sections[0].berth = "BN-0151";

platforms[8].sections[1].berth = "BN-0148";

platforms[8].sections[2].berth = "BN-0187";

platforms[8].sections[3].berth = "BN-0188";

platforms[8].sections[4].berth = "BN-0452";

platforms[8].sections[5].berth = "BN-0244";

platforms[9].sections[0].berth = "BN-0151";

platforms[9].sections[1].berth = "BN-0148";

platforms[9].sections[2].berth = "BN-0184";

platforms[9].sections[3].berth = "BN-0185";

platforms[9].sections[4].berth = "BN-0452";

platforms[9].sections[5].berth = "BN-0244";

platforms[10].sections[0].berth = "BN-0151";

platforms[10].sections[1].berth = "BN-0148";

platforms[10].sections[2].berth = "BN-0183";

platforms[10].sections[3].berth = "BN-X214";

platforms[10].sections[4].berth = "BN-0452";

platforms[10].sections[5].berth = "BN-0244";

platforms[11].sections[0].berth = "BN-0151";

platforms[11].sections[1].berth = "BN-0148";

platforms[11].sections[2].berth = "BN-0182";

platforms[11].sections[3].berth = "BN-X212";

platforms[11].sections[4].berth = "BN-0452";

platforms[11].sections[5].berth = "BN-0244";

var station = new Station("Birmingham New Street", platforms);

var webApi = new TrainNotifier.WebApi();

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
                (function (section) {
                    webApi.getBerthContents(section.berth).done(function (data) {
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
