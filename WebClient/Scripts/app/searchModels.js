var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var TrainNotifier;
(function (TrainNotifier) {
    /// <reference path="global.ts" />
    /// <reference path="../typings/moment/moment.d.ts" />
    /// <reference path="../typings/knockout/knockout.d.ts" />
    /// <reference path="webApi.ts" />
    (function (Search) {
        var SearchMode = (function () {
            function SearchMode() {
            }
            SearchMode.terminate = 1;
            SearchMode.origin = 2;
            SearchMode.callingAt = 3;
            SearchMode.between = 4;
            return SearchMode;
        })();
        Search.SearchMode = SearchMode;
    })(TrainNotifier.Search || (TrainNotifier.Search = {}));
    var Search = TrainNotifier.Search;
})(TrainNotifier || (TrainNotifier = {}));

var TrainNotifier;
(function (TrainNotifier) {
    (function (KnockoutModels) {
        (function (Search) {
            // base class
            var TrainMovement = (function () {
                function TrainMovement(trainMovement, tiplocs, queryStartDate) {
                    this.operatorCode = "NA";
                    this.operatorName = "Unknown";
                    this.title = null;
                    this.cancel = ko.observable(false);
                    this.cancelEnRoute = null;
                    this.reinstate = ko.observable(false);
                    this.changeOfOrigin = ko.observable(false);
                    this.changeOfOriginStation = null;
                    this.departureDate = "";
                    this.fromStation = "";
                    this.fromStationCss = null;
                    this.toStation = "";
                    this.toStationCss = null;
                    this.category = ko.observable("cat-na");
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
                        this.departureDate = moment(trainMovement.Actual.OriginDepartTimestamp).format(TrainNotifier.DateTimeFormats.dateUrlFormat);
                    } else {
                        this.departureDate = queryStartDate.format(TrainNotifier.DateTimeFormats.dateUrlFormat);
                    }

                    if (trainMovement.Cancellations.length > 0) {
                        var cancellation = trainMovement.Cancellations[0];
                        var cancelTiploc = TrainNotifier.StationTiploc.findStationTiploc(cancellation.CancelledAtStanoxCode, tiplocs);
                        if (cancelTiploc) {
                            var titleText = "Cancelled " + cancellation.Type + " at " + cancelTiploc.Description + " at " + moment(cancellation.CancelledTimestamp).format(TrainNotifier.DateTimeFormats.timeFormat) + " (" + cancellation.Description + ")";

                            if (cancellation.Type == TrainNotifier.CancellationCodes.EnRoute) {
                                this.cancelEnRoute = cancelTiploc.Description.toLowerCase();
                            }

                            this.cancel(true);
                            this.title = titleText;
                        }
                    }

                    if (trainMovement.ChangeOfOrigins.length > 0) {
                        var coo = trainMovement.ChangeOfOrigins[0];
                        var cooTiploc = TrainNotifier.StationTiploc.findStationTiploc(coo.NewOriginStanoxCode, tiplocs);
                        if (cooTiploc) {
                            var titleText = "Will start from " + cooTiploc.Description.toLocaleLowerCase() + " at " + moment(coo.NewDepartureTime).format(TrainNotifier.DateTimeFormats.timeFormat) + " (" + coo.Description + ")";

                            this.changeOfOriginStation = cooTiploc.Description.toLocaleLowerCase();
                            this.changeOfOrigin(true);
                            this.title = titleText;
                        }
                    }
                    if (trainMovement.Reinstatements.length > 0) {
                        var reinstatement = trainMovement.Reinstatements[0];
                        var reinstateTiploc = TrainNotifier.StationTiploc.findStationTiploc(reinstatement.NewOriginStanoxCode, tiplocs);
                        if (reinstateTiploc) {
                            var titleText = "Reinstated at " + reinstateTiploc.Description.toLowerCase() + " at " + moment(reinstatement.PlannedDepartureTime).format(TrainNotifier.DateTimeFormats.timeFormat);

                            this.reinstate(true);
                            this.title = titleText;

                            this.cancel(false);
                            this.cancelEnRoute = null;
                        }
                    }

                    if (trainMovement.Schedule.CategoryTypeId) {
                        var cat = TrainNotifier.CategoryTypeLookup.getCategoryType(trainMovement.Schedule.CategoryTypeId);
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
                TrainMovement.matchesTiploc = function (stanoxCode, tiplocs) {
                    return tiplocs.some(function (at) {
                        return at.Stanox == stanoxCode;
                    });
                };
                return TrainMovement;
            })();
            Search.TrainMovement = TrainMovement;

            var StartingAtTrainMovement = (function (_super) {
                __extends(StartingAtTrainMovement, _super);
                function StartingAtTrainMovement(trainMovement, tiplocs, queryStartDate) {
                    _super.call(this, trainMovement, tiplocs, queryStartDate);
                    this.fromPlatform = "";
                    this.publicDeparture = "";
                    this.wttDeparture = "";
                    this.actualDeparture = "";
                    this.toPlatform = "";
                    this.publicArrival = "";
                    this.wttArrival = "";
                    this.actualArrival = "";

                    var toStop;
                    if (trainMovement.Schedule.Stops.length > 0) {
                        var fromStop = trainMovement.Schedule.Stops[0];
                        var fromTiploc = TrainNotifier.StationTiploc.findStationTiploc(fromStop.TiplocStanoxCode, tiplocs);
                        if (fromTiploc) {
                            this.fromStation = "Starts here";
                            this.fromStationCss = "starts";
                        }

                        // TODO: compare to actual
                        this.fromPlatform = fromStop.Platform;
                        this.publicDeparture = TrainNotifier.DateTimeFormats.formatTimeString(fromStop.PublicDeparture);
                        this.wttDeparture = TrainNotifier.DateTimeFormats.formatTimeString(fromStop.Departure);

                        toStop = trainMovement.Schedule.Stops[trainMovement.Schedule.Stops.length - 1];
                        var toTiploc = TrainNotifier.StationTiploc.findStationTiploc(toStop.TiplocStanoxCode, tiplocs);
                        if (toTiploc) {
                            this.toStation = toTiploc.Description ? toTiploc.Description.toLowerCase() : toTiploc.Tiploc;
                        }

                        // TODO: compare to actual
                        this.toPlatform = toStop.Platform;
                        this.publicArrival = TrainNotifier.DateTimeFormats.formatTimeString(toStop.PublicArrival);
                        this.wttArrival = TrainNotifier.DateTimeFormats.formatTimeString(toStop.Arrival);
                    }

                    if (trainMovement.Actual && trainMovement.Actual.Stops.length > 0) {
                        // TODO: check is actual location and is departure
                        var fromActual = trainMovement.Actual.Stops[0];
                        this.actualDeparture = TrainNotifier.DateTimeFormats.formatDateTimeString(fromActual.ActualTimestamp);

                        if (toStop) {
                            var lastActual = trainMovement.Actual.Stops[trainMovement.Actual.Stops.length - 1];
                            if (lastActual.ScheduleStopNumber == toStop.StopNumber && lastActual.EventType == TrainNotifier.EventType.Arrival && lastActual.TiplocStanoxCode == toStop.TiplocStanoxCode) {
                                this.actualArrival = TrainNotifier.DateTimeFormats.formatDateTimeString(lastActual.ActualTimestamp);
                            }
                        }
                    }
                    // TODO: what about can/reinstate/c.o.origin
                }
                return StartingAtTrainMovement;
            })(TrainMovement);
            Search.StartingAtTrainMovement = StartingAtTrainMovement;

            var TerminatingAtTrainMovement = (function (_super) {
                __extends(TerminatingAtTrainMovement, _super);
                function TerminatingAtTrainMovement(trainMovement, tiplocs, queryStartDate) {
                    _super.call(this, trainMovement, tiplocs, queryStartDate);
                    this.fromPlatform = "";
                    this.publicDeparture = "";
                    this.wttDeparture = "";
                    this.actualDeparture = "";
                    this.toPlatform = "";
                    this.publicArrival = "";
                    this.wttArrival = "";
                    this.actualArrival = "";

                    var toStop;
                    if (trainMovement.Schedule.Stops.length > 0) {
                        var fromStop = trainMovement.Schedule.Stops[0];
                        var fromTiploc = TrainNotifier.StationTiploc.findStationTiploc(fromStop.TiplocStanoxCode, tiplocs);
                        if (fromTiploc) {
                            this.fromStation = fromTiploc.Description ? fromTiploc.Description.toLowerCase() : fromTiploc.Tiploc;
                        }

                        // TODO: compare to actual
                        this.fromPlatform = fromStop.Platform;
                        this.publicDeparture = TrainNotifier.DateTimeFormats.formatTimeString(fromStop.PublicDeparture);
                        this.wttDeparture = TrainNotifier.DateTimeFormats.formatTimeString(fromStop.Departure);

                        toStop = trainMovement.Schedule.Stops[trainMovement.Schedule.Stops.length - 1];
                        var toTiploc = TrainNotifier.StationTiploc.findStationTiploc(toStop.TiplocStanoxCode, tiplocs);
                        if (toTiploc) {
                            this.toStation = "Terminates here";
                            this.toStationCss = "terminates";
                        }

                        // TODO: compare to actual
                        this.toPlatform = toStop.Platform;
                        this.publicArrival = TrainNotifier.DateTimeFormats.formatTimeString(toStop.PublicArrival);
                        this.wttArrival = TrainNotifier.DateTimeFormats.formatTimeString(toStop.Arrival);
                    }

                    if (trainMovement.Actual && trainMovement.Actual.Stops.length > 0) {
                        // TODO: check is actual location and is departure
                        var fromActual = trainMovement.Actual.Stops[0];
                        this.actualDeparture = TrainNotifier.DateTimeFormats.formatDateTimeString(fromActual.ActualTimestamp);

                        if (toStop) {
                            var lastActual = trainMovement.Actual.Stops[trainMovement.Actual.Stops.length - 1];
                            if (lastActual.ScheduleStopNumber == toStop.StopNumber && lastActual.EventType == TrainNotifier.EventType.Arrival && lastActual.TiplocStanoxCode == toStop.TiplocStanoxCode) {
                                this.actualArrival = TrainNotifier.DateTimeFormats.formatDateTimeString(lastActual.ActualTimestamp);
                            }
                        }
                    }
                }
                return TerminatingAtTrainMovement;
            })(TrainMovement);
            Search.TerminatingAtTrainMovement = TerminatingAtTrainMovement;

            var CallingAtTrainMovement = (function (_super) {
                __extends(CallingAtTrainMovement, _super);
                function CallingAtTrainMovement(trainMovement, atTiploc, tiplocs, queryStartDate) {
                    _super.call(this, trainMovement, tiplocs, queryStartDate);
                    this.atPlatform = "";
                    this.atPublicDeparture = "";
                    this.atWttDeparture = "";
                    this.atActualDeparture = "";
                    this.atPublicArrival = "";
                    this.atWttArrival = "";
                    this.atActualArrival = "";
                    this.pass = ko.observable(false);

                    var atTiplocs = tiplocs.filter(function (t) {
                        return t.CRS == atTiploc.CRS;
                    });

                    var atStop;
                    if (trainMovement.Schedule.Stops.length > 0) {
                        var fromStop = trainMovement.Schedule.Stops[0];
                        var fromTiploc = TrainNotifier.StationTiploc.findStationTiploc(fromStop.TiplocStanoxCode, tiplocs);
                        if (fromTiploc) {
                            if (fromTiploc.Stanox == atTiploc.Stanox) {
                                this.fromStation = "Starts here";
                                this.fromStationCss = "starts";
                            } else {
                                this.fromStation = fromTiploc.Description ? fromTiploc.Description.toLowerCase() : fromTiploc.Tiploc;
                            }
                        }

                        // find the at stop
                        var atStops = trainMovement.Schedule.Stops.filter(function (element) {
                            return TrainMovement.matchesTiploc(element.TiplocStanoxCode, atTiplocs);
                        });

                        if (atStops.length > 0) {
                            // take first, if it calls at more than 1 we cant handle that at the moment
                            atStop = atStops[0];
                            this.atPlatform = atStop.Platform;

                            if (atStop.Pass) {
                                this.pass(true);
                                this.atPublicDeparture = "Pass";
                                this.atWttDeparture = TrainNotifier.DateTimeFormats.formatTimeString(atStop.Pass);
                                this.atPublicArrival = "Pass";
                                this.atWttArrival = TrainNotifier.DateTimeFormats.formatTimeString(atStop.Pass);
                            } else {
                                this.atPublicDeparture = TrainNotifier.DateTimeFormats.formatTimeString(atStop.PublicDeparture);
                                this.atWttDeparture = TrainNotifier.DateTimeFormats.formatTimeString(atStop.Departure);
                                this.atPublicArrival = TrainNotifier.DateTimeFormats.formatTimeString(atStop.PublicArrival);
                                this.atWttArrival = TrainNotifier.DateTimeFormats.formatTimeString(atStop.Arrival);
                            }
                        }

                        var toStop = trainMovement.Schedule.Stops[trainMovement.Schedule.Stops.length - 1];
                        var toTiploc = TrainNotifier.StationTiploc.findStationTiploc(toStop.TiplocStanoxCode, tiplocs);
                        if (toTiploc) {
                            if (toTiploc.Stanox == atTiploc.Stanox) {
                                this.toStation = "Terminates here";
                                this.toStationCss = "terminates";
                            } else {
                                this.toStation = toTiploc.Description ? toTiploc.Description.toLowerCase() : toTiploc.Tiploc;
                            }
                        }
                    }

                    if (trainMovement.Actual && trainMovement.Actual.Stops.length > 0 && atStop) {
                        // find the at stops
                        var atActualStops = trainMovement.Actual.Stops.filter(function (element) {
                            return TrainMovement.matchesTiploc(element.TiplocStanoxCode, atTiplocs) && element.ScheduleStopNumber == atStop.StopNumber;
                        });

                        if (atActualStops.length > 0) {
                            for (var i = 0; i < atActualStops.length; i++) {
                                switch (atActualStops[i].EventType) {
                                    case TrainNotifier.EventType.Arrival:
                                        this.atActualArrival = TrainNotifier.DateTimeFormats.formatDateTimeString(atActualStops[i].ActualTimestamp);
                                        break;
                                    case TrainNotifier.EventType.Departure:
                                        this.atActualDeparture = TrainNotifier.DateTimeFormats.formatDateTimeString(atActualStops[i].ActualTimestamp);
                                        break;
                                }
                            }
                        }
                    }

                    var self = this;
                    this.computedCss = ko.computed(function () {
                        var css = [];
                        if (self.pass()) {
                            css.push("pass");
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
                return CallingAtTrainMovement;
            })(TrainMovement);
            Search.CallingAtTrainMovement = CallingAtTrainMovement;

            var CallingBetweenResults = (function () {
                function CallingBetweenResults() {
                    this.fromStation = ko.observable();
                    this.fromShortStation = ko.observable();
                    this.toStation = ko.observable();
                    this.toShortStation = ko.observable();
                    this.results = ko.observableArray();
                }
                return CallingBetweenResults;
            })();
            Search.CallingBetweenResults = CallingBetweenResults;

            var CallingBetweenTrainMovement = (function (_super) {
                __extends(CallingBetweenTrainMovement, _super);
                function CallingBetweenTrainMovement(trainMovement, fromTiploc, toTiploc, tiplocs, queryStartDate) {
                    _super.call(this, trainMovement, tiplocs, queryStartDate);
                    this.fromPlatform = "";
                    this.publicDeparture = "";
                    this.wttDeparture = "";
                    this.actualDeparture = "";
                    this.toPlatform = "";
                    this.publicArrival = "";
                    this.wttArrival = "";
                    this.actualArrival = "";
                    this.passDeparture = false;
                    this.passArrival = false;

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

                    var fromTiplocStop;
                    var toTiplocStop;
                    var fromTiplocs = tiplocs.filter(function (t) {
                        return t.CRS == fromTiploc.CRS;
                    });
                    var toTiplocs = tiplocs.filter(function (t) {
                        return t.CRS == toTiploc.CRS;
                    });
                    if (trainMovement.Schedule && trainMovement.Schedule.Stops) {
                        var fromStops = trainMovement.Schedule.Stops.filter(function (currentStop) {
                            return TrainMovement.matchesTiploc(currentStop.TiplocStanoxCode, fromTiplocs);
                        });
                        if (fromStops.length > 0) {
                            fromTiplocStop = fromStops[0];
                        }
                        var toStops = trainMovement.Schedule.Stops.filter(function (currentStop) {
                            return TrainMovement.matchesTiploc(currentStop.TiplocStanoxCode, toTiplocs);
                        });
                        if (toStops.length > 0) {
                            toTiplocStop = toStops[0];
                        }
                    }
                    if (fromTiplocStop) {
                        this.publicDeparture = TrainNotifier.DateTimeFormats.formatTimeString(fromTiplocStop.PublicDeparture);
                        this.wttDeparture = TrainNotifier.DateTimeFormats.formatTimeString(fromTiplocStop.Departure);

                        // TODO: compare to actual
                        this.fromPlatform = fromTiplocStop.Platform;

                        if (trainMovement.Actual && trainMovement.Actual.Stops.length > 0) {
                            // find the from stops
                            var fromDepartStops = trainMovement.Actual.Stops.filter(function (element) {
                                return TrainMovement.matchesTiploc(element.TiplocStanoxCode, fromTiplocs) && element.ScheduleStopNumber == fromTiplocStop.StopNumber && element.EventType == TrainNotifier.EventType.Departure;
                            });

                            if (fromDepartStops.length > 0) {
                                this.actualDeparture = TrainNotifier.DateTimeFormats.formatDateTimeString(fromDepartStops[0].ActualTimestamp);
                            }
                        }
                        this.passDeparture = fromTiplocStop.Pass != null;
                        if (this.passDeparture) {
                            this.wttDeparture = TrainNotifier.DateTimeFormats.formatTimeString(fromTiplocStop.Pass);
                        }
                    }
                    if (toTiplocStop) {
                        this.publicArrival = TrainNotifier.DateTimeFormats.formatTimeString(toTiplocStop.PublicArrival);
                        this.wttArrival = TrainNotifier.DateTimeFormats.formatTimeString(toTiplocStop.Arrival);

                        // TODO: compare to actual
                        this.toPlatform = toTiplocStop.Platform;

                        if (trainMovement.Actual && trainMovement.Actual.Stops.length > 0) {
                            // find the from stops
                            var toArriveStops = trainMovement.Actual.Stops.filter(function (element) {
                                return TrainMovement.matchesTiploc(element.TiplocStanoxCode, toTiplocs) && element.ScheduleStopNumber == toTiplocStop.StopNumber && element.EventType == TrainNotifier.EventType.Arrival;
                            });

                            if (toArriveStops.length > 0) {
                                this.actualArrival = TrainNotifier.DateTimeFormats.formatDateTimeString(toArriveStops[0].ActualTimestamp);
                            }
                        }
                        this.passArrival = toTiplocStop.Pass != null;
                        if (this.passArrival) {
                            this.wttArrival = TrainNotifier.DateTimeFormats.formatTimeString(toTiplocStop.Pass);
                        }
                    }
                }
                return CallingBetweenTrainMovement;
            })(TrainMovement);
            Search.CallingBetweenTrainMovement = CallingBetweenTrainMovement;
        })(KnockoutModels.Search || (KnockoutModels.Search = {}));
        var Search = KnockoutModels.Search;
    })(TrainNotifier.KnockoutModels || (TrainNotifier.KnockoutModels = {}));
    var KnockoutModels = TrainNotifier.KnockoutModels;
})(TrainNotifier || (TrainNotifier = {}));
