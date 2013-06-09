/// <reference path="websockets.ts" />
/// <reference path="global.ts" />
/// <reference path="../typings/moment/moment.d.ts" />
/// <reference path="../typings/knockout/knockout.d.ts" />
/// <reference path="webApi.ts" />

interface KnockoutObservableLiveStop extends KnockoutObservableBase{
    (): TrainNotifier.KnockoutModels.Train.LiveStopBase;
    (value: TrainNotifier.KnockoutModels.Train.LiveStopBase): void;

    subscribe(callback: (newValue: TrainNotifier.KnockoutModels.Train.LiveStopBase) => void , target?: any, topic?: string): KnockoutSubscription;
    notifySubscribers(valueToWrite: TrainNotifier.KnockoutModels.Train.LiveStopBase, topic?: string);
}

interface KnockoutObservableArrayLiveStop extends KnockoutObservableArrayFunctions {
    (): TrainNotifier.KnockoutModels.Train.LiveStopBase[];
    (value: TrainNotifier.KnockoutModels.Train.LiveStopBase[]): void;

    subscribe(callback: (newValue: TrainNotifier.KnockoutModels.Train.LiveStopBase[]) => void , target?: any, topic?: string): KnockoutSubscription;
    notifySubscribers(valueToWrite: TrainNotifier.KnockoutModels.Train.LiveStopBase[], topic?: string);
}

interface KnockoutObservableArrayScheduleStop extends KnockoutObservableArrayFunctions {
    (): TrainNotifier.KnockoutModels.Train.ScheduleStop[];
    (value: TrainNotifier.KnockoutModels.Train.ScheduleStop[]): void;

    subscribe(callback: (newValue: TrainNotifier.KnockoutModels.Train.ScheduleStop[]) => void , target?: any, topic?: string): KnockoutSubscription;
    notifySubscribers(valueToWrite: TrainNotifier.KnockoutModels.Train.ScheduleStop[], topic?: string);
}

module TrainNotifier.KnockoutModels.Train {

    export class ScheduleStop {
        public location: string;
        public locationStanox: string;
        public wttArrive: string = null;
        public publicArrive: string = null;
        public actualArrival: KnockoutComputed;
        public arrivalDelay: KnockoutComputed;
        public arrivalDelayCss: KnockoutComputed;
        public wttDepart: string = null;
        public publicDepart: string = null;
        public actualDeparture: KnockoutComputed;
        public departureDelay: KnockoutComputed;
        public departureDelayCss: KnockoutComputed;
        public line: string = null;
        public platform: string = null;
        public allowances: string = null;
        public pass: string = null;
        private associateLiveStop: KnockoutObservableLiveStop = ko.observable();

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

            var self = this;
            this.actualArrival = ko.computed(function () {
                if (self.associateLiveStop())
                    return self.associateLiveStop().actualArrival();

                return null;
            });
            this.arrivalDelay = ko.computed(function () {
                if (self.associateLiveStop())
                    return self.associateLiveStop().arrivalDelay();

                return null;
            });
            this.arrivalDelayCss = ko.computed(function () {
                return self.getDelayCss(self.arrivalDelay());
            });

            this.actualDeparture = ko.computed(function () {
                if (self.associateLiveStop())
                    return self.associateLiveStop().actualDeparture();

                return null;
            });
            this.departureDelay = ko.computed(function () {
                if (self.associateLiveStop())
                    return self.associateLiveStop().departureDelay();

                return null;
            });
            this.departureDelayCss = ko.computed(function () {
                return self.getDelayCss(self.departureDelay());
            });
        }

        private getDelayCss(value: Number) {
            if (value === 0)
                return "badge-success";
            if (value < 0)
                return "badge-info";
            if (value > 10)
                return "badge-important";
            if (value > 0)
                return "badge-warning";

            return "hidden";
        }

        associateWithLiveStop(liveStop: LiveStopBase) {
            this.associateLiveStop(liveStop);
        }

        validateAssociation(liveStop: LiveStopBase) {
            if (this.associateLiveStop())
                return false;

            return liveStop.locationStanox === this.locationStanox;
        }
    }

    export class LiveStopBase {
        public location: string;
        public locationStanox: string;
        public plannedArrival: KnockoutObservableString = ko.observable();
        public actualArrival: KnockoutObservableString = ko.observable();
        public arrivalDelay: KnockoutObservableNumber = ko.observable();
        public arrivalDelayCss: KnockoutComputed;
        public plannedDeparture: KnockoutObservableString = ko.observable();
        public actualDeparture: KnockoutObservableString = ko.observable();
        public departureDelay: KnockoutObservableNumber = ko.observable();
        public departureDelayCss: KnockoutComputed;
        public line: KnockoutObservableString = ko.observable();
        public platform: KnockoutObservableString = ko.observable();
        public nextLocation: KnockoutObservableString = ko.observable();
        public nextAt: KnockoutObservableString = ko.observable();
        public berthUpdate = false;
        public offRoute: KnockoutObservableBool = ko.observable(false);
        public notes: KnockoutObservableString = ko.observable();
        private departureSet = false;
        private arrivalSet = false;
        private timeStamp: Number = 0;

        constructor(location?: string, tiplocs?: IStationTiploc[]) {
            var self = this;
            this.arrivalDelayCss = ko.computed(function () {
                return self.getDelayCss(self.arrivalDelay());
            });
            this.departureDelayCss = ko.computed(function () {
                return self.getDelayCss(self.departureDelay());
            });

            if (!location || !tiplocs || tiplocs.length == 0)
                return;

            var tiploc = StationTiploc.findStationTiploc(location, tiplocs);
            this.location = tiploc.Description.toLowerCase();
            this.locationStanox = tiploc.Stanox;
        }

        private getDelayCss(value: Number) {
            if (value === 0)
                return "badge-success";
            if (value < 0)
                return "badge-info";
            if (value > 10)
                return "badge-important";
            if (value > 0)
                return "badge-warning";

            return "hidden";
        }

        private updateArrival(plannedArrival: string, actualArrival: string, line: string, platform: string, offRoute: bool, nextStanox: string, expectedAtNextStanox: string, tiplocs: IStationTiploc[]) {
            this.arrivalSet = true;
            this.plannedArrival(DateTimeFormats.formatDateTimeString(plannedArrival));
            this.actualArrival(DateTimeFormats.formatDateTimeString(actualArrival));

            var planned = moment(plannedArrival);
            var actual = moment(actualArrival);
            this.arrivalDelay(actual.diff(planned, 'minutes'));
            this.timeStamp = actual.unix();

            this.updateCommon(line, platform, offRoute, nextStanox, expectedAtNextStanox, tiplocs);
        }

        private updateDeparture(plannedDeparture: string, actualDeparture: string, line: string, platform: string, offRoute: bool, nextStanox: string, expectedAtNextStanox: string, tiplocs: IStationTiploc[]) {
            this.departureSet = true;
            this.plannedDeparture(DateTimeFormats.formatDateTimeString(plannedDeparture));
            this.actualDeparture(DateTimeFormats.formatDateTimeString(actualDeparture));

            var planned = moment(plannedDeparture);
            var actual = moment(actualDeparture);
            this.departureDelay(actual.diff(planned, 'minutes'));
            if (this.timeStamp == 0)
                this.timeStamp = actual.unix();

            this.updateCommon(line, platform, offRoute, nextStanox, expectedAtNextStanox, tiplocs);
        }

        private updateCommon(line: string, platform: string, offRoute: bool, nextStanox: string, expectedAtNextStanox: string, tiplocs: IStationTiploc[]) {
            this.line(this.line() || line);
            this.platform(this.platform() || platform);

            this.offRoute(this.offRoute() || offRoute);
            if (nextStanox) {
                var nextAtTiploc = StationTiploc.findStationTiploc(nextStanox, tiplocs);
                if (nextAtTiploc) {
                    this.nextLocation(nextAtTiploc.Description.toLowerCase());
                }
                if (expectedAtNextStanox) {
                    this.nextAt(DateTimeFormats.formatTimeString(expectedAtNextStanox));
                }
            }
        }

        get timeStampForSorting() {
            return this.timeStamp;
        }

        updateExistingArrival(arrivalStop: IRunningTrainActualStop, tiplocs: IStationTiploc[]) {
            this.updateArrival(
                arrivalStop.PlannedTimestamp,
                arrivalStop.ActualTimestamp,
                arrivalStop.Line,
                arrivalStop.Platform,
                null,
                null,
                null,
                tiplocs);
        }

        updateExistingDeparture(departureStop: IRunningTrainActualStop, tiplocs: IStationTiploc[]) {
            this.updateDeparture(
                departureStop.PlannedTimestamp,
                departureStop.ActualTimestamp,
                departureStop.Line,
                departureStop.Platform,
                null,
                null,
                null,
                tiplocs);
        }

        updateWebSocketArrival(arrivalStop: IWebSocketTrainMovement, tiplocs: IStationTiploc[]) {
            this.updateArrival(
                arrivalStop.PlannedTime,
                arrivalStop.ActualTimeStamp,
                arrivalStop.Line,
                arrivalStop.Platform,
                arrivalStop.OffRoute,
                arrivalStop.NextStanox,
                arrivalStop.ExpectedAtNextStanox,
                tiplocs);
        }

        updateWebSocketDeparture(departureStop: IWebSocketTrainMovement, tiplocs: IStationTiploc[]) {
            this.updateDeparture(
                departureStop.PlannedTime,
                departureStop.ActualTimeStamp,
                departureStop.Line,
                departureStop.Platform,
                departureStop.OffRoute,
                departureStop.NextStanox,
                departureStop.ExpectedAtNextStanox,
                tiplocs);
        }

        validArrival(arrivalStanox: string, tiplocs: IStationTiploc[]) {
            if (this.arrivalSet || this.berthUpdate)
                return false;
            var arrivalTiploc = StationTiploc.findStationTiploc(arrivalStanox, tiplocs);
            return this.validateStop(arrivalTiploc);
        }

        validDeparture(departureStanox: string, tiplocs: IStationTiploc[]) {
            if (this.departureSet || this.berthUpdate)
                return false;
            var departureTiploc = StationTiploc.findStationTiploc(departureStanox, tiplocs);
            return this.validateStop(departureTiploc);
        }

        private validateStop(tiploc: IStationTiploc) {
            return tiploc && tiploc.Stanox === this.locationStanox;
        }
    }

    export class ExistingLiveStop extends LiveStopBase {

        constructor(tiplocs: IStationTiploc[], arrivalStop?: IRunningTrainActualStop, departureStop?: IRunningTrainActualStop) {
            super(arrivalStop ? arrivalStop.TiplocStanoxCode : departureStop.TiplocStanoxCode, tiplocs);

            if (arrivalStop) {
                this.updateExistingArrival(arrivalStop, tiplocs);
            }

            if (departureStop) {
                this.updateExistingDeparture(departureStop, tiplocs);
            }
        }
    }

    export class NewLiveStop extends LiveStopBase {

        constructor(tiplocs: IStationTiploc[], arrivalStop?: IWebSocketTrainMovement, departureStop?: IWebSocketTrainMovement) {
            super(arrivalStop ? arrivalStop.Stanox : departureStop.Stanox, tiplocs);

            if (arrivalStop) {
                this.updateWebSocketArrival(arrivalStop, tiplocs);
            }

            if (departureStop) {
                this.updateWebSocketDeparture(departureStop, tiplocs);
            }
        }
    }

    export class BerthLiveStop extends LiveStopBase {

        constructor(berthUpdate: IWebSocketBerthStep) {
            super();

            this.berthUpdate = true;
            this.location = berthUpdate.From;
            if (berthUpdate.To && berthUpdate.To.length > 0)
                this.location += " - " + berthUpdate.To;

            // supplied time is in UTC, want to format to local (in theory this is UK)
            // note these times are shown with seconds as they may not be on the 00/30 mark
            this.actualArrival(moment.utc(berthUpdate.Time).local().format(DateTimeFormats.timeFormat));
            this.notes("From Area: " + berthUpdate.AreaId);
        }
    }

}