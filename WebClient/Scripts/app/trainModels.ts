/// <reference path="websockets.ts" />
/// <reference path="global.ts" />
/// <reference path="../typings/moment/moment.d.ts" />
/// <reference path="../typings/knockout/knockout.d.ts" />
/// <reference path="webApi.ts" />

module TrainNotifier.KnockoutModels.Train {

    export class ScheduleStop {
        public location: string;
        public locationCRS: string;
        public atLink: string;
        private locationStanox: string;
        public wttArrive: string = null;
        public publicArrive: string = null;
        public actualArrival: KnockoutComputed<string>;
        private estimateArrival = ko.observable<string>(null);
        public arrivalDelay: KnockoutComputed<number>;
        public arrivalDelayCss: KnockoutComputed<string>;
        public arrivalCss: KnockoutComputed<string>;
        public wttDepart: string = null;
        public publicDepart: string = null;
        public actualDeparture: KnockoutComputed<string>;
        private estimateDeparture = ko.observable<string>(null);
        public departureDelay: KnockoutComputed<number>;
        public departureDelayCss: KnockoutComputed<string>;
        public departureCss: KnockoutComputed<string>;
        public line: string = null;
        public platform: string = null;
        public actualPlatform = ko.observable<string>();
        public eAllowance: string = null;
        public paAllowance: string = null;
        public peAllowance: string = null;
        public pass: string = null;
        public cancel = ko.observable<boolean>(false);
        public stopNumber: number;
        public changePlatform = ko.observable<boolean>(false);

        private isEstimateArrival = ko.observable<boolean>(true);
        private isEstimateDeparture = ko.observable<boolean>(true);
        private associateLiveStop = ko.observable<LiveStopBase>();

        private previousStop: ScheduleStop = null;

        private delay: Duration;

        constructor(scheduleStop: IRunningScheduleTrainStop, tiplocs: IStationTiploc[]) {
            var tiploc = StationTiploc.findStationTiploc(scheduleStop.TiplocStanoxCode, tiplocs);
            this.stopNumber = scheduleStop.StopNumber;
            this.location = tiploc.Description ? tiploc.Description.toLowerCase() : tiploc.Tiploc;
            this.locationCRS = tiploc.CRS && tiploc.CRS.length > 0 ? tiploc.CRS : null;
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
            this.actualPlatform(scheduleStop.Platform);
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
                var arrival: string = null;
                if (self.associateLiveStop())
                    arrival = self.associateLiveStop().actualArrival();

                return arrival ? arrival : self.estimateArrival() ? self.estimateArrival() : self.publicArrive;
            });
            this.arrivalDelay = ko.computed(function () {
                if (self.associateLiveStop())
                    return self.associateLiveStop().arrivalDelay();

                return null;
            });
            this.arrivalDelayCss = ko.computed(function () {
                return self.getDelayCss(self.arrivalDelay());
            }).extend({ throttle: 500 });
            this.arrivalCss = ko.computed(function () {
                return self.getDelayCss(self.arrivalDelay(), self.isEstimateArrival() ? "estimate " : "non-estimate ", "");
            }).extend({ throttle: 500 });

            this.actualDeparture = ko.computed(function () {
                var departure: string = null;
                if (self.associateLiveStop())
                    departure = self.associateLiveStop().actualDeparture();

                return departure ? departure : self.estimateDeparture() ? self.estimateDeparture() : self.publicDepart ? self.publicDepart : self.pass ? self.pass : null;
            });
            this.departureDelay = ko.computed(function () {
                if (self.associateLiveStop())
                    return self.associateLiveStop().departureDelay();

                return null;
            });
            this.departureDelayCss = ko.computed(function () {
                return self.getDelayCss(self.departureDelay());
            }).extend({ throttle: 500 });
            this.departureCss = ko.computed(function () {
                return self.getDelayCss(self.departureDelay(), self.isEstimateDeparture() ? "estimate " : "non-estimate ", "");
            }).extend({ throttle: 500 });
        }

        private getDelayCss(value: Number, prefix = "", defaultValue: string = "hidden") {
            if (value < 0)
                return prefix + "alert-info";
            if (value > 10)
                return prefix + "alert-important";
            if (value > 0)
                return prefix + "alert-warning";

            return prefix + defaultValue;
        }

        associateWithLiveStop(liveStop: LiveStopBase) {
            this.associateLiveStop(liveStop);
            this.isEstimateArrival(liveStop.actualArrival() == null);
            this.isEstimateDeparture(liveStop.actualDeparture() == null);
            if ((liveStop.platform() != null) && (liveStop.platform() != this.platform)) {
                this.actualPlatform(liveStop.platform());
                this.changePlatform(true);
            }
        }

        validateAssociation(liveStop: LiveStopBase) {
            if (this.associateLiveStop())
                return false;

            return liveStop.locationStanox === this.locationStanox;
        }

        associateWithPreviousStop(previousStop: ScheduleStop) {
            this.previousStop = previousStop;
        }

        estimateFromPreviousStop() {
            if (this.previousStop == null)
                return;

            var previousExpected = this.previousStop.publicDepart ? this.previousStop.publicDepart : this.previousStop.pass;
            var previousActual = this.previousStop.actualDeparture();
            if (!previousExpected || !previousActual)
                return;

            var previousExpectedDuration = moment.duration(previousExpected);
            var delay = this.previousStop.delay ? this.previousStop.delay : moment.duration(previousActual).subtract(previousExpectedDuration);
            if (delay.asSeconds() <= 0)
                return;

            this.delay = delay;

            if (this.wttArrive && (!this.associateLiveStop() || !this.associateLiveStop().actualArrival())) {
                var arr = moment.duration(this.wttArrive);
                var usualDifference = moment.duration(arr).subtract(previousExpectedDuration);
                var est = arr.add(usualDifference);
                this.estimateArrival(est.hours() + ":" + est.minutes());

            }
            if (this.wttDepart && (!this.associateLiveStop() || !this.associateLiveStop().actualDeparture())) {
                var dept = moment.duration(this.wttDepart);
                var usualDifference = moment.duration(dept).subtract(moment.duration(this.wttArrive));
                var est = dept.add(usualDifference);
                this.estimateDeparture(est.hours() + ":" + est.minutes());
            }
            if (this.pass) {
                /*var usualDifference = moment.duration(this.pass).asSeconds() - moment.duration(previousExpected).asSeconds();
                console.log("usual pass diff at " + this.locationCRS + " is " + usualDifference + "s");*/
            }
        }
    }

    export class LiveStopBase {
        public location: string;
        public locationStanox: string;
        public plannedArrival = ko.observable<string>();
        public actualArrival = ko.observable<string>();
        public arrivalDelay = ko.observable<number>();
        public arrivalDelayCss: KnockoutComputed<string>;
        public plannedDeparture = ko.observable<string>();
        public actualDeparture = ko.observable<string>();
        public departureDelay = ko.observable<number>();
        public departureDelayCss: KnockoutComputed<string>;
        public line = ko.observable<string>();
        public platform = ko.observable<string>();
        public nextLocation = ko.observable<string>();
        public nextAt = ko.observable<string>();
        public berthUpdate = false;
        public offRoute = ko.observable<boolean>(false);
        public notes = ko.observable<string>();
        private departureSet = false;
        private arrivalSet = false;
        private timeStamp: Number = 0;

        constructor(location?: string, tiplocs?: IStationTiploc[]) {
            var self = this;
            this.arrivalDelayCss = ko.computed(function () {
                return LiveStopBase.getDelayCss(self.arrivalDelay());
            });
            this.departureDelayCss = ko.computed(function () {
                return LiveStopBase.getDelayCss(self.departureDelay());
            });

            if (!location || !tiplocs || tiplocs.length == 0)
                return;

            var tiploc = StationTiploc.findStationTiploc(location, tiplocs);
            this.location = tiploc.Description ? tiploc.Description.toLowerCase() : tiploc.Tiploc;
            this.locationStanox = tiploc.Stanox;
        }

        private static getDelayCss(value: Number, defaultValue: string = "hidden") {
            if (value < 0)
                return "alert-info";
            if (value > 10)
                return "alert-important";
            if (value > 0)
                return "alert-warning";

            return defaultValue;
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
            this.platform(TrainNotifier.Common.trimNullableString(this.platform() || platform));

            this.offRoute(this.offRoute() || offRoute);
            if (nextStanox) {
                var nextAtTiploc = StationTiploc.findStationTiploc(nextStanox, tiplocs);
                if (nextAtTiploc) {
                    this.nextLocation(nextAtTiploc.Description ? nextAtTiploc.Description.toLowerCase() : nextAtTiploc.Tiploc);
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
            this.location = association.Location.Description ? association.Location.Description.toLowerCase() : association.Location.Tiploc;
        }

        get url(): string {
            return this.trainId + "/" + this.date.format(DateTimeFormats.dateUrlFormat);
        }

        get javascript(): string {
            return this.trainId + "/" + this.date.format(DateTimeFormats.dateQueryFormat);
        }

    }

    export class TrainDetails {

        public id = ko.observable<string>();
        public trainUid = ko.observable<string>();
        public scheduleDate = ko.observable<string>();
        public liveId = ko.observable<string>();
        public activated = ko.observable<string>();

        public toc = ko.observable<string>();
        public type = ko.observable<string>();
        public from = ko.observable<string>();
        public to = ko.observable<string>();
        public runs = ko.observable<string>();

        public powerType = ko.observable<string>();
        public categoryType = ko.observable<string>();
        public speed = ko.observable<number>();

        public cancellation = ko.observable<string>();
        public changeOfOrigin = ko.observable<string>();
        public reinstatement = ko.observable<string>();

        public otherSites: IExternalSite[] = [];

        public associations = ko.observableArray<TrainAssociation>();

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
                this.type(TrainDetails.getStpIndicator(train.Schedule.STPIndicatorId));
                this.from(moment(train.Schedule.StartDate).format(DateTimeFormats.dateFormat));
                this.to(moment(train.Schedule.EndDate).format(DateTimeFormats.dateFormat));
                this.runs(TrainDetails.getDaysRun(train.Schedule.Schedule));

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
                    canTxt += " @ " + canTiploc.Description ? canTiploc.Description.toLowerCase() : canTiploc.Tiploc;
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

        private static getStpIndicator(stpIndicatorId: number) {
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

        private static getDaysRun(schedule: ISchedule) {
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

    export class ExternalSiteBase implements IExternalSite {

        public text: string;
        public url = ko.observable<string>();

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

        public id = ko.observable<string>();
        public from = ko.observable<string>();
        public to = ko.observable<string>();
        public start = ko.observable<string>();
        public end = ko.observable<string>();
        public fullTitle: KnockoutSubscribable<string>;

        constructor() {
            var self = this;
            this.fullTitle = ko.computed(function () {
                if (self.id() && self.from() && self.to() && self.start() && self.end()) {
                    document.title = self.id() + " "
                    + self.from()
                    + " to " + self.to() + " "
                    + self.start() + " - " + self.end()
                    + " - ";// + TrainNotifier.Common.page.pageTitle;
                }
                return "";
            }).extend({ throttle: 500 });
        }

        clear(clearId: boolean = true) {
            if (clearId) {
                this.id(null);
            }
            this.from(null);
            this.to(null);
            this.start(null);
            this.end(null);
        }
    }

}

interface IExternalSite {
    text: string;
    url: KnockoutObservable<string>;

    updateFromTrainMovement(train: ITrainMovementResult, date?: string);
}