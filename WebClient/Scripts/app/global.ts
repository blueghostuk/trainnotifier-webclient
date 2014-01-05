/// <reference path="../typings/moment/moment.d.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/bootstrap/bootstrap.d.ts" />
/// <reference path="webApi.ts" />

interface IPage {
    setCommand? (command: string);
    parseCommand? (): boolean;
    getCommand? (): string;
    setStatus? (status: string);
    wsOpenCommand? ();
    settingHash: boolean;
    pageTitle?: string;
    advancedMode?: boolean;
    advancedSwitch? (change?: boolean);
}

interface IServerSettings {
    apiUrl: string;
    wsUrl: string;
    apiName: string;
}

function preAjax() {
    show($(".progress"));
    hide($("#error-row"));
    hide($("#no-results-row"));
}

function show(element) {
    $(element).removeClass("hide");
    $(element).show();
}

function hide(element) {
    $(element).hide();
    $(element).addClass("hide");
}

interface String {
    capitalize(): string;
}

// http://stackoverflow.com/a/7592235
String.prototype.capitalize = function () {
    return this.toLowerCase().replace(/(?:^|\s)\S/g, function (a) { return a.toUpperCase(); });
};

// Module
module TrainNotifier {

    // Class
    export class Common {

        static serverSettings: IServerSettings;
        static page: IPage;
        static webApi: IWebApi;
        
        static displayStanox(stanox: IStationTiploc) {
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
        }

        static trimNullableString(str: string) {
            if (str)
                return str.trim();
            return null;
        }
    }

    export class DateTimeFormats {
        public static timeUrlFormat = "HH-mm";
        public static timeFormat = "HH:mm:ss";
        public static shortTimeFormat = "HH:mm";
        public static dateFormat = "DD/MM/YY";
        public static dateTimeFormat = "DD/MM/YY HH:mm:ss";
        public static dateTimeHashFormat = "YYYY-MM-DD/HH-mm";
        public static dateQueryFormat = "YYYY-MM-DD";
        public static dateUrlFormat = "YYYY/MM/DD";
        public static dateTitleFormat = "ddd Do MMM YYYY";
        public static dateTimeApiFormat = "YYYY-MM-DDTHH:mm";
        public static timeFrameMinutesBefore = 15;
        public static timeFrameHours = 1;

        public static formatTimeString(time: string) : string {
            if (time){
                var timeMoment = moment(time, TrainNotifier.DateTimeFormats.timeFormat);
                return DateTimeFormats.formatTimeMoment(timeMoment);
            }
            return null;
        }

        public static formatDateTimeString(dateTime: string): string {
            if (dateTime) {
                var timeMoment = moment(dateTime);
                return DateTimeFormats.formatTimeMoment(timeMoment);
            }
            return null;
        }

        public static formatTimeMoment(timeMoment: Moment): string {
            if (timeMoment && timeMoment.isValid()) {
                var ts = timeMoment.format(TrainNotifier.DateTimeFormats.shortTimeFormat);
                if (timeMoment.seconds() === 30) {
                    ts += TrainNotifier.CommonStrings.halfMinute;
                }
                return ts;
            }
            return null;
        }
    }

    export class CommonStrings{
        public static halfMinute = "½";
    }

}