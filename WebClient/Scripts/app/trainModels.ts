/// <reference path="websockets.ts" />
/// <reference path="global.ts" />
/// <reference path="../typings/moment/moment.d.ts" />
/// <reference path="../typings/knockout/knockout.d.ts" />
/// <reference path="webApi.ts" />

module TrainNotifier.KnockoutModels.Train {

    export class ScheduleStop {
        public location: string;
        public locationStanox: string;
        public wttArrive: string = null;
        public publicArrive: string = null;
        public wttDepart: string = null;
        public publicDepart: string = null;
        public line: string = null;
        public platform: string = null;
        public allowances: string = null;
        public pass: string = null;

        constructor(scheduleStop: IRunningScheduleTrainStop, tiplocs: IStationTiploc[]) {
            var tiploc = StationTiploc.findStationTiploc(scheduleStop.TiplocStanoxCode, tiplocs);
            this.location = tiploc.Description.toLowerCase();
            this.locationStanox = scheduleStop.TiplocStanoxCode;

            if (scheduleStop.Arrival) {
                this.wttArrive = DateTimeFormats.formatTimeString(scheduleStop.Arrival);
            }
            if (scheduleStop.PublicArrival) {
                this.publicArrive = DateTimeFormats.formatTimeString(scheduleStop.PublicArrival);
            }
            if (scheduleStop.Departure) {
                this.wttDepart = DateTimeFormats.formatTimeString(scheduleStop.Departure);
            }
            if (scheduleStop.PublicDeparture) {
                this.publicDepart = DateTimeFormats.formatTimeString(scheduleStop.PublicDeparture);
            }
            if (scheduleStop.Pass) {
                this.pass = DateTimeFormats.formatTimeString(scheduleStop.Pass);
            }

            this.line = scheduleStop.Line;
            this.platform = scheduleStop.Platform;
            var allowances = [];
            if (scheduleStop.EngineeringAllowance) {
                allowances.push("Eng.:" + scheduleStop.EngineeringAllowance);
            }
            if (scheduleStop.PathingAllowance) {
                allowances.push("Path:" + scheduleStop.EngineeringAllowance);
            }
            if (scheduleStop.PerformanceAllowance) {
                allowances.push("Perf.:" + scheduleStop.PerformanceAllowance);
            }
            if (allowances.length > 0) {
                this.allowances = allowances.join(", ");
            }
        }
    }

    export class LiveStopBase {
        public location: string;
        public locationStanox: string;
        public plannedArrival: string = null;
        public actualArrival: string = null;
        public arrivalDelay: number = null;
        public plannedDeparture: KnockoutObservableString = ko.observable();
        public actualDeparture: KnockoutObservableString = ko.observable();
        public departureDelay: KnockoutObservableNumber = ko.observable();
        public line: string = null;
        public platform: string = null;
        public nextLocation: KnockoutObservableString = ko.observable();
        public nextStatox: KnockoutObservableString = ko.observable();
        public nextAt: KnockoutObservableString = ko.observable();
        public berthUpdate = false;
        public offRoute = false;

        updateDeparture(departureStop: IWebSocketTrainMovement, tiplocs: IStationTiploc[]) {
            this.plannedDeparture(DateTimeFormats.formatDateTimeString(departureStop.PlannedTime));
            this.actualDeparture(DateTimeFormats.formatDateTimeString(departureStop.ActualTimeStamp));

            var planned = moment(departureStop.PlannedTime);
            var actual = moment(departureStop.ActualTimeStamp);

            this.departureDelay(actual.diff(planned, 'minutes'));
            this.line = this.line || departureStop.Line;
            this.platform = this.platform || departureStop.Platform;

            this.offRoute = departureStop.OffRoute;
            if (departureStop.NextStanox) {
                this.nextStatox(departureStop.NextStanox);
                var nextAtTiploc = StationTiploc.findStationTiploc(departureStop.NextStanox, tiplocs);
                if (nextAtTiploc) {
                    this.nextLocation(nextAtTiploc.Description.toLowerCase());
                }
                if (departureStop.ExpectedAtNextStanox) {
                    this.nextAt(DateTimeFormats.formatTimeString(departureStop.ExpectedAtNextStanox));
                }
            }
        }
    }

    export class ExistingLiveStop extends LiveStopBase {

        constructor(tiplocs: IStationTiploc[], arrivalStop?: IRunningTrainActualStop, departureStop?: IRunningTrainActualStop) {
            super();

            var stop = arrivalStop || departureStop;

            var tiploc = StationTiploc.findStationTiploc(stop.TiplocStanoxCode, tiplocs);
            this.location = tiploc.Description.toLowerCase();
            this.locationStanox = stop.TiplocStanoxCode;

            if (arrivalStop) {
                this.plannedArrival = DateTimeFormats.formatDateTimeString(arrivalStop.PlannedTimestamp);
                this.actualArrival = DateTimeFormats.formatDateTimeString(arrivalStop.ActualTimestamp);

                var planned = moment(arrivalStop.PlannedTimestamp);
                var actual = moment(arrivalStop.ActualTimestamp);

                this.arrivalDelay = actual.diff(planned, 'minutes');
                this.line = arrivalStop.Line;
                this.platform = arrivalStop.Platform;
            }

            if (departureStop) {
                this.plannedDeparture(DateTimeFormats.formatDateTimeString(departureStop.PlannedTimestamp));
                this.actualDeparture(DateTimeFormats.formatDateTimeString(departureStop.ActualTimestamp));

                var planned = moment(departureStop.PlannedTimestamp);
                var actual = moment(departureStop.ActualTimestamp);

                this.departureDelay(actual.diff(planned, 'minutes'));
                this.line = this.line || departureStop.Line;
                this.platform = this.platform || departureStop.Platform;
            }
        }
    }

    export class NewLiveStop extends LiveStopBase {


        constructor(tiplocs: IStationTiploc[], arrivalStop?: IWebSocketTrainMovement, departureStop?: IWebSocketTrainMovement) {
            super();

            var stop = arrivalStop || departureStop;

            var tiploc = StationTiploc.findStationTiploc(stop.Stanox, tiplocs);
            this.location = tiploc.Description.toLowerCase();
            this.locationStanox = stop.Stanox;

            if (arrivalStop) {
                this.plannedArrival = DateTimeFormats.formatDateTimeString(arrivalStop.PlannedTime);
                this.actualArrival = DateTimeFormats.formatDateTimeString(arrivalStop.ActualTimeStamp);

                var planned = moment(arrivalStop.PlannedTime);
                var actual = moment(arrivalStop.ActualTimeStamp);

                this.arrivalDelay = actual.diff(planned, 'minutes');
                this.line = arrivalStop.Line;
                this.platform = arrivalStop.Platform;

                this.offRoute = arrivalStop.OffRoute;
                if (arrivalStop.NextStanox) {
                    this.nextStatox(arrivalStop.NextStanox);
                    var nextAtTiploc = StationTiploc.findStationTiploc(arrivalStop.NextStanox, tiplocs);
                    if (nextAtTiploc) {
                        this.nextLocation(nextAtTiploc.Description.toLowerCase());
                    }
                    if (arrivalStop.ExpectedAtNextStanox) {
                        this.nextAt(DateTimeFormats.formatTimeString(arrivalStop.ExpectedAtNextStanox));
                    }
                }
            }

            if (departureStop) {
                this.plannedDeparture(DateTimeFormats.formatDateTimeString(departureStop.PlannedTime));
                this.actualDeparture(DateTimeFormats.formatDateTimeString(departureStop.ActualTimeStamp));

                var planned = moment(departureStop.PlannedTime);
                var actual = moment(departureStop.ActualTimeStamp);

                this.departureDelay(actual.diff(planned, 'minutes'));
                this.line = this.line || departureStop.Line;
                this.platform = this.platform || departureStop.Platform;

                this.offRoute = this.offRoute || arrivalStop.OffRoute;
                if (departureStop.NextStanox) {
                    this.nextStatox(departureStop.NextStanox);
                    var nextAtTiploc = StationTiploc.findStationTiploc(departureStop.NextStanox, tiplocs);
                    if (nextAtTiploc) {
                        this.nextLocation(nextAtTiploc.Description.toLowerCase());
                    }
                    if (departureStop.ExpectedAtNextStanox) {
                        this.nextAt(DateTimeFormats.formatTimeString(departureStop.ExpectedAtNextStanox));
                    }
                }
            }
        }
    }

}