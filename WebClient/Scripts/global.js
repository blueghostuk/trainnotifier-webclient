var TrainNotifier;
(function (TrainNotifier) {
    var Common = (function () {
        function Common() { }
        Common.displayStanox = function displayStanox(stanox) {
            var html = "";
            if(stanox.StationName) {
                html = stanox.StationName.toLowerCase();
            } else {
                html = stanox.Tiploc.toLowerCase();
            }
            if(stanox.CRS) {
                html += " (" + stanox.CRS + ")";
            }
            $(".stanox-" + stanox.Stanox).html(html);
            $(".stanox-" + stanox.Stanox).tooltip({
                title: stanox.Stanox
            });
            $(".stanox-" + stanox.Stanox).addClass("stationName");
        };
        return Common;
    })();
    TrainNotifier.Common = Common;    
})(TrainNotifier || (TrainNotifier = {}));
