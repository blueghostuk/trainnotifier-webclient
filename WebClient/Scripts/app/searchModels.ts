/// <reference path="global.ts" />
/// <reference path="../typings/moment/moment.d.ts" />
/// <reference path="../typings/knockout/knockout.d.ts" />
/// <reference path="webApi.ts" />

module TrainNotifier.Search {

    export class SearchMode {
        public static terminate = 1;
        public static origin = 2;
        public static callingAt = 3;
        public static between = 4;
    }
}

module TrainNotifier.KnockoutModels.Search {

    // base class
    export class TrainMovement {
        public trainId: string;
        public headCode: string;
        public operatorCode: string = "NA";
        public operatorName: string = "Unknown";
        public title: string = null;
        public cancel: KnockoutObservable<boolean> = ko.observable(false);
        public cancelEnRoute: string = null;
        public reinstate: KnockoutObservable<boolean> = ko.observable(false);
        public changeOfOrigin: KnockoutObservable<boolean> = ko.observable(false);
        public changeOfOriginStation: string = null;

        public departureDate: string = "";

        public fromStation: string = "";
        public fromStationCss: string = null;

        public toStation: string = "";
        public toStationCss: string = null;

        public computedCss: KnockoutComputed<string>;

        public category: KnockoutObservable<string> = ko.observable("cat-na");

        constructor(trainMovement: ITrainMovementResult, tiplocs: IStationTiploc[], queryStartDate: Moment) {
            var self = this;

            this.trainId = trainMovement.Schedule.TrainUid;
            if (trainMovement.Schedule.AtocCode) {
                this.operatorCode = trainMovement.Schedule.AtocCode.Code;
                this.operatorName = trainMovement.Schedule.AtocCode.Name;
            }
            if (trainMovement.Actual) {
                this.headCode = trainMovement.Actual.HeadCode;
            } else {
                // if no actual we can only show the uid
                this.headCode = trainMovement.Schedule.Headcode || trainMovement.Schedule.TrainUid;
            }
            if (trainMovement.Actual && trainMovement.Actual.OriginDepartTimestamp) {
                this.departureDate = moment(trainMovement.Actual.OriginDepartTimestamp)
                    .format(DateTimeFormats.dateUrlFormat);
            } else {
                this.departureDate = queryStartDate.format(DateTimeFormats.dateUrlFormat);
            }

            if (trainMovement.Cancellations.length > 0) {
                var cancellation = trainMovement.Cancellations[0];
                var cancelTiploc = StationTiploc.findStationTiploc(cancellation.CancelledAtStanoxCode, tiplocs);
                if (cancelTiploc) {
                    var titleText = "Cancelled " + cancellation.Type
                        + " at " + cancelTiploc.Description
                        + " at " + moment(cancellation.CancelledTimestamp).format(DateTimeFormats.timeFormat)
                        + " (" + cancellation.Description + ")";

                    if (cancellation.Type == CancellationCodes.EnRoute) {
                        this.cancelEnRoute = cancelTiploc.Description.toLowerCase();
                    }

                    this.cancel(true);
                    this.title = titleText;
                }
            }

            if (trainMovement.ChangeOfOrigins.length > 0) {
                var coo = trainMovement.ChangeOfOrigins[0];
                var cooTiploc = StationTiploc.findStationTiploc(coo.NewOriginStanoxCode, tiplocs);
                if (cooTiploc) {
                    var titleText = "Will start from " + cooTiploc.Description.toLocaleLowerCase()
                        + " at " + moment(coo.NewDepartureTime).format(DateTimeFormats.timeFormat)
                        + " (" + coo.Description + ")";

                    this.changeOfOriginStation = cooTiploc.Description.toLocaleLowerCase();
                    this.changeOfOrigin(true);
                    this.title = titleText;
                }
            }
            if (trainMovement.Reinstatements.length > 0) {
                var reinstatement = trainMovement.Reinstatements[0];
                var reinstateTiploc = StationTiploc.findStationTiploc(reinstatement.NewOriginStanoxCode, tiplocs);
                if (reinstateTiploc) {
                    var titleText = "Reinstated at " + reinstateTiploc.Description.toLowerCase()
                        + " at " + moment(reinstatement.PlannedDepartureTime).format(DateTimeFormats.timeFormat);

                    this.reinstate(true);
                    this.title = titleText;

                    this.cancel(false);
                    this.cancelEnRoute = null;
                }
            }

            if (trainMovement.Schedule.CategoryTypeId) {
                var cat = CategoryTypeLookup.getCategoryType(trainMovement.Schedule.CategoryTypeId);
                if (cat) {
                    this.category(cat.Code);
                }
            }

            this.computedCss = ko.computed(function () {
                var css = [];
                if (self.cancel()) {
                    css.push("error");
                }
                if (self.changeOfOrigin()) {
                    css.push("info");
                }
                if (self.reinstate()) {
                    css.push("reinstatement");
                }
                if (self.operatorCode) {
                    css.push("toc-" + self.operatorCode);
                }
                if (self.category()) {
                    css.push("cat-" + self.category());
                }                

                return css.join(" ");
            });
        }

        public static matchesTiploc(stanoxCode: string, tiplocs: IStationTiploc[]) {
            return tiplocs.some(function (at) {
                return at.Stanox == stanoxCode;
            });
        }
    }

    export class StartingAtTrainMovement extends TrainMovement {

        public fromPlatform: string = "";
        public publicDeparture: string = "";
        public wttDeparture: string = "";
        public actualDeparture: string = "";

        public toPlatform: string = "";
        public publicArrival: string = "";
        public wttArrival: string = "";
        public actualArrival: string = "";

        constructor(trainMovement: ITrainMovementResult, tiplocs: IStationTiploc[], queryStartDate: Moment) {
            super(trainMovement, tiplocs, queryStartDate);

            var toStop: IRunningScheduleTrainStop;
            if (trainMovement.Schedule.Stops.length > 0) {
                var fromStop = trainMovement.Schedule.Stops[0];
                var fromTiploc = StationTiploc.findStationTiploc(fromStop.TiplocStanoxCode, tiplocs);
                if (fromTiploc) {
                    this.fromStation = "Starts here";
                    this.fromStationCss = "starts";
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
            // TODO: what about can/reinstate/c.o.origin
        }
    }

    export class TerminatingAtTrainMovement extends TrainMovement {

        public fromPlatform: string = "";
        public publicDeparture: string = "";
        public wttDeparture: string = "";
        public actualDeparture: string = "";

        public toPlatform: string = "";
        public publicArrival: string = "";
        public wttArrival: string = "";
        public actualArrival: string = "";

        constructor(trainMovement: ITrainMovementResult, tiplocs: IStationTiploc[], queryStartDate: Moment) {
            super(trainMovement, tiplocs, queryStartDate);

            var toStop: IRunningScheduleTrainStop;
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
                    this.toStation = "Terminates here";
                    this.toStationCss = "terminates";
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

    export class CallingAtTrainMovement extends TrainMovement {

        public atPlatform: string = "";
        public atPublicDeparture: string = "";
        public atWttDeparture: string = "";
        public atActualDeparture: string = "";

        public atPublicArrival: string = "";
        public atWttArrival: string = "";
        public atActualArrival: string = "";

        public pass: KnockoutObservable < boolean> = ko.observable(false);

        constructor(trainMovement: ITrainMovementResult, atTiploc: IStationTiploc, tiplocs: IStationTiploc[], queryStartDate: Moment) {
            super(trainMovement, tiplocs, queryStartDate);

            var atTiplocs = tiplocs.filter(function (t) {
                return t.CRS == atTiploc.CRS;
            });

            var atStop: IRunningScheduleTrainStop;
            if (trainMovement.Schedule.Stops.length > 0) {
                var fromStop = trainMovement.Schedule.Stops[0];
                var fromTiploc = StationTiploc.findStationTiploc(fromStop.TiplocStanoxCode, tiplocs);
                if (fromTiploc) {
                    if (fromTiploc.Stanox == atTiploc.Stanox) {
                        this.fromStation = "Starts here";
                        this.fromStationCss = "starts";
                    } else {
                        this.fromStation = fromTiploc.Description.toLowerCase();
                    }
                }

                // find the at stop
                var atStops: IRunningScheduleTrainStop[] = trainMovement.Schedule.Stops.filter(
                    function (element: IRunningScheduleTrainStop) {
                        return TrainMovement.matchesTiploc(element.TiplocStanoxCode, atTiplocs);
                    });

                if (atStops.length > 0) {
                    // take first, if it calls at more than 1 we cant handle that at the moment
                    atStop = atStops[0];
                    this.atPlatform = atStop.Platform;

                    if (atStop.Pass) {
                        this.pass(true);
                        this.atPublicDeparture = "Pass";
                        this.atWttDeparture = DateTimeFormats.formatTimeString(atStop.Pass);
                        this.atPublicArrival = "Pass";
                        this.atWttArrival = DateTimeFormats.formatTimeString(atStop.Pass);
                    } else {
                        this.atPublicDeparture = DateTimeFormats.formatTimeString(atStop.PublicDeparture);
                        this.atWttDeparture = DateTimeFormats.formatTimeString(atStop.Departure);
                        this.atPublicArrival = DateTimeFormats.formatTimeString(atStop.PublicArrival);
                        this.atWttArrival = DateTimeFormats.formatTimeString(atStop.Arrival);
                    }
                }

                var toStop = trainMovement.Schedule.Stops[trainMovement.Schedule.Stops.length - 1];
                var toTiploc = StationTiploc.findStationTiploc(toStop.TiplocStanoxCode, tiplocs);
                if (toTiploc) {
                    if (toTiploc.Stanox == atTiploc.Stanox) {
                        this.toStation = "Terminates here";
                        this.toStationCss = "terminates";
                    } else {
                        this.toStation = toTiploc.Description.toLowerCase();
                    }
                }
            }

            if (trainMovement.Actual && trainMovement.Actual.Stops.length > 0 && atStop) {
                // find the at stops
                var atActualStops: IRunningTrainActualStop[] = trainMovement.Actual.Stops.filter(
                    function (element: IRunningTrainActualStop) {
                        return TrainMovement.matchesTiploc(element.TiplocStanoxCode, atTiplocs) &&
                            element.ScheduleStopNumber == atStop.StopNumber;
                    });

                if (atActualStops.length > 0) {
                    for (var i = 0; i < atActualStops.length; i++) {
                        switch (atActualStops[i].EventType) {
                            case EventType.Arrival:
                                this.atActualArrival = DateTimeFormats.formatDateTimeString(atActualStops[i].ActualTimestamp);
                                break;
                            case EventType.Departure:
                                this.atActualDeparture = DateTimeFormats.formatDateTimeString(atActualStops[i].ActualTimestamp);
                                break;
                        }
                    }
                }
            }

            var self = this;
            this.computedCss = ko.computed(function () {
                var css = [];
                if (self.pass()) {
                    css.push("pass")
                }
                if (self.cancel()) {
                    css.push("error");
                }
                if (self.changeOfOrigin()) {
                    css.push("info");
                }
                if (self.reinstate()) {
                    css.push("reinstatement");
                }
                if (self.operatorCode) {
                    css.push("toc-" + self.operatorCode);
                }
                if (self.category()) {
                    css.push("cat-" + self.category());
                }    

                return css.join(" ");
            });
        }
    }

    export class CallingBetweenResults {
        public fromStation = ko.observable();
        public fromShortStation = ko.observable();
        public toStation = ko.observable();
        public toShortStation = ko.observable();
        public results = ko.observableArray();
    }

    export class CallingBetweenTrainMovement extends TrainMovement {

        public fromPlatform: string = "";
        public publicDeparture: string = "";
        public wttDeparture: string = "";
        public actualDeparture: string = "";

        public toPlatform: string = "";
        public publicArrival: string = "";
        public wttArrival: string = "";
        public actualArrival: string = "";

        public passDeparture = false;
        public passArrival = false;

        constructor(trainMovement: ITrainMovementResult, fromTiploc: IStationTiploc, toTiploc: IStationTiploc, tiplocs: IStationTiploc[], queryStartDate: Moment) {
            super(trainMovement, tiplocs, queryStartDate);

            if (trainMovement.Schedule.Stops.length > 0) {
                var originStop = trainMovement.Schedule.Stops[0];
                var originTiploc = TrainNotifier.StationTiploc.findStationTiploc(originStop.TiplocStanoxCode, tiplocs);
                if (originTiploc) {
                    this.fromStation = originTiploc.Description.toLowerCase();
                }

                var destStop = trainMovement.Schedule.Stops[trainMovement.Schedule.Stops.length - 1];
                var destTiploc = TrainNotifier.StationTiploc.findStationTiploc(destStop.TiplocStanoxCode, tiplocs);
                if (destTiploc) {
                    this.toStation = destTiploc.Description.toLowerCase();
                }
            }

            var fromTiplocStop: IRunningScheduleTrainStop;
            var toTiplocStop: IRunningScheduleTrainStop;
            var fromTiplocs = tiplocs.filter(function (t) {
                return t.CRS == fromTiploc.CRS;
            });
            var toTiplocs = tiplocs.filter(function (t) {
                return t.CRS == toTiploc.CRS;
            });
            if (trainMovement.Schedule && trainMovement.Schedule.Stops) {
                var fromStops = trainMovement.Schedule.Stops.filter(function (currentStop: IRunningScheduleTrainStop) {
                    return TrainMovement.matchesTiploc(currentStop.TiplocStanoxCode, fromTiplocs);
                });
                if (fromStops.length > 0) {
                    fromTiplocStop = fromStops[0];
                }
                var toStops = trainMovement.Schedule.Stops.filter(function (currentStop: IRunningScheduleTrainStop) {
                    return TrainMovement.matchesTiploc(currentStop.TiplocStanoxCode, toTiplocs);
                });
                if (toStops.length > 0) {
                    toTiplocStop = toStops[0];
                }
            }
            if (fromTiplocStop) {
                this.publicDeparture = DateTimeFormats.formatTimeString(fromTiplocStop.PublicDeparture);
                this.wttDeparture = DateTimeFormats.formatTimeString(fromTiplocStop.Departure);
                // TODO: compare to actual 
                this.fromPlatform = fromTiplocStop.Platform;

                if (trainMovement.Actual && trainMovement.Actual.Stops.length > 0) {
                    // find the from stops
                    var fromDepartStops: IRunningTrainActualStop[] = trainMovement.Actual.Stops.filter(
                        function (element: IRunningTrainActualStop) {
                            return TrainMovement.matchesTiploc(element.TiplocStanoxCode, fromTiplocs)
                                && element.ScheduleStopNumber == fromTiplocStop.StopNumber
                                && element.EventType == EventType.Departure;
                        });

                    if (fromDepartStops.length > 0) {
                        this.actualDeparture = DateTimeFormats.formatDateTimeString(fromDepartStops[0].ActualTimestamp);
                    }
                }
                this.passDeparture = fromTiplocStop.Pass != null;
                if (this.passDeparture) {
                    this.wttDeparture = DateTimeFormats.formatTimeString(fromTiplocStop.Pass);
                }
            }
            if (toTiplocStop) {
                this.publicArrival = DateTimeFormats.formatTimeString(toTiplocStop.PublicArrival);
                this.wttArrival = DateTimeFormats.formatTimeString(toTiplocStop.Arrival);
                // TODO: compare to actual 
                this.toPlatform = toTiplocStop.Platform;

                if (trainMovement.Actual && trainMovement.Actual.Stops.length > 0) {
                    // find the from stops
                    var toArriveStops: IRunningTrainActualStop[] = trainMovement.Actual.Stops.filter(
                        function (element: IRunningTrainActualStop) {
                            return TrainMovement.matchesTiploc(element.TiplocStanoxCode, toTiplocs)
                                && element.ScheduleStopNumber == toTiplocStop.StopNumber
                                && element.EventType == EventType.Arrival;
                        });

                    if (toArriveStops.length > 0) {
                        this.actualArrival = DateTimeFormats.formatDateTimeString(toArriveStops[0].ActualTimestamp);
                    }
                }
                this.passArrival = toTiplocStop.Pass != null;
                if (this.passArrival) {
                    this.wttArrival = DateTimeFormats.formatTimeString(toTiplocStop.Pass);
                }
            }
        }
    }
}