/// <reference path="typings/bootstrap/bootstrap.d.ts" />
/// <reference path="webApi.ts" />
/// <reference path="typings/jquery/jquery.d.ts" />

// Module
module TrainNotifier {

    // Class
    export class Common {
        
        static displayStanox(stanox: IStanox) {
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
    }

}