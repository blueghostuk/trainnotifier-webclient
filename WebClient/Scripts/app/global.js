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
    ;
    var DateTimeFormats = (function () {
        function DateTimeFormats() { }
        DateTimeFormats.timeUrlFormat = "HH-mm";
        DateTimeFormats.timeFormat = "HH:mm:ss";
        DateTimeFormats.shortTimeFormat = "HH:mm";
        DateTimeFormats.dateFormat = "DD/MM/YY";
        DateTimeFormats.dateTimeFormat = "DD/MM/YY HH:mm:ss";
        DateTimeFormats.dateTimeHashFormat = "YYYY-MM-DD/HH-mm";
        DateTimeFormats.dateQueryFormat = "YYYY-MM-DD";
        DateTimeFormats.dateUrlFormat = "YYYY/MM/DD";
        DateTimeFormats.formatTimeString = function formatTimeString(time) {
            if(time) {
                var timeMoment = moment(time, TrainNotifier.DateTimeFormats.timeFormat);
                var ts = timeMoment.format(TrainNotifier.DateTimeFormats.shortTimeFormat);
                if(timeMoment.seconds() === 30) {
                    ts += TrainNotifier.CommonStrings.halfMinute;
                }
                return ts;
            }
            return null;
        };
        return DateTimeFormats;
    })();
    TrainNotifier.DateTimeFormats = DateTimeFormats;    
    ;
    var CommonStrings = (function () {
        function CommonStrings() { }
        CommonStrings.halfMinute = "½";
        return CommonStrings;
    })();
    TrainNotifier.CommonStrings = CommonStrings;    
    ;
})(TrainNotifier || (TrainNotifier = {}));
