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
        new Section("->" + i + "A"),
        new Section(i + "A"),
        new Section(i + "B"),
        new Section(i + "B ->")
    ]));
}

// XOJ = PROOF HOUSE JUNCTION
// -> 1A
platforms[0].sections[0].berth = "BN-0149";

// 1A
platforms[0].sections[1].berth = "BN-0181";

// 1B ( XOJ? 0154, 0205 -> 1A/B?)
platforms[0].sections[2].berth = "BN-0209";

// 1B ->
platforms[0].sections[3].berth = "BN-0244";

// 2A -> BN 0179,0149,0142,0136,0083(XOZ),0442 -> DUD
// -> 2A
platforms[1].sections[0].berth = "BN-0149";

// 2A
platforms[1].sections[1].berth = "BN-0179";

// 2B
platforms[1].sections[2].berth = null;

// 2B ->
platforms[1].sections[3].berth = "BN-0208";

// -> 3A
platforms[2].sections[0].berth = null;

// 3A
platforms[2].sections[1].berth = "BN-0198";

// 3B
platforms[2].sections[2].berth = null;

// 3B ->
platforms[2].sections[3].berth = "BN-0206";

// -> 4A
platforms[3].sections[0].berth = null;

// 4A
platforms[3].sections[1].berth = "BN-0231";

// BN-0203 -> 4B -> 0231, 0471 (Tunnel)
// 4B
platforms[3].sections[2].berth = "BN-0204";

// 4C
platforms[3].sections.push(new Section("4C", "BN-0229"));

// BN-0244, 0245
// -> 5A BN-0136,0135(XOJ?),0438,0440,0446 -> BHI
platforms[4].sections[0].berth = "BN-0149";

// 5A
platforms[4].sections[1].berth = "BN-0201";

// 5B
platforms[4].sections[2].berth = "BN-0202";

// 5B ->
platforms[4].sections[3].berth = "BN-0242";

// -> 6A
platforms[5].sections[0].berth = null;

// 6A
platforms[5].sections[1].berth = null;

// 6B
platforms[5].sections[2].berth = null;

// 6B ->
platforms[5].sections[3].berth = null;

// -> 7A BN-0142(XOJ?),0136(XOJ?),0135
platforms[6].sections[0].berth = "BN-0149";

// 7A
platforms[6].sections[1].berth = "BN-0192";

// 7B
platforms[6].sections[2].berth = "BN-0193";

// 7B ->
platforms[6].sections[3].berth = "BN-0243";

// -> 8A
platforms[7].sections[0].berth = "BN-0149";

// 8A
platforms[7].sections[1].berth = "BN-0167";

// 0453 (Tunnel) 0243, 0191 -> 8B
platforms[7].sections[2].berth = "BN-0191";

// 8B -> 0148, 0133, 0132 (XOJ)
// 8B ->
platforms[7].sections[3].berth = null;

// -> 9A
platforms[8].sections[0].berth = "BN-0151";

// 9A
platforms[8].sections[1].berth = "BN-0187";

// 9B
platforms[8].sections[2].berth = null;

// 9B ->
platforms[8].sections[3].berth = null;

// -> 10A
platforms[9].sections[0].berth = null;

// 10A
platforms[9].sections[1].berth = "BN-0184";

// BN-0184 -> 10B
// 10B
platforms[9].sections[2].berth = "BN-0215";

// 10B -> BN-0452(Tunnel) -> FWY
// 10B ->
platforms[9].sections[3].berth = null;

// -> 11A
platforms[10].sections[0].berth = "BN-0148";

// 11A
platforms[10].sections[1].berth = "BN-0161";

// 11B
platforms[10].sections[2].berth = "BN-0214";

// 11B ->
platforms[10].sections[3].berth = "BN-X214";

// -> 12A -> 0133. 0123 (XOJ)
platforms[11].sections[0].berth = "BN-0151";

// 12A
platforms[11].sections[1].berth = "BN-0182";

// 12B
platforms[11].sections[2].berth = "BN-0212";

// 12B ->
platforms[11].sections[3].berth = null;

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
