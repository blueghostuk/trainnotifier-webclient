var TrainNotifier;
(function (TrainNotifier) {
    var Common = (function () {
        function Common() { }
        Common.displayStanox = function displayStanox(stanox) {
            if(!stanox) {
                return;
            }
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
    var DateTimeFormats = (function () {
        function DateTimeFormats() { }
        DateTimeFormats.timeUrlFormat = "HH-mm";
        DateTimeFormats.timeFormat = "HH:mm:ss";
        DateTimeFormats.dateTimeFormat = "DD/MM/YY HH:mm:ss";
        DateTimeFormats.dateTimeHashFormat = "YYYY-MM-DD/HH-mm";
        DateTimeFormats.dateQueryFormat = "YYYY-MM-DD";
        DateTimeFormats.dateUrlFormat = "YYYY/MM/DD";
        return DateTimeFormats;
    })();
    TrainNotifier.DateTimeFormats = DateTimeFormats;    
})(TrainNotifier || (TrainNotifier = {}));
