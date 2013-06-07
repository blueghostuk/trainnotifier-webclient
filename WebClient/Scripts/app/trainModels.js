var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var TrainNotifier;
(function (TrainNotifier) {
    (function (KnockoutModels) {
        (function (Train) {
            var ScheduleStop = (function () {
                function ScheduleStop(scheduleStop, tiplocs) {
                    this.wttArrive = null;
                    this.publicArrive = null;
                    this.wttDepart = null;
                    this.publicDepart = null;
                    this.line = null;
                    this.platform = null;
                    this.allowances = null;
                    this.pass = null;
                    var tiploc = TrainNotifier.StationTiploc.findStationTiploc(scheduleStop.TiplocStanoxCode, tiplocs);
                    this.location = tiploc.Description.toLowerCase();
                    this.locationStanox = scheduleStop.TiplocStanoxCode;
                    if(scheduleStop.Arrival) {
                        this.wttArrive = TrainNotifier.DateTimeFormats.formatTimeString(scheduleStop.Arrival);
                    }
                    if(scheduleStop.PublicArrival) {
                        this.publicArrive = TrainNotifier.DateTimeFormats.formatTimeString(scheduleStop.PublicArrival);
                    }
                    if(scheduleStop.Departure) {
                        this.wttDepart = TrainNotifier.DateTimeFormats.formatTimeString(scheduleStop.Departure);
                    }
                    if(scheduleStop.PublicDeparture) {
                        this.publicDepart = TrainNotifier.DateTimeFormats.formatTimeString(scheduleStop.PublicDeparture);
                    }
                    if(scheduleStop.Pass) {
                        this.pass = TrainNotifier.DateTimeFormats.formatTimeString(scheduleStop.Pass);
                    }
                    this.line = scheduleStop.Line;
                    this.platform = scheduleStop.Platform;
                    var allowances = [];
                    if(scheduleStop.EngineeringAllowance) {
                        allowances.push("Eng.:" + scheduleStop.EngineeringAllowance);
                    }
                    if(scheduleStop.PathingAllowance) {
                        allowances.push("Path:" + scheduleStop.EngineeringAllowance);
                    }
                    if(scheduleStop.PerformanceAllowance) {
                        allowances.push("Perf.:" + scheduleStop.PerformanceAllowance);
                    }
                    if(allowances.length > 0) {
                        this.allowances = allowances.join(", ");
                    }
                }
                return ScheduleStop;
            })();
            Train.ScheduleStop = ScheduleStop;            
            var LiveStopBase = (function () {
                function LiveStopBase() {
                    this.plannedArrival = null;
                    this.actualArrival = null;
                    this.arrivalDelay = null;
                    this.plannedDeparture = ko.observable();
                    this.actualDeparture = ko.observable();
                    this.departureDelay = ko.observable();
                    this.line = null;
                    this.platform = null;
                    this.nextLocation = ko.observable();
                    this.nextStatox = ko.observable();
                    this.nextAt = ko.observable();
                    this.berthUpdate = false;
                    this.offRoute = false;
                }
                LiveStopBase.prototype.updateDeparture = function (departureStop, tiplocs) {
                    this.plannedDeparture(TrainNotifier.DateTimeFormats.formatDateTimeString(departureStop.PlannedTime));
                    this.actualDeparture(TrainNotifier.DateTimeFormats.formatDateTimeString(departureStop.ActualTimeStamp));
                    var planned = moment(departureStop.PlannedTime);
                    var actual = moment(departureStop.ActualTimeStamp);
                    this.departureDelay(actual.diff(planned, 'minutes'));
                    this.line = this.line || departureStop.Line;
                    this.platform = this.platform || departureStop.Platform;
                    this.offRoute = departureStop.OffRoute;
                    if(departureStop.NextStanox) {
                        this.nextStatox(departureStop.NextStanox);
                        var nextAtTiploc = TrainNotifier.StationTiploc.findStationTiploc(departureStop.NextStanox, tiplocs);
                        if(nextAtTiploc) {
                            this.nextLocation(nextAtTiploc.Description.toLowerCase());
                        }
                        if(departureStop.ExpectedAtNextStanox) {
                            this.nextAt(TrainNotifier.DateTimeFormats.formatTimeString(departureStop.ExpectedAtNextStanox));
                        }
                    }
                };
                return LiveStopBase;
            })();
            Train.LiveStopBase = LiveStopBase;            
            var ExistingLiveStop = (function (_super) {
                __extends(ExistingLiveStop, _super);
                function ExistingLiveStop(tiplocs, arrivalStop, departureStop) {
                                _super.call(this);
                    var stop = arrivalStop || departureStop;
                    var tiploc = TrainNotifier.StationTiploc.findStationTiploc(stop.TiplocStanoxCode, tiplocs);
                    this.location = tiploc.Description.toLowerCase();
                    this.locationStanox = stop.TiplocStanoxCode;
                    if(arrivalStop) {
                        this.plannedArrival = TrainNotifier.DateTimeFormats.formatDateTimeString(arrivalStop.PlannedTimestamp);
                        this.actualArrival = TrainNotifier.DateTimeFormats.formatDateTimeString(arrivalStop.ActualTimestamp);
                        var planned = moment(arrivalStop.PlannedTimestamp);
                        var actual = moment(arrivalStop.ActualTimestamp);
                        this.arrivalDelay = actual.diff(planned, 'minutes');
                        this.line = arrivalStop.Line;
                        this.platform = arrivalStop.Platform;
                    }
                    if(departureStop) {
                        this.plannedDeparture(TrainNotifier.DateTimeFormats.formatDateTimeString(departureStop.PlannedTimestamp));
                        this.actualDeparture(TrainNotifier.DateTimeFormats.formatDateTimeString(departureStop.ActualTimestamp));
                        var planned = moment(departureStop.PlannedTimestamp);
                        var actual = moment(departureStop.ActualTimestamp);
                        this.departureDelay(actual.diff(planned, 'minutes'));
                        this.line = this.line || departureStop.Line;
                        this.platform = this.platform || departureStop.Platform;
                    }
                }
                return ExistingLiveStop;
            })(LiveStopBase);
            Train.ExistingLiveStop = ExistingLiveStop;            
            var NewLiveStop = (function (_super) {
                __extends(NewLiveStop, _super);
                function NewLiveStop(tiplocs, arrivalStop, departureStop) {
                                _super.call(this);
                    var stop = arrivalStop || departureStop;
                    var tiploc = TrainNotifier.StationTiploc.findStationTiploc(stop.Stanox, tiplocs);
                    this.location = tiploc.Description.toLowerCase();
                    this.locationStanox = stop.Stanox;
                    if(arrivalStop) {
                        this.plannedArrival = TrainNotifier.DateTimeFormats.formatDateTimeString(arrivalStop.PlannedTime);
                        this.actualArrival = TrainNotifier.DateTimeFormats.formatDateTimeString(arrivalStop.ActualTimeStamp);
                        var planned = moment(arrivalStop.PlannedTime);
                        var actual = moment(arrivalStop.ActualTimeStamp);
                        this.arrivalDelay = actual.diff(planned, 'minutes');
                        this.line = arrivalStop.Line;
                        this.platform = arrivalStop.Platform;
                        this.offRoute = arrivalStop.OffRoute;
                        if(arrivalStop.NextStanox) {
                            this.nextStatox(arrivalStop.NextStanox);
                            var nextAtTiploc = TrainNotifier.StationTiploc.findStationTiploc(arrivalStop.NextStanox, tiplocs);
                            if(nextAtTiploc) {
                                this.nextLocation(nextAtTiploc.Description.toLowerCase());
                            }
                            if(arrivalStop.ExpectedAtNextStanox) {
                                this.nextAt(TrainNotifier.DateTimeFormats.formatTimeString(arrivalStop.ExpectedAtNextStanox));
                            }
                        }
                    }
                    if(departureStop) {
                        this.plannedDeparture(TrainNotifier.DateTimeFormats.formatDateTimeString(departureStop.PlannedTime));
                        this.actualDeparture(TrainNotifier.DateTimeFormats.formatDateTimeString(departureStop.ActualTimeStamp));
                        var planned = moment(departureStop.PlannedTime);
                        var actual = moment(departureStop.ActualTimeStamp);
                        this.departureDelay(actual.diff(planned, 'minutes'));
                        this.line = this.line || departureStop.Line;
                        this.platform = this.platform || departureStop.Platform;
                        this.offRoute = this.offRoute || arrivalStop.OffRoute;
                        if(departureStop.NextStanox) {
                            this.nextStatox(departureStop.NextStanox);
                            var nextAtTiploc = TrainNotifier.StationTiploc.findStationTiploc(departureStop.NextStanox, tiplocs);
                            if(nextAtTiploc) {
                                this.nextLocation(nextAtTiploc.Description.toLowerCase());
                            }
                            if(departureStop.ExpectedAtNextStanox) {
                                this.nextAt(TrainNotifier.DateTimeFormats.formatTimeString(departureStop.ExpectedAtNextStanox));
                            }
                        }
                    }
                }
                return NewLiveStop;
            })(LiveStopBase);
            Train.NewLiveStop = NewLiveStop;            
        })(KnockoutModels.Train || (KnockoutModels.Train = {}));
        var Train = KnockoutModels.Train;
    })(TrainNotifier.KnockoutModels || (TrainNotifier.KnockoutModels = {}));
    var KnockoutModels = TrainNotifier.KnockoutModels;
})(TrainNotifier || (TrainNotifier = {}));
