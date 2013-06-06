var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var TrainNotifier;
(function (TrainNotifier) {
    (function (KnockoutModels) {
        var CurrentLocation = (function () {
            function CurrentLocation(location) {
                this.name = ko.observable();
                this.crsCode = ko.observable();
                this.stanox = ko.observable();
                var self = this;
                this.update(location);
                this.url = ko.computed(function () {
                    return self.crsCode() ? self.crsCode() : self.name() ? self.name() : "";
                });
            }
            CurrentLocation.prototype.update = function (location) {
                if(location) {
                    this.name(location.Description);
                    this.crsCode(location.CRS);
                    this.stanox(location.Stanox);
                } else {
                    this.name(null);
                    this.crsCode(null);
                    this.stanox(null);
                }
            };
            return CurrentLocation;
        })();
        KnockoutModels.CurrentLocation = CurrentLocation;        
        var TrainMovement = (function () {
            function TrainMovement(trainMovement, tiplocs) {
                this.operatorCode = "NA";
                this.operatorName = "Unknown";
                this.title = null;
                this.cancel = false;
                this.cancelEnRoute = null;
                this.reinstate = null;
                this.changeOfOrigin = false;
                this.changeOfOriginStation = null;
                this.trainId = trainMovement.Schedule.TrainUid;
                if(trainMovement.Schedule.AtocCode) {
                    this.operatorCode = trainMovement.Schedule.AtocCode.Code;
                    this.operatorName = trainMovement.Schedule.AtocCode.Name;
                }
                if(trainMovement.Actual) {
                    this.headCode = trainMovement.Actual.HeadCode;
                } else {
                    this.headCode = this.trainId;
                }
                if(trainMovement.Cancellations.length > 0) {
                    var cancellation = trainMovement.Cancellations[0];
                    var cancelText = "Cancelled " + cancellation.Type;
                    var cancelValue = "";
                    var cancelTiploc = TrainNotifier.StationTiploc.findStationTiploc(cancellation.CancelledAtStanoxCode, tiplocs);
                    if(cancelTiploc) {
                        cancelText += " at " + cancelTiploc.Description;
                        if(cancellation.Type == TrainNotifier.CancellationCodes.EnRoute) {
                            this.cancelEnRoute = cancelTiploc.Description.toLowerCase();
                        }
                    }
                    cancelText += " at " + moment(cancellation.CancelledTimestamp).format(TrainNotifier.DateTimeFormats.timeFormat);
                    cancelText += " (" + cancellation.Description + ")";
                    this.cancel = true;
                    this.title = cancelText;
                }
                if(trainMovement.ChangeOfOrigins.length > 0) {
                    var coo = trainMovement.ChangeOfOrigins[0];
                    var cooText = "Will start";
                    var cooTiploc = TrainNotifier.StationTiploc.findStationTiploc(coo.NewOriginStanoxCode, tiplocs);
                    if(cooTiploc) {
                        cooText += " from " + cooTiploc.Description.toLocaleLowerCase();
                        this.changeOfOriginStation = cooTiploc.Description.toLocaleLowerCase();
                    }
                    cooText += " at " + moment(coo.NewDepartureTime).format(TrainNotifier.DateTimeFormats.timeFormat);
                    cooText += " (" + coo.Description + ")";
                    this.changeOfOrigin = true;
                    this.title = cooText;
                }
            }
            return TrainMovement;
        })();
        KnockoutModels.TrainMovement = TrainMovement;        
        var StartingAtTrainMovement = (function (_super) {
            __extends(StartingAtTrainMovement, _super);
            function StartingAtTrainMovement(trainMovement, tiplocs) {
                        _super.call(this, trainMovement, tiplocs);
                this.publicDeparture = "";
                this.actualDeparture = "";
                this.publicArrival = "";
                this.actualArrival = "";
                this.departureDate = "";
                var toStop;
                if(trainMovement.Actual && trainMovement.Actual.OriginDepartTimestamp) {
                    this.departureDate = moment(trainMovement.Actual.OriginDepartTimestamp).format(TrainNotifier.DateTimeFormats.dateUrlFormat);
                }
                if(trainMovement.Schedule.Stops.length > 0) {
                    var fromStop = trainMovement.Schedule.Stops[0];
                    var fromTiploc = TrainNotifier.StationTiploc.findStationTiploc(fromStop.TiplocStanoxCode, tiplocs);
                    if(fromTiploc) {
                        this.fromStation = fromTiploc.Description.toLowerCase();
                    }
                    this.fromPlatform = fromStop.Platform;
                    this.publicDeparture = TrainNotifier.DateTimeFormats.formatTimeString(fromStop.PublicDeparture);
                    this.wttDeparture = TrainNotifier.DateTimeFormats.formatTimeString(fromStop.Departure);
                    toStop = trainMovement.Schedule.Stops[trainMovement.Schedule.Stops.length - 1];
                    var toTiploc = TrainNotifier.StationTiploc.findStationTiploc(toStop.TiplocStanoxCode, tiplocs);
                    if(toTiploc) {
                        this.toStation = toTiploc.Description.toLowerCase();
                    }
                    this.toPlatform = toStop.Platform;
                    this.publicArrival = TrainNotifier.DateTimeFormats.formatTimeString(toStop.PublicArrival);
                    this.wttArrival = TrainNotifier.DateTimeFormats.formatTimeString(toStop.Arrival);
                }
                if(trainMovement.Actual && trainMovement.Actual.Stops.length > 0) {
                    var fromActual = trainMovement.Actual.Stops[0];
                    this.actualDeparture = TrainNotifier.DateTimeFormats.formatDateTimeString(fromActual.ActualTimestamp);
                    if(toStop) {
                        var lastActual = trainMovement.Actual.Stops[trainMovement.Actual.Stops.length - 1];
                        if(lastActual.ScheduleStopNumber == toStop.StopNumber && lastActual.EventType == TrainNotifier.EventType.Arrival && lastActual.TiplocStanoxCode == toStop.TiplocStanoxCode) {
                            this.actualArrival = TrainNotifier.DateTimeFormats.formatDateTimeString(lastActual.ActualTimestamp);
                        }
                    }
                }
            }
            return StartingAtTrainMovement;
        })(TrainMovement);
        KnockoutModels.StartingAtTrainMovement = StartingAtTrainMovement;        
        var TerminatingAtTrainMovement = (function (_super) {
            __extends(TerminatingAtTrainMovement, _super);
            function TerminatingAtTrainMovement(trainMovement, tiplocs) {
                        _super.call(this, trainMovement, tiplocs);
                this.publicDeparture = "";
                this.actualDeparture = "";
                this.publicArrival = "";
                this.actualArrival = "";
                this.departureDate = "";
                var toStop;
                if(trainMovement.Actual && trainMovement.Actual.OriginDepartTimestamp) {
                    this.departureDate = moment(trainMovement.Actual.OriginDepartTimestamp).format(TrainNotifier.DateTimeFormats.dateUrlFormat);
                }
                if(trainMovement.Schedule.Stops.length > 0) {
                    var fromStop = trainMovement.Schedule.Stops[0];
                    var fromTiploc = TrainNotifier.StationTiploc.findStationTiploc(fromStop.TiplocStanoxCode, tiplocs);
                    if(fromTiploc) {
                        this.fromStation = fromTiploc.Description.toLowerCase();
                    }
                    this.fromPlatform = fromStop.Platform;
                    this.publicDeparture = TrainNotifier.DateTimeFormats.formatTimeString(fromStop.PublicDeparture);
                    this.wttDeparture = TrainNotifier.DateTimeFormats.formatTimeString(fromStop.Departure);
                    toStop = trainMovement.Schedule.Stops[trainMovement.Schedule.Stops.length - 1];
                    var toTiploc = TrainNotifier.StationTiploc.findStationTiploc(toStop.TiplocStanoxCode, tiplocs);
                    if(toTiploc) {
                        this.toStation = toTiploc.Description.toLowerCase();
                    }
                    this.toPlatform = toStop.Platform;
                    this.publicArrival = TrainNotifier.DateTimeFormats.formatTimeString(toStop.PublicArrival);
                    this.wttArrival = TrainNotifier.DateTimeFormats.formatTimeString(toStop.Arrival);
                }
                if(trainMovement.Actual && trainMovement.Actual.Stops.length > 0) {
                    var fromActual = trainMovement.Actual.Stops[0];
                    this.actualDeparture = TrainNotifier.DateTimeFormats.formatDateTimeString(fromActual.ActualTimestamp);
                    if(toStop) {
                        var lastActual = trainMovement.Actual.Stops[trainMovement.Actual.Stops.length - 1];
                        if(lastActual.ScheduleStopNumber == toStop.StopNumber && lastActual.EventType == TrainNotifier.EventType.Arrival && lastActual.TiplocStanoxCode == toStop.TiplocStanoxCode) {
                            this.actualArrival = TrainNotifier.DateTimeFormats.formatDateTimeString(lastActual.ActualTimestamp);
                        }
                    }
                }
            }
            return TerminatingAtTrainMovement;
        })(TrainMovement);
        KnockoutModels.TerminatingAtTrainMovement = TerminatingAtTrainMovement;        
        var CallingAtTrainMovement = (function (_super) {
            __extends(CallingAtTrainMovement, _super);
            function CallingAtTrainMovement(trainMovement, atTiploc, tiplocs) {
                        _super.call(this, trainMovement, tiplocs);
                this.atPublicDeparture = "";
                this.atActualDeparture = "";
                this.atPublicArrival = "";
                this.atActualArrival = "";
                this.departureDate = "";
                this.pass = false;
                if(trainMovement.Actual && trainMovement.Actual.OriginDepartTimestamp) {
                    this.departureDate = moment(trainMovement.Actual.OriginDepartTimestamp).format(TrainNotifier.DateTimeFormats.dateUrlFormat);
                }
                var atStop;
                if(trainMovement.Schedule.Stops.length > 0) {
                    var fromStop = trainMovement.Schedule.Stops[0];
                    var fromTiploc = TrainNotifier.StationTiploc.findStationTiploc(fromStop.TiplocStanoxCode, tiplocs);
                    if(fromTiploc) {
                        this.fromStation = fromTiploc.Description.toLowerCase();
                    }
                    var atStops = trainMovement.Schedule.Stops.filter(function (element) {
                        return element.TiplocStanoxCode == atTiploc.Stanox;
                    });
                    if(atStops.length > 0) {
                        atStop = atStops[0];
                        this.atPlatform = atStop.Platform;
                        if(atStop.Pass) {
                            this.pass = true;
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
                    if(toTiploc) {
                        this.toStation = toTiploc.Description.toLowerCase();
                    }
                }
                if(trainMovement.Actual && trainMovement.Actual.Stops.length > 0 && atStop) {
                    var atActualStops = trainMovement.Actual.Stops.filter(function (element) {
                        return element.TiplocStanoxCode == atTiploc.Stanox && element.ScheduleStopNumber == atStop.StopNumber;
                    });
                    if(atActualStops.length > 0) {
                        for(var i = 0; i < atActualStops.length; i++) {
                            switch(atActualStops[i].EventType) {
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
            }
            return CallingAtTrainMovement;
        })(TrainMovement);
        KnockoutModels.CallingAtTrainMovement = CallingAtTrainMovement;        
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
        KnockoutModels.CallingBetweenResults = CallingBetweenResults;        
        var CallingBetweenTrainMovement = (function (_super) {
            __extends(CallingBetweenTrainMovement, _super);
            function CallingBetweenTrainMovement(trainMovement, fromTiploc, toTiploc, tiplocs) {
                        _super.call(this, trainMovement, tiplocs);
                this.publicDeparture = "";
                this.actualDeparture = "";
                this.publicArrival = "";
                this.actualArrival = "";
                this.departureDate = "";
                if(trainMovement.Actual && trainMovement.Actual.OriginDepartTimestamp) {
                    this.departureDate = moment(trainMovement.Actual.OriginDepartTimestamp).format(TrainNotifier.DateTimeFormats.dateUrlFormat);
                }
                if(trainMovement.Schedule.Stops.length > 0) {
                    var originStop = trainMovement.Schedule.Stops[0];
                    var originTiploc = TrainNotifier.StationTiploc.findStationTiploc(originStop.TiplocStanoxCode, tiplocs);
                    if(originTiploc) {
                        this.fromStation = originTiploc.Description.toLowerCase();
                    }
                    var destStop = trainMovement.Schedule.Stops[trainMovement.Schedule.Stops.length - 1];
                    var destTiploc = TrainNotifier.StationTiploc.findStationTiploc(destStop.TiplocStanoxCode, tiplocs);
                    if(destTiploc) {
                        this.toStation = destTiploc.Description.toLowerCase();
                    }
                }
                var fromTiplocStop;
                var toTiplocStop;
                if(trainMovement.Schedule && trainMovement.Schedule.Stops) {
                    var fromStops = trainMovement.Schedule.Stops.filter(function (currentStop) {
                        return currentStop.TiplocStanoxCode == fromTiploc.Stanox;
                    });
                    if(fromStops.length > 0) {
                        fromTiplocStop = fromStops[0];
                    }
                    var toStops = trainMovement.Schedule.Stops.filter(function (currentStop) {
                        return currentStop.TiplocStanoxCode == toTiploc.Stanox;
                    });
                    if(toStops.length > 0) {
                        toTiplocStop = toStops[0];
                    }
                }
                if(fromTiplocStop) {
                    this.publicDeparture = TrainNotifier.DateTimeFormats.formatTimeString(fromTiplocStop.PublicDeparture);
                    this.wttDeparture = TrainNotifier.DateTimeFormats.formatTimeString(fromTiplocStop.Departure);
                    this.fromPlatform = fromTiplocStop.Platform;
                    if(trainMovement.Actual && trainMovement.Actual.Stops.length > 0) {
                        var fromDepartStops = trainMovement.Actual.Stops.filter(function (element) {
                            return element.TiplocStanoxCode == fromTiplocStop.TiplocStanoxCode && element.ScheduleStopNumber == fromTiplocStop.StopNumber && element.EventType == TrainNotifier.EventType.Departure;
                        });
                        if(fromDepartStops.length > 0) {
                            this.actualDeparture = TrainNotifier.DateTimeFormats.formatDateTimeString(fromDepartStops[0].ActualTimestamp);
                        }
                    }
                }
                if(toTiplocStop) {
                    this.publicArrival = TrainNotifier.DateTimeFormats.formatTimeString(toTiplocStop.PublicArrival);
                    this.wttArrival = TrainNotifier.DateTimeFormats.formatTimeString(toTiplocStop.Arrival);
                    this.toPlatform = toTiplocStop.Platform;
                    if(trainMovement.Actual && trainMovement.Actual.Stops.length > 0) {
                        var toArriveStops = trainMovement.Actual.Stops.filter(function (element) {
                            return element.TiplocStanoxCode == toTiplocStop.TiplocStanoxCode && element.ScheduleStopNumber == toTiplocStop.StopNumber && element.EventType == TrainNotifier.EventType.Arrival;
                        });
                        if(toArriveStops.length > 0) {
                            this.actualArrival = TrainNotifier.DateTimeFormats.formatDateTimeString(toArriveStops[0].ActualTimestamp);
                        }
                    }
                }
            }
            return CallingBetweenTrainMovement;
        })(TrainMovement);
        KnockoutModels.CallingBetweenTrainMovement = CallingBetweenTrainMovement;        
    })(TrainNotifier.KnockoutModels || (TrainNotifier.KnockoutModels = {}));
    var KnockoutModels = TrainNotifier.KnockoutModels;
})(TrainNotifier || (TrainNotifier = {}));
