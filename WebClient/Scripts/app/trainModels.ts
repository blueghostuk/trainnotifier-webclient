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
        public actualArrival: KnockoutComputed<string>;
        public arrivalDelay: KnockoutComputed<number>;
        public arrivalDelayCss: KnockoutComputed<string>;
        public wttDepart: string = null;
        public publicDepart: string = null;
        public actualDeparture: KnockoutComputed<string>;
        public departureDelay: KnockoutComputed<number>;
        public departureDelayCss: KnockoutComputed<string>;
        public line: string = null;
        public platform: string = null;
        public eAllowance: string = null;
        public paAllowance: string = null;
        public peAllowance: string = null;
        public pass: string = null;

        private associateLiveStop: KnockoutObservable<LiveStopBase> = ko.observable();

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
            if (scheduleStop.EngineeringAllowance) {
                this.eAllowance = "[" + scheduleStop.EngineeringAllowance + "]"
            }
            if (scheduleStop.PathingAllowance) {
                this.paAllowance = "(" + scheduleStop.PathingAllowance + ")";
            }
            if (scheduleStop.PerformanceAllowance) {
                this.peAllowance = "<" + scheduleStop.PerformanceAllowance + ">";
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
        public plannedArrival: KnockoutObservable<string> = ko.observable();
        public actualArrival: KnockoutObservable<string> = ko.observable();
        public arrivalDelay: KnockoutObservable<number> = ko.observable();
        public arrivalDelayCss: KnockoutComputed<string>;
        public plannedDeparture: KnockoutObservable<string> = ko.observable();
        public actualDeparture: KnockoutObservable<string> = ko.observable();
        public departureDelay: KnockoutObservable<number> = ko.observable();
        public departureDelayCss: KnockoutComputed<string>;
        public line: KnockoutObservable<string> = ko.observable();
        public platform: KnockoutObservable<string> = ko.observable();
        public nextLocation: KnockoutObservable<string> = ko.observable();
        public nextAt: KnockoutObservable<string> = ko.observable();
        public berthUpdate = false;
        public offRoute: KnockoutObservable<boolean> = ko.observable(false);
        public notes: KnockoutObservable<string> = ko.observable();
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

        private updateArrival(plannedArrival: string, actualArrival: string, line: string, platform: string, offRoute: boolean, nextStanox: string, expectedAtNextStanox: string, tiplocs: IStationTiploc[]) {
            this.arrivalSet = true;
            this.plannedArrival(DateTimeFormats.formatDateTimeString(plannedArrival));
            this.actualArrival(DateTimeFormats.formatDateTimeString(actualArrival));

            var planned = moment(plannedArrival);
            var actual = moment(actualArrival);
            if (planned && planned.isValid() && actual && actual.isValid()) {
                this.arrivalDelay(actual.diff(planned, 'minutes'));
                this.timeStamp = actual.unix();
            } else {
                this.arrivalDelay(0);
                this.timeStamp = 0;
            }

            this.updateCommon(line, platform, offRoute, nextStanox, expectedAtNextStanox, tiplocs);
        }

        private updateDeparture(plannedDeparture: string, actualDeparture: string, line: string, platform: string, offRoute: boolean, nextStanox: string, expectedAtNextStanox: string, tiplocs: IStationTiploc[]) {
            this.departureSet = true;
            this.plannedDeparture(DateTimeFormats.formatDateTimeString(plannedDeparture));
            this.actualDeparture(DateTimeFormats.formatDateTimeString(actualDeparture));

            var planned = moment(plannedDeparture);
            var actual = moment(actualDeparture);
            if (planned && planned.isValid() && actual && actual.isValid()) {
                this.departureDelay(actual.diff(planned, 'minutes'));
                if (this.timeStamp == 0)
                    this.timeStamp = actual.unix();
            } else {
                this.departureDelay(0);
                this.timeStamp = 0;
            }

            this.updateCommon(line, platform, offRoute, nextStanox, expectedAtNextStanox, tiplocs);
        }

        private updateCommon(line: string, platform: string, offRoute: boolean, nextStanox: string, expectedAtNextStanox: string, tiplocs: IStationTiploc[]) {
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

    export class TrainAssociation {
        public title: string;
        public trainId: string;
        public location: string;
        private date: Moment;

        constructor(association: IAssociation, currentTrainUid: string, currentDate: string) {
            switch (association.AssociationType) {
                case AssociationType.NextTrain:
                    if (association.MainTrainUid === currentTrainUid)
                        this.title = "Forms next train: ";
                    else
                        this.title = "Formed of train: ";
                    break;
                case AssociationType.Join:
                    this.title = "Joins with Train: ";
                    break;
                case AssociationType.Split:
                    this.title = "Splits from Train: ";
                    break;
            }
            if (association.MainTrainUid === currentTrainUid) {
                this.trainId = association.AssocTrainUid;
            } else {
                this.trainId = association.MainTrainUid;
            }
            this.date = moment(currentDate);
            switch (association.DateType) {
                case AssociationDateType.NextDay:
                    this.date = this.date.add({ days: 1 });
                    break;
                case AssociationDateType.PreviousDay:
                    this.date = this.date.subtract({ days: 1 });
                    break;
            }
            this.location = association.Location.Description.toLowerCase();
        }

        get url(): string {
            return this.trainId + "/" + this.date.format(DateTimeFormats.dateUrlFormat);
        }

        get javascript(): string {
            return this.trainId + "/" + this.date.format(DateTimeFormats.dateQueryFormat);
        }

    }

    export class TrainDetails {

        public id: KnockoutObservable<string> = ko.observable();
        public trainUid: KnockoutObservable<string> = ko.observable();
        public scheduleDate: KnockoutObservable<string> = ko.observable();
        public liveId: KnockoutObservable<string> = ko.observable();
        public activated: KnockoutObservable<string> = ko.observable();

        public toc: KnockoutObservable<string> = ko.observable();
        public type: KnockoutObservable<string> = ko.observable();
        public from: KnockoutObservable<string> = ko.observable();
        public to: KnockoutObservable<string> = ko.observable();
        public runs: KnockoutObservable<string> = ko.observable();

        public powerType: KnockoutObservable<string> = ko.observable();
        public categoryType: KnockoutObservable<string> = ko.observable();
        public speed: KnockoutObservable<number> = ko.observable();

        public cancellation: KnockoutObservable<string> = ko.observable();
        public changeOfOrigin: KnockoutObservable<string> = ko.observable();
        public reinstatement: KnockoutObservable<string> = ko.observable();

        public otherSites: ExternalSiteBase[] = [];

        public associations: KnockoutObservableArray<TrainAssociation> = ko.observableArray();

        constructor() {
            this.otherSites.push(new RealtimeTrainsExternalSite());
            this.otherSites.push(new OpenTrainTimesExternalSite());
            this.otherSites.push(new TrainsImExternalSite());
            this.otherSites.push(new RaildarExternalSite());
        }

        reset() {
            this.updateFromTrainMovement(null, null);
            this.associations.removeAll();
        }

        updateFromTrainMovement(train: ITrainMovementResult, tiplocs: IStationTiploc[], date?: string) {
            if (train && train.Actual) {
                this.id(train.Actual.HeadCode);
                this.liveId(train.Actual.TrainId);
                this.activated(moment(train.Actual.Activated).format(DateTimeFormats.dateTimeFormat));
                this.scheduleDate(moment(train.Actual.OriginDepartTimestamp).format(DateTimeFormats.dateQueryFormat));
            } else {
                this.id(null);
                this.liveId(null);
                this.activated(null);
                this.scheduleDate(null);
            }

            if (train && train.Schedule) {
                if (!this.id()) {
                    this.id(train.Schedule.Headcode);
                }
                this.trainUid(train.Schedule.TrainUid);
                if (train.Schedule.AtocCode) {
                    this.toc(train.Schedule.AtocCode.Name);
                } else {
                    this.toc("Unknown");
                }
                this.type(this.getStpIndicator(train.Schedule.STPIndicatorId));
                this.from(moment(train.Schedule.StartDate).format(DateTimeFormats.dateFormat));
                this.to(moment(train.Schedule.EndDate).format(DateTimeFormats.dateFormat));
                this.runs(this.getDaysRun(train.Schedule.Schedule));

                if (train.Schedule.PowerTypeId) {
                    var power = PowerTypeLookup.getPowerType(train.Schedule.PowerTypeId);
                    if (power) {
                        this.powerType(power.Description);
                    } else {
                        this.powerType(null);
                    }
                } else {
                    this.powerType(null);
                }
                if (train.Schedule.CategoryTypeId) {
                    var category = CategoryTypeLookup.getCategoryType(train.Schedule.CategoryTypeId);
                    if (category) {
                        this.categoryType(category.Description);
                    } else {
                        this.categoryType(null);
                    }
                } else {
                    this.categoryType(null);
                }
                if (train.Schedule.Speed && train.Schedule.Speed > 0) {
                    this.speed(train.Schedule.Speed);
                } else {
                    this.speed(null);
                }
            } else {
                this.trainUid(null);
                this.toc(null);
                this.type(null);
                this.from(null);
                this.to(null);
                this.runs(null);

                this.powerType(null);
                this.categoryType(null);
                this.speed(null);
            }
            if (!this.scheduleDate() && date) {
                this.scheduleDate(moment(date).format(DateTimeFormats.dateQueryFormat));
            }

            for (var i = 0; i < this.otherSites.length; i++) {
                this.otherSites[i].updateFromTrainMovement(train, date);
            }

            if (train && train.Cancellations.length > 0) {
                var can = train.Cancellations[0];
                var canTxt = can.Type;
                if (can.CancelledAtStanoxCode) {
                    var canTiploc = StationTiploc.findStationTiploc(can.CancelledAtStanoxCode, tiplocs);
                    canTxt += " @ " + canTiploc.Description.toLowerCase();
                }
                canTxt += " @ " + moment(can.CancelledTimestamp).format(DateTimeFormats.timeFormat)
                    + " - Reason: ";
                if (can.Description) {
                    canTxt += can.Description;
                }
                canTxt += " (" + can.ReasonCode + ")";
                this.cancellation(canTxt);
            } else {
                this.cancellation(null);
            }

            if (train && train.Reinstatements.length > 0) {
                var reinstate = train.Reinstatements[0];
                var reinstateTiploc = StationTiploc.findStationTiploc(reinstate.NewOriginStanoxCode, tiplocs);
                this.reinstatement(reinstateTiploc.Description + " @ "
                    + moment(reinstate.PlannedDepartureTime).format(DateTimeFormats.timeFormat));
            } else {
                this.reinstatement(null);
            }

            if (train && train.ChangeOfOrigins.length > 0) {
                var coo = train.ChangeOfOrigins[0];
                var cooTiploc = StationTiploc.findStationTiploc(coo.NewOriginStanoxCode, tiplocs);
                var originText = cooTiploc.Description
                    + " @ " + moment(coo.NewDepartureTime).format(DateTimeFormats.timeFormat);
                if (coo.ReasonCode) {
                    originText += " (" + coo.ReasonCode + ": " + coo.Description + ")";
                }
                this.changeOfOrigin(originText);
            } else {
                this.changeOfOrigin(null);
            }
        }

        private getStpIndicator(stpIndicatorId: number) {
            switch (stpIndicatorId) {
                case 1:
                    return "Cancellation";
                case 2:
                    return "STP";
                case 3:
                    return "Overlay";
                case 4:
                    return "Permanent";
            }

            return null;
        }

        private getDaysRun(schedule: ISchedule) {
            var days: string[] = [];
            if (schedule.Monday) {
                days.push("M");
            }
            if (schedule.Tuesday) {
                days.push("Tu");
            }
            if (schedule.Wednesday) {
                days.push("W");
            }
            if (schedule.Thursday) {
                days.push("Th");
            }
            if (schedule.Friday) {
                days.push("F");
            }
            if (schedule.Saturday) {
                days.push("Sa");
            }
            if (schedule.Sunday) {
                days.push("Su");
            }
            return days.join(",");
        }
    }

    export class ExternalSiteBase {

        public text: string;
        public url: KnockoutObservable<string> = ko.observable();

        constructor(name: string) {
            this.text = name;
        }

        updateFromTrainMovement(train: ITrainMovementResult, date?: string) {

        }
    }

    export class RealtimeTrainsExternalSite extends ExternalSiteBase {

        private static baseUrl: string = "http://www.realtimetrains.co.uk/train/";

        constructor() {
            super("Realtime Trains");
        }

        updateFromTrainMovement(train: ITrainMovementResult, date?: string) {
            if (train && train.Schedule && (train.Actual || date)) {
                var uid = train.Schedule.TrainUid;
                if (uid.length == 5) {
                    uid = "O" + uid;
                }
                this.url(RealtimeTrainsExternalSite.baseUrl + uid + "/" +
                    moment(train.Actual ? train.Actual.OriginDepartTimestamp : date).format("YYYY/MM/DD"));
            } else {
                this.url(null);
            }
        }

    }

    export class OpenTrainTimesExternalSite extends ExternalSiteBase {

        private static baseUrl: string = "http://www.opentraintimes.com/schedule/";

        constructor() {
            super("Open Train Times");
        }

        updateFromTrainMovement(train: ITrainMovementResult, date?: string) {
            if (train && train.Schedule && (train.Actual || date)) {
                this.url(OpenTrainTimesExternalSite.baseUrl + train.Schedule.TrainUid + "/" +
                    moment(train.Actual ? train.Actual.OriginDepartTimestamp : date).format("YYYY-MM-DD"));
            } else {
                this.url(null);
            }
        }

    }

    export class TrainsImExternalSite extends ExternalSiteBase {

        private static baseUrl: string = "http://www.trains.im/schedule/";

        constructor() {
            super("trains.im");
        }

        updateFromTrainMovement(train: ITrainMovementResult, date?: string) {
            if (train && train.Schedule && (train.Actual || date)) {
                this.url(TrainsImExternalSite.baseUrl + train.Schedule.TrainUid + "/" +
                    moment(train.Actual ? train.Actual.OriginDepartTimestamp : date).format("YYYY/MM/DD"));
            } else {
                this.url(null);
            }
        }

    }

    export class RaildarExternalSite extends ExternalSiteBase {

        private static baseUrl: string = "http://raildar.co.uk/timetable/train/trainid/";

        constructor() {
            super("Raildar");
        }

        updateFromTrainMovement(train: ITrainMovementResult, date?: string) {
            if (train && train.Schedule) {
                this.url(RaildarExternalSite.baseUrl + train.Schedule.TrainUid);
            } else {
                this.url(null);
            }
        }

    }

    export class TrainTitleViewModel {

        public id = ko.observable();
        public from = ko.observable();
        public to = ko.observable();
        public start = ko.observable();
        public end = ko.observable();
        public fullTitle: KnockoutComputed<string>;

        constructor() {
            var self = this;
            this.fullTitle = ko.computed(function () {
                if (TrainNotifier.Common.page && TrainNotifier.Common.page.pageTitle &&
                    self.id() && self.from() && self.to() && self.start() && self.end()) {
                    document.title = self.id() + " "
                        + self.from()
                        + " to " + self.to() + " "
                        + self.start() + " - " + self.end()
                        + " - " + TrainNotifier.Common.page.pageTitle;
                }
                return "";
            }).extend({ throttle: 500 });
        }
    }

}