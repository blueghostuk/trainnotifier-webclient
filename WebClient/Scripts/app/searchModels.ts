/// <reference path="../typings/moment/moment.d.ts" />
/// <reference path="../typings/knockout/knockout.d.ts" />
/// <reference path="global.ts" />
/// <reference path="webApi.ts" />

module TrainNotifier.Search {

    export enum SearchMode {
        terminate = 1,
        origin = 2,
        callingAt = 3,
        between = 4
    }
}

module TrainNotifier.KnockoutModels.Search {

    export class TitleViewModel {
        public from = ko.observable<string>();
        public link = ko.observable<string>();
        public title = ko.observable<string>();
        public to = ko.observable<string>();
        public DateRange = ko.observable<string>();
        public Text = ko.observable<string>();

        setTitle(title: string) {
            this.Text(title);
            if (TrainNotifier.Common.page && TrainNotifier.Common.page.pageTitle) {
                document.title = title + " - " + TrainNotifier.Common.page.pageTitle;
            }
        }
    }

    // base class
    export class TrainMovement {
        public trainId: string;
        public headCode: string;
        public operatorCode: string = "NA";
        public operatorName: string = "Unknown";
        public title: string = null;
        public cancel = false;
        public cancelEnRoute: string = null;
        public reinstate = false;
        public changeOfOrigin = false;
        public changeOfOriginStation: string = null;

        public departureDate: string = "";

        public fromStation: string = "";
        public fromStationCss: string = null;

        public toStation: string = "";
        public toStationCss: string = null;

        public computedCss: string;

        public category = "cat-na";

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

                    this.cancel = true;
                    this.title = titleText;
                }
            }

            if (trainMovement.Schedule.STPIndicatorId == TrainNotifier.STPIndicatorValue.Cancellation) {
                this.cancel = true;
                this.title = "Cancelled via schedule";
            }

            if (trainMovement.ChangeOfOrigins.length > 0) {
                var coo = trainMovement.ChangeOfOrigins[0];
                var cooTiploc = StationTiploc.findStationTiploc(coo.NewOriginStanoxCode, tiplocs);
                if (cooTiploc) {
                    var titleText = "Will start from " + cooTiploc.Description.toLocaleLowerCase()
                        + " at " + moment(coo.NewDepartureTime).format(DateTimeFormats.timeFormat)
                        + " (" + coo.Description + ")";

                    this.changeOfOriginStation = cooTiploc.Description.toLocaleLowerCase();
                    this.changeOfOrigin = true;
                    this.title = titleText;
                }
            }
            if (trainMovement.Reinstatements.length > 0) {
                var reinstatement = trainMovement.Reinstatements[0];
                var reinstateTiploc = StationTiploc.findStationTiploc(reinstatement.NewOriginStanoxCode, tiplocs);
                if (reinstateTiploc) {
                    var titleText = "Reinstated at " + reinstateTiploc.Description.toLowerCase()
                        + " at " + moment(reinstatement.PlannedDepartureTime).format(DateTimeFormats.timeFormat);

                    this.reinstate = true;
                    this.title = titleText;

                    this.cancel = false;
                    this.cancelEnRoute = null;
                }
            }

            if (trainMovement.Schedule.CategoryTypeId) {
                var cat = CategoryTypeLookup.getCategoryType(trainMovement.Schedule.CategoryTypeId);
                if (cat) {
                    this.category = cat.Code;
                }
            }

            var css = [];
            if (this.cancel) {
                css.push("cancel");
            }
            if (this.changeOfOrigin) {
                css.push("info");
            }
            if (this.reinstate) {
                css.push("reinstatement");
            }
            if (this.operatorCode) {
                css.push("toc-" + self.operatorCode);
            }
            if (this.category) {
                css.push("cat-" + self.category);
            }
            if (!trainMovement.Actual || !trainMovement.Actual.Activated) {
                css.push("unactivated");
            }

            this.computedCss = css.join(" ");
        }

        public static matchesTiploc(stanoxCode: string, tiplocs: IStationTiploc[]) {
            return tiplocs.some(function (at) {
                return at.Stanox == stanoxCode;
            });
        }
    }

    export class StartingAtTrainMovement extends TrainMovement {

        public fromPlatform: string = null;
        public publicDeparture: string = null;
        public wttDeparture: string = null;
        public actualDeparture: string = null;
        public actualDepartureEstimate = true;
        public fromPlatformEstimate = true;

        public toPlatform: string = null;
        public publicArrival: string = null;
        public wttArrival: string = null;
        public actualArrival: string = null;
        public actualArrivalEstimate = true;
        public toPlatformEstimate = true;

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
                this.actualDeparture = DateTimeFormats.formatTimeString(fromStop.PublicDeparture);

                toStop = trainMovement.Schedule.Stops[trainMovement.Schedule.Stops.length - 1];
                var toTiploc = StationTiploc.findStationTiploc(toStop.TiplocStanoxCode, tiplocs);
                if (toTiploc) {
                    this.toStation = toTiploc.Description ? toTiploc.Description.toLowerCase() : toTiploc.Tiploc;
                }
                // TODO: compare to actual 
                this.toPlatform = toStop.Platform;
                this.publicArrival = DateTimeFormats.formatTimeString(toStop.PublicArrival);
                this.wttArrival = DateTimeFormats.formatTimeString(toStop.Arrival);
                this.actualArrival = DateTimeFormats.formatTimeString(toStop.PublicArrival);
            }

            if (trainMovement.Actual && trainMovement.Actual.Stops.length > 0) {
                var fromActual = trainMovement.Actual.Stops.filter(function (value: IRunningTrainActualStop) {
                    return value.EventType == TrainNotifier.EventType.Departure && value.ScheduleStopNumber == 0;
                });
                if (fromActual != null && fromActual.length == 1) {
                    this.actualDeparture = DateTimeFormats.formatDateTimeString(fromActual[0].ActualTimestamp, TrainNotifier.DateTimeFormats.timeFormat);
                    this.fromPlatform = fromActual[0].Platform;
                    this.actualDepartureEstimate = false;
                    this.fromPlatformEstimate = false;
                }

                // TODO: check is actual
                var lastActual = trainMovement.Actual.Stops[trainMovement.Actual.Stops.length - 1];
                if (lastActual.ScheduleStopNumber == toStop.StopNumber &&
                    lastActual.EventType == EventType.Arrival &&
                    lastActual.TiplocStanoxCode == toStop.TiplocStanoxCode) {
                    this.actualArrival = DateTimeFormats.formatDateTimeString(lastActual.ActualTimestamp, TrainNotifier.DateTimeFormats.timeFormat);
                    this.toPlatform = lastActual.Platform;
                    this.actualArrivalEstimate = false;
                    this.toPlatformEstimate = false;
                } else {
                    // TODO: estimate actual
                    var precedingStops = trainMovement.Actual.Stops.filter(
                        function (element) {
                            return element.ScheduleStopNumber < toStop.StopNumber;
                        });
                    if (precedingStops.length > 0) {
                        var currentDelay: number = 0;
                        for (var i = 0; i < precedingStops.length; i++) {
                            var precedingStop = precedingStops[i];
                            var actual = moment(precedingStop.ActualTimestamp)
                            var planned = moment(precedingStop.PlannedTimestamp);
                            if (actual.isAfter(planned)) {
                                currentDelay = actual.diff(planned, 'minutes', true);
                            } else {
                                currentDelay = 0;
                            }
                        }
                        this.actualArrival = TrainNotifier.DateTimeFormats.formatTimeDuration(moment.duration(toStop.Arrival).add(moment.duration(currentDelay, 'minutes')));
                    }
                }
            }
            // TODO: what about can/reinstate/c.o.origin
        }
    }

    export class TerminatingAtTrainMovement extends TrainMovement {

        public fromPlatform: string = null;
        public publicDeparture: string = null;
        public wttDeparture: string = null;
        public actualDeparture: string = null;
        public actualDepartureEstimate = true;
        public fromPlatformEstimate = true;

        public toPlatform: string = null;
        public publicArrival: string = null;
        public wttArrival: string = null;
        public actualArrival: string = null;
        public actualArrivalEstimate = true;
        public toPlatformEstimate = true;

        constructor(trainMovement: ITrainMovementResult, tiplocs: IStationTiploc[], queryStartDate: Moment) {
            super(trainMovement, tiplocs, queryStartDate);

            var toStop: IRunningScheduleTrainStop;
            if (trainMovement.Schedule.Stops.length > 0) {
                var fromStop = trainMovement.Schedule.Stops[0];
                var fromTiploc = StationTiploc.findStationTiploc(fromStop.TiplocStanoxCode, tiplocs);
                if (fromTiploc) {
                    this.fromStation = fromTiploc.Description ? fromTiploc.Description.toLowerCase() : fromTiploc.Tiploc;
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
                var fromActual = trainMovement.Actual.Stops.filter(function (value: IRunningTrainActualStop) {
                    return value.EventType == TrainNotifier.EventType.Departure && value.ScheduleStopNumber == 0;
                });
                if (fromActual != null && fromActual.length == 1) {
                    this.actualDeparture = DateTimeFormats.formatDateTimeString(fromActual[0].ActualTimestamp, TrainNotifier.DateTimeFormats.timeFormat);
                    this.fromPlatform = fromActual[0].Platform;
                    this.actualDepartureEstimate = false;
                    this.fromPlatformEstimate = false;
                }

                // TODO: check is actual
                if (toStop) {
                    var lastActual = trainMovement.Actual.Stops[trainMovement.Actual.Stops.length - 1];
                    if (lastActual.ScheduleStopNumber == toStop.StopNumber &&
                        lastActual.EventType == EventType.Arrival &&
                        lastActual.TiplocStanoxCode == toStop.TiplocStanoxCode) {
                        this.actualArrival = DateTimeFormats.formatDateTimeString(lastActual.ActualTimestamp, TrainNotifier.DateTimeFormats.timeFormat);
                        this.toPlatform = lastActual.Platform;
                        this.actualArrivalEstimate = false;
                        this.toPlatformEstimate = false;
                    }
                }
            }
        }
    }

    export class CallingAtTrainMovement extends TrainMovement {

        public atPlatform: string = null;
        public atPublicDeparture: string = null;
        public atWttDeparture: string = null;
        public atActualDeparture: string = null;
        public atActualDepartureEstimate = true;
        private departure: Duration;

        public atPublicArrival: string = null;
        public atWttArrival: string = null;
        public atActualArrival: string = null;
        public atActualArrivalEstimate = true;
        private arrival: Duration;

        public atPlatformEstimate = true;

        public pass = false;

        constructor(trainMovement: ITrainMovementResult, atTiplocs: IStationTiploc[], tiplocs: IStationTiploc[], queryStartDate: Moment) {
            super(trainMovement, tiplocs, queryStartDate);

            var atStop: IRunningScheduleTrainStop;
            if (trainMovement.Schedule.Stops.length > 0) {
                var fromStop = trainMovement.Schedule.Stops[0];
                var fromTiploc = StationTiploc.findStationTiploc(fromStop.TiplocStanoxCode, tiplocs);
                if (fromTiploc) {
                    var startsAt = StationTiploc.stationTiplocMatches(fromTiploc, atTiplocs);
                    if (startsAt) {
                        this.fromStation = "Starts here";
                        this.fromStationCss = "starts";
                    } else {
                        this.fromStation = fromTiploc.Description ? fromTiploc.Description.toLowerCase() : fromTiploc.Tiploc;
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
                        this.pass = true;
                        this.atPublicDeparture = "Pass";
                        this.atWttDeparture = DateTimeFormats.formatTimeString(atStop.Pass);
                        this.departure = moment.duration(atStop.Pass);

                        this.atPublicArrival = "Pass";
                        this.atWttArrival = DateTimeFormats.formatTimeString(atStop.Pass);
                        this.arrival = moment.duration(atStop.Pass);
                    } else {
                        this.atPublicDeparture = DateTimeFormats.formatTimeString(atStop.PublicDeparture);
                        this.atWttDeparture = DateTimeFormats.formatTimeString(atStop.Departure);
                        if (atStop.PublicDeparture)
                            this.departure = moment.duration(atStop.PublicDeparture);

                        this.atPublicArrival = DateTimeFormats.formatTimeString(atStop.PublicArrival);
                        this.atWttArrival = DateTimeFormats.formatTimeString(atStop.Arrival);
                        if (atStop.PublicArrival)
                            this.arrival = moment.duration(atStop.PublicArrival);
                    }
                }

                var toStop = trainMovement.Schedule.Stops[trainMovement.Schedule.Stops.length - 1];
                var toTiploc = StationTiploc.findStationTiploc(toStop.TiplocStanoxCode, tiplocs);
                if (toTiploc) {
                    var terminatesAt = StationTiploc.stationTiplocMatches(toTiploc, atTiplocs);
                    if (terminatesAt) {
                        this.toStation = "Terminates here";
                        this.toStationCss = "terminates";
                    } else {
                        this.toStation = toTiploc.Description ? toTiploc.Description.toLowerCase() : toTiploc.Tiploc;
                    }
                }
            }

            if (trainMovement.Actual && trainMovement.Actual.Stops.length > 0 && atStop) {
                // find the at stops
                var atActualStops: IRunningTrainActualStop[] = trainMovement.Actual.Stops.filter(
                    function (element: IRunningTrainActualStop) {
                        return TrainMovement.matchesTiploc(element.TiplocStanoxCode, atTiplocs) &&
                            element.ScheduleStopNumber == atStop.StopNumber &&
                            (element.ScheduleStopNumber != 0 || element.ScheduleStopNumber == 0 && element.Source == TrainNotifier.LiveTrainStopSource.TD);
                    });

                if (atActualStops.length > 0) {
                    for (var i = 0; i < atActualStops.length; i++) {
                        switch (atActualStops[i].EventType) {
                            case EventType.Arrival:
                                this.atActualArrival = DateTimeFormats.formatDateTimeString(atActualStops[i].ActualTimestamp, TrainNotifier.DateTimeFormats.timeFormat);
                                this.atActualArrivalEstimate = false;
                                this.atPlatform = TrainNotifier.Common.coalesce([atActualStops[i].Platform, this.atPlatform]);
                                break;
                            case EventType.Departure:
                                this.atActualDeparture = DateTimeFormats.formatDateTimeString(atActualStops[i].ActualTimestamp, TrainNotifier.DateTimeFormats.timeFormat);
                                this.atActualDepartureEstimate = false;
                                this.atPlatform = TrainNotifier.Common.coalesce([atActualStops[i].Platform, this.atPlatform]);
                                break;
                        }
                        this.atPlatformEstimate = false;
                    }
                } else {
                    var precedingStops = trainMovement.Actual.Stops.filter(
                        function (element) {
                            return element.ScheduleStopNumber < atStop.StopNumber;
                        });
                    if (precedingStops.length > 0) {
                        var currentDelay: number = 0;
                        for (var i = 0; i < precedingStops.length; i++) {
                            var precedingStop = precedingStops[i];
                            var actual = moment(precedingStop.ActualTimestamp)
                            var planned = moment(precedingStop.PlannedTimestamp);
                            if (actual.isAfter(planned)) {
                                currentDelay = actual.diff(planned, 'minutes', true);
                            } else {
                                currentDelay = 0;
                            }
                        }
                        if (this.arrival) {
                            this.atActualArrival = DateTimeFormats.formatTimeDuration(this.arrival.add(moment.duration(currentDelay, 'minutes')));
                        }
                        if (this.departure) {
                            this.atActualDeparture = DateTimeFormats.formatTimeDuration(this.departure.add(moment.duration(currentDelay, 'minutes')));
                        }
                    }
                }
            } else {
                this.atActualArrival = DateTimeFormats.formatTimeDuration(this.arrival);
                this.atActualDeparture = DateTimeFormats.formatTimeDuration(this.departure);
            }

            var css = [];
            if (this.pass) {
                css.push("passing")
                }
            if (this.cancel) {
                css.push("cancel");
            }
            if (this.changeOfOrigin) {
                css.push("info");
            }
            if (this.reinstate) {
                css.push("reinstatement");
            }
            if (this.operatorCode) {
                css.push("toc-" + this.operatorCode);
            }
            if (this.category) {
                css.push("cat-" + this.category);
            }
            if (!trainMovement.Actual || !trainMovement.Actual.Activated) {
                css.push("unactivated");
            }

            this.computedCss = css.join(" ");
        }
    }

    export class CallingBetweenResults {
        public fromStation = ko.observable<string>();
        public fromShortStation = ko.observable<string>();
        public toStation = ko.observable<string>();
        public toShortStation = ko.observable<string>();
        public results = ko.observableArray<CallingBetweenTrainMovement>();
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

        constructor(trainMovement: ITrainMovementResult, fromTiplocs: IStationTiploc[], toTiplocs: IStationTiploc[], tiplocs: IStationTiploc[], queryStartDate: Moment) {
            super(trainMovement, tiplocs, queryStartDate);

            if (trainMovement.Schedule.Stops.length > 0) {
                var originStop = trainMovement.Schedule.Stops[0];
                var originTiploc = TrainNotifier.StationTiploc.findStationTiploc(originStop.TiplocStanoxCode, tiplocs);
                if (originTiploc) {
                    this.fromStation = originTiploc.Description ? originTiploc.Description.toLowerCase() : originTiploc.Tiploc;
                }

                var destStop = trainMovement.Schedule.Stops[trainMovement.Schedule.Stops.length - 1];
                var destTiploc = TrainNotifier.StationTiploc.findStationTiploc(destStop.TiplocStanoxCode, tiplocs);
                if (destTiploc) {
                    this.toStation = destTiploc.Description ? destTiploc.Description.toLowerCase() : destTiploc.Tiploc;
                }
            }

            var fromTiplocStop: IRunningScheduleTrainStop;
            var toTiplocStop: IRunningScheduleTrainStop;
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
                        this.actualDeparture = DateTimeFormats.formatDateTimeString(fromDepartStops[0].ActualTimestamp, TrainNotifier.DateTimeFormats.timeFormat);
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
                        this.actualArrival = DateTimeFormats.formatDateTimeString(toArriveStops[0].ActualTimestamp, TrainNotifier.DateTimeFormats.timeFormat);
                    }
                }
                this.passArrival = toTiplocStop.Pass != null;
                if (this.passArrival) {
                    this.wttArrival = DateTimeFormats.formatTimeString(toTiplocStop.Pass);
                }
            }


            var css = [];
            if (this.cancel) {
                css.push("cancel");
            }
            if (this.changeOfOrigin) {
                css.push("info");
            }
            if (this.reinstate) {
                css.push("reinstatement");
            }
            if (this.operatorCode) {
                css.push("toc-" + this.operatorCode);
            }
            if (this.category) {
                css.push("cat-" + this.category);
            }
            if (this.passArrival || this.passDeparture) {
                css.push("passing");
            }
            if (!trainMovement.Actual || !trainMovement.Actual.Activated) {
                css.push("unactivated");
            }

            this.computedCss = css.join(" ");
        }
    }

    export class NearestTrainMovement extends CallingBetweenTrainMovement {

        public atStation: string = "";

        constructor(trainMovement: ITrainMovementResult, atTiploc: IStationTiploc, tiplocs: IStationTiploc[], queryStartDate: Moment) {
            super(trainMovement, [atTiploc], [atTiploc], tiplocs, queryStartDate);

            this.atStation = atTiploc.Description.toLowerCase();
        }
    }
}