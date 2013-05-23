/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/bootstrap/bootstrap.d.ts" />
/// <reference path="webApi.ts" />

interface IPage {
    setCommand?(command: string);
    parseCommand?(): bool;
    getCommand?(): string;
    setStatus? (status: string);
    wsOpenCommand? ();
    pageTitle?: string;
}

interface IServerSettings {
    server: string;
    apiPort: string;
    wsPort: string;
}

// Module
module TrainNotifier {

    // Class
    export class Common {

        static serverSettings: IServerSettings;
        static page: IPage;
        static webApi: IWebApi;
        
        static displayStanox(stanox: IStanox) {
            if (!stanox)
                return;
            var html = "";
            if (stanox.StationName) {
                html = stanox.StationName.toLowerCase();
            } else {
                html = stanox.Tiploc.toLowerCase();
            }
            if (stanox.CRS) {
                html += " (" + stanox.CRS + ")";
            }
            $(".stanox-" + stanox.Stanox).html(html);
            $(".stanox-" + stanox.Stanox).tooltip({
                title: stanox.Stanox
            });
            $(".stanox-" + stanox.Stanox).addClass("stationName");
        };
    };

    export class DateTimeFormats {
        public static timeUrlFormat = "HH-mm";
        public static timeFormat = "HH:mm:ss";
        public static shortTimeFormat = "HH:mm";
        public static dateFormat = "DD/MM/YY";
        public static dateTimeFormat = "DD/MM/YY HH:mm:ss";
        public static dateTimeHashFormat = "YYYY-MM-DD/HH-mm";
        public static dateQueryFormat = "YYYY-MM-DD";
        public static dateUrlFormat = "YYYY/MM/DD";

        public static formatTimeString(time: string) : string {
            if (time){
                var timeMoment = moment(time, TrainNotifier.DateTimeFormats.timeFormat);
                var ts = timeMoment.format(TrainNotifier.DateTimeFormats.shortTimeFormat);
                if (timeMoment.seconds() === 30) {
                    ts += TrainNotifier.CommonStrings.halfMinute;
                }
                return ts;
            }
            return null;
        };
    };

    export class CommonStrings{
        public static halfMinute = "½";
    };

}