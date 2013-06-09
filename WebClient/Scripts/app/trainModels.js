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
                    this.associateLiveStop = ko.observable();
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
                    var self = this;
                    this.actualArrival = ko.computed(function () {
                        if(self.associateLiveStop()) {
                            return self.associateLiveStop().actualArrival();
                        }
                        return null;
                    });
                    this.arrivalDelay = ko.computed(function () {
                        if(self.associateLiveStop()) {
                            return self.associateLiveStop().arrivalDelay();
                        }
                        return null;
                    });
                    this.arrivalDelayCss = ko.computed(function () {
                        return self.getDelayCss(self.arrivalDelay());
                    });
                    this.actualDeparture = ko.computed(function () {
                        if(self.associateLiveStop()) {
                            return self.associateLiveStop().actualDeparture();
                        }
                        return null;
                    });
                    this.departureDelay = ko.computed(function () {
                        if(self.associateLiveStop()) {
                            return self.associateLiveStop().departureDelay();
                        }
                        return null;
                    });
                    this.departureDelayCss = ko.computed(function () {
                        return self.getDelayCss(self.departureDelay());
                    });
                }
                ScheduleStop.prototype.getDelayCss = function (value) {
                    if(value === 0) {
                        return "badge-success";
                    }
                    if(value < 0) {
                        return "badge-info";
                    }
                    if(value > 10) {
                        return "badge-important";
                    }
                    if(value > 0) {
                        return "badge-warning";
                    }
                    return "hidden";
                };
                ScheduleStop.prototype.associateWithLiveStop = function (liveStop) {
                    this.associateLiveStop(liveStop);
                };
                ScheduleStop.prototype.validateAssociation = function (liveStop) {
                    if(this.associateLiveStop()) {
                        return false;
                    }
                    return liveStop.locationStanox === this.locationStanox;
                };
                return ScheduleStop;
            })();
            Train.ScheduleStop = ScheduleStop;            
            var LiveStopBase = (function () {
                function LiveStopBase(location, tiplocs) {
                    this.plannedArrival = ko.observable();
                    this.actualArrival = ko.observable();
                    this.arrivalDelay = ko.observable();
                    this.plannedDeparture = ko.observable();
                    this.actualDeparture = ko.observable();
                    this.departureDelay = ko.observable();
                    this.line = ko.observable();
                    this.platform = ko.observable();
                    this.nextLocation = ko.observable();
                    this.nextAt = ko.observable();
                    this.berthUpdate = false;
                    this.offRoute = ko.observable(false);
                    this.notes = ko.observable();
                    this.departureSet = false;
                    this.arrivalSet = false;
                    this.timeStamp = 0;
                    var self = this;
                    this.arrivalDelayCss = ko.computed(function () {
                        return self.getDelayCss(self.arrivalDelay());
                    });
                    this.departureDelayCss = ko.computed(function () {
                        return self.getDelayCss(self.departureDelay());
                    });
                    if(!location || !tiplocs || tiplocs.length == 0) {
                        return;
                    }
                    var tiploc = TrainNotifier.StationTiploc.findStationTiploc(location, tiplocs);
                    this.location = tiploc.Description.toLowerCase();
                    this.locationStanox = tiploc.Stanox;
                }
                LiveStopBase.prototype.getDelayCss = function (value) {
                    if(value === 0) {
                        return "badge-success";
                    }
                    if(value < 0) {
                        return "badge-info";
                    }
                    if(value > 10) {
                        return "badge-important";
                    }
                    if(value > 0) {
                        return "badge-warning";
                    }
                    return "hidden";
                };
                LiveStopBase.prototype.updateArrival = function (plannedArrival, actualArrival, line, platform, offRoute, nextStanox, expectedAtNextStanox, tiplocs) {
                    this.arrivalSet = true;
                    this.plannedArrival(TrainNotifier.DateTimeFormats.formatDateTimeString(plannedArrival));
                    this.actualArrival(TrainNotifier.DateTimeFormats.formatDateTimeString(actualArrival));
                    var planned = moment(plannedArrival);
                    var actual = moment(actualArrival);
                    this.arrivalDelay(actual.diff(planned, 'minutes'));
                    this.timeStamp = actual.unix();
                    this.updateCommon(line, platform, offRoute, nextStanox, expectedAtNextStanox, tiplocs);
                };
                LiveStopBase.prototype.updateDeparture = function (plannedDeparture, actualDeparture, line, platform, offRoute, nextStanox, expectedAtNextStanox, tiplocs) {
                    this.departureSet = true;
                    this.plannedDeparture(TrainNotifier.DateTimeFormats.formatDateTimeString(plannedDeparture));
                    this.actualDeparture(TrainNotifier.DateTimeFormats.formatDateTimeString(actualDeparture));
                    var planned = moment(plannedDeparture);
                    var actual = moment(actualDeparture);
                    this.departureDelay(actual.diff(planned, 'minutes'));
                    if(this.timeStamp == 0) {
                        this.timeStamp = actual.unix();
                    }
                    this.updateCommon(line, platform, offRoute, nextStanox, expectedAtNextStanox, tiplocs);
                };
                LiveStopBase.prototype.updateCommon = function (line, platform, offRoute, nextStanox, expectedAtNextStanox, tiplocs) {
                    this.line(this.line() || line);
                    this.platform(this.platform() || platform);
                    this.offRoute(this.offRoute() || offRoute);
                    if(nextStanox) {
                        var nextAtTiploc = TrainNotifier.StationTiploc.findStationTiploc(nextStanox, tiplocs);
                        if(nextAtTiploc) {
                            this.nextLocation(nextAtTiploc.Description.toLowerCase());
                        }
                        if(expectedAtNextStanox) {
                            this.nextAt(TrainNotifier.DateTimeFormats.formatTimeString(expectedAtNextStanox));
                        }
                    }
                };
                Object.defineProperty(LiveStopBase.prototype, "timeStampForSorting", {
                    get: function () {
                        return this.timeStamp;
                    },
                    enumerable: true,
                    configurable: true
                });
                LiveStopBase.prototype.updateExistingArrival = function (arrivalStop, tiplocs) {
                    this.updateArrival(arrivalStop.PlannedTimestamp, arrivalStop.ActualTimestamp, arrivalStop.Line, arrivalStop.Platform, null, null, null, tiplocs);
                };
                LiveStopBase.prototype.updateExistingDeparture = function (departureStop, tiplocs) {
                    this.updateDeparture(departureStop.PlannedTimestamp, departureStop.ActualTimestamp, departureStop.Line, departureStop.Platform, null, null, null, tiplocs);
                };
                LiveStopBase.prototype.updateWebSocketArrival = function (arrivalStop, tiplocs) {
                    this.updateArrival(arrivalStop.PlannedTime, arrivalStop.ActualTimeStamp, arrivalStop.Line, arrivalStop.Platform, arrivalStop.OffRoute, arrivalStop.NextStanox, arrivalStop.ExpectedAtNextStanox, tiplocs);
                };
                LiveStopBase.prototype.updateWebSocketDeparture = function (departureStop, tiplocs) {
                    this.updateDeparture(departureStop.PlannedTime, departureStop.ActualTimeStamp, departureStop.Line, departureStop.Platform, departureStop.OffRoute, departureStop.NextStanox, departureStop.ExpectedAtNextStanox, tiplocs);
                };
                LiveStopBase.prototype.validArrival = function (arrivalStanox, tiplocs) {
                    if(this.arrivalSet || this.berthUpdate) {
                        return false;
                    }
                    var arrivalTiploc = TrainNotifier.StationTiploc.findStationTiploc(arrivalStanox, tiplocs);
                    return this.validateStop(arrivalTiploc);
                };
                LiveStopBase.prototype.validDeparture = function (departureStanox, tiplocs) {
                    if(this.departureSet || this.berthUpdate) {
                        return false;
                    }
                    var departureTiploc = TrainNotifier.StationTiploc.findStationTiploc(departureStanox, tiplocs);
                    return this.validateStop(departureTiploc);
                };
                LiveStopBase.prototype.validateStop = function (tiploc) {
                    return tiploc && tiploc.Stanox === this.locationStanox;
                };
                return LiveStopBase;
            })();
            Train.LiveStopBase = LiveStopBase;            
            var ExistingLiveStop = (function (_super) {
                __extends(ExistingLiveStop, _super);
                function ExistingLiveStop(tiplocs, arrivalStop, departureStop) {
                                _super.call(this, arrivalStop ? arrivalStop.TiplocStanoxCode : departureStop.TiplocStanoxCode, tiplocs);
                    if(arrivalStop) {
                        this.updateExistingArrival(arrivalStop, tiplocs);
                    }
                    if(departureStop) {
                        this.updateExistingDeparture(departureStop, tiplocs);
                    }
                }
                return ExistingLiveStop;
            })(LiveStopBase);
            Train.ExistingLiveStop = ExistingLiveStop;            
            var NewLiveStop = (function (_super) {
                __extends(NewLiveStop, _super);
                function NewLiveStop(tiplocs, arrivalStop, departureStop) {
                                _super.call(this, arrivalStop ? arrivalStop.Stanox : departureStop.Stanox, tiplocs);
                    if(arrivalStop) {
                        this.updateWebSocketArrival(arrivalStop, tiplocs);
                    }
                    if(departureStop) {
                        this.updateWebSocketDeparture(departureStop, tiplocs);
                    }
                }
                return NewLiveStop;
            })(LiveStopBase);
            Train.NewLiveStop = NewLiveStop;            
            var BerthLiveStop = (function (_super) {
                __extends(BerthLiveStop, _super);
                function BerthLiveStop(berthUpdate) {
                                _super.call(this);
                    this.berthUpdate = true;
                    this.location = berthUpdate.From;
                    if(berthUpdate.To && berthUpdate.To.length > 0) {
                        this.location += " - " + berthUpdate.To;
                    }
                    this.actualArrival(moment.utc(berthUpdate.Time).local().format(TrainNotifier.DateTimeFormats.timeFormat));
                    this.notes("From Area: " + berthUpdate.AreaId);
                }
                return BerthLiveStop;
            })(LiveStopBase);
            Train.BerthLiveStop = BerthLiveStop;            
        })(KnockoutModels.Train || (KnockoutModels.Train = {}));
        var Train = KnockoutModels.Train;
    })(TrainNotifier.KnockoutModels || (TrainNotifier.KnockoutModels = {}));
    var KnockoutModels = TrainNotifier.KnockoutModels;
})(TrainNotifier || (TrainNotifier = {}));
