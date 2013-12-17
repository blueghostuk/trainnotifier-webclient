var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var TrainNotifier;
(function (TrainNotifier) {
    (function (KnockoutModels) {
        (function (Routes) {
            var RouteTrainMovement = (function (_super) {
                __extends(RouteTrainMovement, _super);
                function RouteTrainMovement(trainMovement, tiplocs, queryStartDate) {
                    _super.call(this, trainMovement, tiplocs, queryStartDate);
                    this.departure = "";
                    this.arrival = "";
                    this.highlight = false;

                    if (trainMovement.Schedule.Stops.length > 0) {
                        var fromStop = trainMovement.Schedule.Stops[0];
                        var fromTiploc = TrainNotifier.StationTiploc.findStationTiploc(fromStop.TiplocStanoxCode, tiplocs);
                        if (fromTiploc) {
                            this.fromStation = fromTiploc.Description.toLowerCase();
                        }
                        var pubDepart = TrainNotifier.DateTimeFormats.formatTimeString(fromStop.PublicDeparture);
                        var wttDepart = TrainNotifier.DateTimeFormats.formatTimeString(fromStop.Departure);
                        this.departure = pubDepart || wttDepart || "Unknown";
                        var depart = fromStop.PublicDeparture || fromStop.Departure || null;

                        var toStop = trainMovement.Schedule.Stops[trainMovement.Schedule.Stops.length - 1];
                        var toTiploc = TrainNotifier.StationTiploc.findStationTiploc(toStop.TiplocStanoxCode, tiplocs);
                        if (toTiploc) {
                            this.toStation = toTiploc.Description.toLowerCase();
                        }
                        var pubArr = TrainNotifier.DateTimeFormats.formatTimeString(toStop.PublicArrival);
                        var wttArr = TrainNotifier.DateTimeFormats.formatTimeString(toStop.Arrival);
                        this.arrival = pubArr || wttArr || "Unknown";
                        var arrive = toStop.PublicArrival || toStop.Arrival || null;

                        if (depart && arrive) {
                            var qs = moment(queryStartDate).add({ minutes: 10 });
                            var qe = moment(queryStartDate).subtract({ minutes: 10 });
                            if (moment(depart, TrainNotifier.DateTimeFormats.timeFormat).isBefore(qs) && moment(arrive, TrainNotifier.DateTimeFormats.timeFormat).isAfter(qe)) {
                                this.highlight = true;
                            }
                        }
                    }
                }
                return RouteTrainMovement;
            })(TrainNotifier.KnockoutModels.Search.TrainMovement);
            Routes.RouteTrainMovement = RouteTrainMovement;
        })(KnockoutModels.Routes || (KnockoutModels.Routes = {}));
        var Routes = KnockoutModels.Routes;
    })(TrainNotifier.KnockoutModels || (TrainNotifier.KnockoutModels = {}));
    var KnockoutModels = TrainNotifier.KnockoutModels;
})(TrainNotifier || (TrainNotifier = {}));
