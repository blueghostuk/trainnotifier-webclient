/// <reference path="global.ts" />
/// <reference path="../typings/moment/moment.d.ts" />
/// <reference path="../typings/knockout/knockout.d.ts" />
/// <reference path="webApi.ts" />

module TrainNotifier.KnockoutModels {

    export class CurrentLocation {
        public name = ko.observable();
        public crsCode = ko.observable();
        public stanox = ko.observable();
        public url: KnockoutComputed;

        constructor(location?: IStationTiploc) {
            var self = this;
            this.update(location);
            this.url = ko.computed(function () {
                return self.crsCode() ? self.crsCode() : self.name() ? self.name() : "";
            });
        }

        update(location?: IStationTiploc) {
            if (location) {
                this.name(location.Description);
                this.crsCode(location.CRS);
                this.stanox(location.Stanox);
            } else {
                this.name(null);
                this.crsCode(null);
                this.stanox(null);
            }
        };
    }

    export class TrainMovement {
        public trainId: string;
        public headCode: string;
        public operatorCode: string = "NA";
        public operatorName: string = "Unknown";

        constructor(trainMovement: ITrainMovementResult, tiplocs: IStationTiploc[]) {
            this.trainId = trainMovement.Schedule.TrainUid;
            if (trainMovement.Schedule.AtocCode) {
                this.operatorCode = trainMovement.Schedule.AtocCode.Code;
                this.operatorName = trainMovement.Schedule.AtocCode.Name;
            }
            if (trainMovement.Actual) {
                this.headCode = trainMovement.Actual.HeadCode;
            } else {
                // if no actual we can only show the uid
                this.headCode = this.trainId;
            }
        }
    }

    export class StartingAtTrainMovement extends TrainMovement  {
        public fromStation: string;
        public fromPlatform: string;
        public publicDeparture: string = "";
        public wttDeparture: string;
        public actualDeparture: string = "";

        public toStation: string;
        public toPlatform: string;
        public publicArrival: string = "";
        public wttArrival: string;
        public actualArrival: string = "";

        public departureDate: string = "";

        constructor(trainMovement: ITrainMovementResult, tiplocs: IStationTiploc[]) {
            super(trainMovement, tiplocs);

            var toStop: IRunningScheduleTrainStop;
            //TODO: if no actual get this elsewhere
            if (trainMovement.Actual && trainMovement.Actual.OriginDepartTimestamp) {
                this.departureDate = moment(trainMovement.Actual.OriginDepartTimestamp)
                    .format(DateTimeFormats.dateUrlFormat);
            }
            if (trainMovement.Schedule.Stops.length > 0) {
                var fromStop = trainMovement.Schedule.Stops[0];
                var fromTiploc = StationTiploc.findStationTiploc(fromStop.TiplocStanoxCode, tiplocs);
                if (fromTiploc) {
                    this.fromStation = fromTiploc.Description.toLowerCase();
                }

                // TODO: compare to actual 
                this.fromPlatform = fromStop.Platform;
                this.publicDeparture = DateTimeFormats.formatTimeString(fromStop.PublicDeparture);
                this.wttDeparture = DateTimeFormats.formatTimeString(fromStop.Departure);

                toStop = trainMovement.Schedule.Stops[trainMovement.Schedule.Stops.length - 1];
                var toTiploc = StationTiploc.findStationTiploc(toStop.TiplocStanoxCode, tiplocs);
                if (toTiploc) {
                    this.toStation = toTiploc.Description.toLowerCase();
                }
                // TODO: compare to actual 
                this.toPlatform = toStop.Platform;
                this.publicArrival = DateTimeFormats.formatTimeString(toStop.PublicArrival);
                this.wttArrival = DateTimeFormats.formatTimeString(toStop.Arrival);
            }

            if (trainMovement.Actual && trainMovement.Actual.Stops.length > 0) {
                // TODO: check is actual location and is departure
                var fromActual = trainMovement.Actual.Stops[0];
                this.actualDeparture = DateTimeFormats.formatDateTimeString(fromActual.ActualTimestamp);

                // TODO: check is actual
                if (toStop) {
                    var lastActual = trainMovement.Actual.Stops[trainMovement.Actual.Stops.length - 1];
                    if (lastActual.ScheduleStopNumber == toStop.StopNumber &&
                        lastActual.EventType == EventType.Arrival &&
                        lastActual.TiplocStanoxCode == toStop.TiplocStanoxCode) {
                        this.actualArrival = DateTimeFormats.formatDateTimeString(lastActual.ActualTimestamp);
                    }
                }
            }
        }
    }
}