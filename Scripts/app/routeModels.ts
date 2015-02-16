/// <reference path="global.ts" />
/// <reference path="../typings/moment/moment.d.ts" />
/// <reference path="../typings/knockout/knockout.d.ts" />
/// <reference path="webApi.ts" />
/// <reference path="searchModels.ts" />

module TrainNotifier.KnockoutModels.Routes {

    export class RouteTrainMovementResults {
        public trainId = ko.observable<string>();
        public results = ko.observableArray<RouteTrainMovement>();
    }

    export class RouteTrainMovement extends TrainNotifier.KnockoutModels.Search.TrainMovement {

        public departure: string = "";

        public arrival: string = "";

        public highlight: boolean = false;

        constructor(trainMovement: ITrainMovementResult, tiplocs: IStationTiploc[], queryStartDate: Moment) {
            super(trainMovement, tiplocs, queryStartDate, ko.observable(true));

            if (trainMovement.Schedule.Stops.length > 0) {
                var fromStop = trainMovement.Schedule.Stops[0];
                var fromTiploc = StationTiploc.findStationTiploc(fromStop.TiplocStanoxCode, tiplocs);
                if (fromTiploc) {
                    this.fromStation = fromTiploc.Description.toLowerCase();
                }
                var pubDepart = DateTimeFormats.formatTimeString(fromStop.PublicDeparture);
                var wttDepart = DateTimeFormats.formatTimeString(fromStop.Departure);
                this.departure = pubDepart || wttDepart || "Unknown";
                var depart = fromStop.PublicDeparture || fromStop.Departure || null;

                var toStop = trainMovement.Schedule.Stops[trainMovement.Schedule.Stops.length - 1];
                var toTiploc = StationTiploc.findStationTiploc(toStop.TiplocStanoxCode, tiplocs);
                if (toTiploc) {
                    this.toStation = toTiploc.Description.toLowerCase();
                }
                var pubArr = DateTimeFormats.formatTimeString(toStop.PublicArrival);
                var wttArr = DateTimeFormats.formatTimeString(toStop.Arrival);
                this.arrival = pubArr || wttArr || "Unknown";
                var arrive = toStop.PublicArrival || toStop.Arrival || null;

                if (depart && arrive) {
                    var qs = moment(queryStartDate).add({ minutes: 10 });
                    var qe = moment(queryStartDate).subtract({ minutes: 10 });
                    if (moment(depart, DateTimeFormats.timeFormat).isBefore(qs) && moment(arrive, DateTimeFormats.timeFormat).isAfter(qe)) {
                        this.highlight = true;
                    }
                }
            }
        }
    }

}