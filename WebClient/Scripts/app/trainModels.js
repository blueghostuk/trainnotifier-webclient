var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
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
                    this.estimateArrival = ko.observable(null);
                    this.wttDepart = null;
                    this.publicDepart = null;
                    this.estimateDeparture = ko.observable(null);
                    this.line = null;
                    this.platform = null;
                    this.actualPlatform = ko.observable();
                    this.eAllowance = null;
                    this.paAllowance = null;
                    this.peAllowance = null;
                    this.pass = null;
                    this.cancel = ko.observable(false);
                    this.changePlatform = ko.observable(false);
                    this.isEstimateArrival = ko.observable(true);
                    this.isEstimateDeparture = ko.observable(true);
                    this.associateLiveStop = ko.observable();
                    this.previousStop = null;
                    var tiploc = TrainNotifier.StationTiploc.findStationTiploc(scheduleStop.TiplocStanoxCode, tiplocs);
                    this.stopNumber = scheduleStop.StopNumber;
                    this.location = tiploc.Description ? tiploc.Description.toLowerCase() : tiploc.Tiploc;
                    this.locationCRS = tiploc.CRS && tiploc.CRS.length > 0 ? tiploc.CRS : null;
                    this.locationStanox = scheduleStop.TiplocStanoxCode;

                    if (scheduleStop.Arrival) {
                        this.wttArrive = TrainNotifier.DateTimeFormats.formatTimeString(scheduleStop.Arrival);
                    }
                    if (scheduleStop.PublicArrival) {
                        this.publicArrive = TrainNotifier.DateTimeFormats.formatTimeString(scheduleStop.PublicArrival);
                    }
                    if (scheduleStop.Departure) {
                        this.wttDepart = TrainNotifier.DateTimeFormats.formatTimeString(scheduleStop.Departure);
                    }
                    if (scheduleStop.PublicDeparture) {
                        this.publicDepart = TrainNotifier.DateTimeFormats.formatTimeString(scheduleStop.PublicDeparture);
                    }
                    if (scheduleStop.Pass) {
                        this.pass = TrainNotifier.DateTimeFormats.formatTimeString(scheduleStop.Pass);
                    }

                    this.line = scheduleStop.Line;
                    this.platform = scheduleStop.Platform;
                    this.actualPlatform(scheduleStop.Platform);
                    if (scheduleStop.EngineeringAllowance) {
                        this.eAllowance = "[" + scheduleStop.EngineeringAllowance + "]";
                    }
                    if (scheduleStop.PathingAllowance) {
                        this.paAllowance = "(" + scheduleStop.PathingAllowance + ")";
                    }
                    if (scheduleStop.PerformanceAllowance) {
                        this.peAllowance = "<" + scheduleStop.PerformanceAllowance + ">";
                    }

                    var self = this;
                    this.actualArrival = ko.computed(function () {
                        var arrival = null;
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
                        var departure = null;
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
                ScheduleStop.prototype.getDelayCss = function (value, prefix, defaultValue) {
                    if (typeof prefix === "undefined") { prefix = ""; }
                    if (typeof defaultValue === "undefined") { defaultValue = "hidden"; }
                    if (value < 0)
                        return prefix + "alert-info";
                    if (value > 10)
                        return prefix + "alert-important";
                    if (value > 0)
                        return prefix + "alert-warning";

                    return prefix + defaultValue;
                };

                ScheduleStop.prototype.associateWithLiveStop = function (liveStop) {
                    this.associateLiveStop(liveStop);
                    this.isEstimateArrival(liveStop.actualArrival() == null);
                    this.isEstimateDeparture(liveStop.actualDeparture() == null);
                    if ((liveStop.platform() != null) && (liveStop.platform() != this.platform)) {
                        this.actualPlatform(liveStop.platform());
                        this.changePlatform(true);
                    }
                };

                ScheduleStop.prototype.validateAssociation = function (liveStop) {
                    if (this.associateLiveStop())
                        return false;

                    return liveStop.locationStanox === this.locationStanox;
                };

                ScheduleStop.prototype.associateWithPreviousStop = function (previousStop) {
                    this.previousStop = previousStop;
                };

                ScheduleStop.prototype.estimateFromPreviousStop = function () {
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
                    }
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
                        return LiveStopBase.getDelayCss(self.arrivalDelay());
                    });
                    this.departureDelayCss = ko.computed(function () {
                        return LiveStopBase.getDelayCss(self.departureDelay());
                    });

                    if (!location || !tiplocs || tiplocs.length == 0)
                        return;

                    var tiploc = TrainNotifier.StationTiploc.findStationTiploc(location, tiplocs);
                    this.location = tiploc.Description ? tiploc.Description.toLowerCase() : tiploc.Tiploc;
                    this.locationStanox = tiploc.Stanox;
                }
                LiveStopBase.getDelayCss = function (value, defaultValue) {
                    if (typeof defaultValue === "undefined") { defaultValue = "hidden"; }
                    if (value < 0)
                        return "alert-info";
                    if (value > 10)
                        return "alert-important";
                    if (value > 0)
                        return "alert-warning";

                    return defaultValue;
                };

                LiveStopBase.prototype.updateArrival = function (plannedArrival, actualArrival, line, platform, offRoute, nextStanox, expectedAtNextStanox, tiplocs) {
                    this.arrivalSet = true;
                    this.plannedArrival(TrainNotifier.DateTimeFormats.formatDateTimeString(plannedArrival));
                    this.actualArrival(TrainNotifier.DateTimeFormats.formatDateTimeString(actualArrival));

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
                };

                LiveStopBase.prototype.updateDeparture = function (plannedDeparture, actualDeparture, line, platform, offRoute, nextStanox, expectedAtNextStanox, tiplocs) {
                    this.departureSet = true;
                    this.plannedDeparture(TrainNotifier.DateTimeFormats.formatDateTimeString(plannedDeparture));
                    this.actualDeparture(TrainNotifier.DateTimeFormats.formatDateTimeString(actualDeparture));

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
                };

                LiveStopBase.prototype.updateCommon = function (line, platform, offRoute, nextStanox, expectedAtNextStanox, tiplocs) {
                    this.line(this.line() || line);
                    this.platform(TrainNotifier.Common.trimNullableString(this.platform() || platform));

                    this.offRoute(this.offRoute() || offRoute);
                    if (nextStanox) {
                        var nextAtTiploc = TrainNotifier.StationTiploc.findStationTiploc(nextStanox, tiplocs);
                        if (nextAtTiploc) {
                            this.nextLocation(nextAtTiploc.Description ? nextAtTiploc.Description.toLowerCase() : nextAtTiploc.Tiploc);
                        }
                        if (expectedAtNextStanox) {
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
                    if (this.arrivalSet || this.berthUpdate)
                        return false;
                    var arrivalTiploc = TrainNotifier.StationTiploc.findStationTiploc(arrivalStanox, tiplocs);
                    return this.validateStop(arrivalTiploc);
                };

                LiveStopBase.prototype.validDeparture = function (departureStanox, tiplocs) {
                    if (this.departureSet || this.berthUpdate)
                        return false;
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

                    if (arrivalStop) {
                        this.updateExistingArrival(arrivalStop, tiplocs);
                    }

                    if (departureStop) {
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

                    if (arrivalStop) {
                        this.updateWebSocketArrival(arrivalStop, tiplocs);
                    }

                    if (departureStop) {
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
                    if (berthUpdate.To && berthUpdate.To.length > 0)
                        this.location += " - " + berthUpdate.To;

                    this.actualArrival(moment.utc(berthUpdate.Time).local().format(TrainNotifier.DateTimeFormats.timeFormat));
                    this.notes("From Area: " + berthUpdate.AreaId);
                }
                return BerthLiveStop;
            })(LiveStopBase);
            Train.BerthLiveStop = BerthLiveStop;

            var TrainAssociation = (function () {
                function TrainAssociation(association, currentTrainUid, currentDate) {
                    switch (association.AssociationType) {
                        case 0 /* NextTrain */:
                            if (association.MainTrainUid === currentTrainUid)
                                this.title = "Forms next train: ";
                            else
                                this.title = "Formed of train: ";
                            break;
                        case 1 /* Join */:
                            this.title = "Joins with Train: ";
                            break;
                        case 2 /* Split */:
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
                        case 2 /* NextDay */:
                            this.date = this.date.add({ days: 1 });
                            break;
                        case 1 /* PreviousDay */:
                            this.date = this.date.subtract({ days: 1 });
                            break;
                    }
                    this.location = association.Location.Description ? association.Location.Description.toLowerCase() : association.Location.Tiploc;
                }
                Object.defineProperty(TrainAssociation.prototype, "url", {
                    get: function () {
                        return this.trainId + "/" + this.date.format(TrainNotifier.DateTimeFormats.dateUrlFormat);
                    },
                    enumerable: true,
                    configurable: true
                });

                Object.defineProperty(TrainAssociation.prototype, "javascript", {
                    get: function () {
                        return this.trainId + "/" + this.date.format(TrainNotifier.DateTimeFormats.dateQueryFormat);
                    },
                    enumerable: true,
                    configurable: true
                });
                return TrainAssociation;
            })();
            Train.TrainAssociation = TrainAssociation;

            var TrainDetails = (function () {
                function TrainDetails() {
                    this.id = ko.observable();
                    this.trainUid = ko.observable();
                    this.scheduleDate = ko.observable();
                    this.liveId = ko.observable();
                    this.activated = ko.observable();
                    this.toc = ko.observable();
                    this.type = ko.observable();
                    this.from = ko.observable();
                    this.to = ko.observable();
                    this.runs = ko.observable();
                    this.powerType = ko.observable();
                    this.categoryType = ko.observable();
                    this.speed = ko.observable();
                    this.cancellation = ko.observable();
                    this.changeOfOrigin = ko.observable();
                    this.reinstatement = ko.observable();
                    this.otherSites = [];
                    this.associations = ko.observableArray();
                    this.otherSites.push(new RealtimeTrainsExternalSite());
                    this.otherSites.push(new OpenTrainTimesExternalSite());
                    this.otherSites.push(new TrainsImExternalSite());
                    this.otherSites.push(new RaildarExternalSite());
                }
                TrainDetails.prototype.reset = function () {
                    this.updateFromTrainMovement(null, null);
                    this.associations.removeAll();
                };

                TrainDetails.prototype.updateFromTrainMovement = function (train, tiplocs, date) {
                    if (train && train.Actual) {
                        this.id(train.Actual.HeadCode);
                        this.liveId(train.Actual.TrainId);
                        this.activated(moment(train.Actual.Activated).format(TrainNotifier.DateTimeFormats.dateTimeFormat));
                        this.scheduleDate(moment(train.Actual.OriginDepartTimestamp).format(TrainNotifier.DateTimeFormats.dateQueryFormat));
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
                        this.from(moment(train.Schedule.StartDate).format(TrainNotifier.DateTimeFormats.dateFormat));
                        this.to(moment(train.Schedule.EndDate).format(TrainNotifier.DateTimeFormats.dateFormat));
                        this.runs(TrainDetails.getDaysRun(train.Schedule.Schedule));

                        if (train.Schedule.PowerTypeId) {
                            var power = TrainNotifier.PowerTypeLookup.getPowerType(train.Schedule.PowerTypeId);
                            if (power) {
                                this.powerType(power.Description);
                            } else {
                                this.powerType(null);
                            }
                        } else {
                            this.powerType(null);
                        }
                        if (train.Schedule.CategoryTypeId) {
                            var category = TrainNotifier.CategoryTypeLookup.getCategoryType(train.Schedule.CategoryTypeId);
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
                        this.scheduleDate(moment(date).format(TrainNotifier.DateTimeFormats.dateQueryFormat));
                    }

                    for (var i = 0; i < this.otherSites.length; i++) {
                        this.otherSites[i].updateFromTrainMovement(train, date);
                    }

                    if (train && train.Cancellations.length > 0) {
                        var can = train.Cancellations[0];
                        var canTxt = can.Type;
                        if (can.CancelledAtStanoxCode) {
                            var canTiploc = TrainNotifier.StationTiploc.findStationTiploc(can.CancelledAtStanoxCode, tiplocs);
                            canTxt += " @ " + canTiploc.Description ? canTiploc.Description.toLowerCase() : canTiploc.Tiploc;
                        }
                        canTxt += " @ " + moment(can.CancelledTimestamp).format(TrainNotifier.DateTimeFormats.timeFormat) + " - Reason: ";
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
                        var reinstateTiploc = TrainNotifier.StationTiploc.findStationTiploc(reinstate.NewOriginStanoxCode, tiplocs);
                        this.reinstatement(reinstateTiploc.Description + " @ " + moment(reinstate.PlannedDepartureTime).format(TrainNotifier.DateTimeFormats.timeFormat));
                    } else {
                        this.reinstatement(null);
                    }

                    if (train && train.ChangeOfOrigins.length > 0) {
                        var coo = train.ChangeOfOrigins[0];
                        var cooTiploc = TrainNotifier.StationTiploc.findStationTiploc(coo.NewOriginStanoxCode, tiplocs);
                        var originText = cooTiploc.Description + " @ " + moment(coo.NewDepartureTime).format(TrainNotifier.DateTimeFormats.timeFormat);
                        if (coo.ReasonCode) {
                            originText += " (" + coo.ReasonCode + ": " + coo.Description + ")";
                        }
                        this.changeOfOrigin(originText);
                    } else {
                        this.changeOfOrigin(null);
                    }
                };

                TrainDetails.getStpIndicator = function (stpIndicatorId) {
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
                };

                TrainDetails.getDaysRun = function (schedule) {
                    var days = [];
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
                };
                return TrainDetails;
            })();
            Train.TrainDetails = TrainDetails;

            var ExternalSiteBase = (function () {
                function ExternalSiteBase(name) {
                    this.url = ko.observable();
                    this.text = name;
                }
                ExternalSiteBase.prototype.updateFromTrainMovement = function (train, date) {
                };
                return ExternalSiteBase;
            })();
            Train.ExternalSiteBase = ExternalSiteBase;

            var RealtimeTrainsExternalSite = (function (_super) {
                __extends(RealtimeTrainsExternalSite, _super);
                function RealtimeTrainsExternalSite() {
                    _super.call(this, "Realtime Trains");
                }
                RealtimeTrainsExternalSite.prototype.updateFromTrainMovement = function (train, date) {
                    if (train && train.Schedule && (train.Actual || date)) {
                        var uid = train.Schedule.TrainUid;
                        if (uid.length == 5) {
                            uid = "O" + uid;
                        }
                        this.url(RealtimeTrainsExternalSite.baseUrl + uid + "/" + moment(train.Actual ? train.Actual.OriginDepartTimestamp : date).format("YYYY/MM/DD"));
                    } else {
                        this.url(null);
                    }
                };
                RealtimeTrainsExternalSite.baseUrl = "http://www.realtimetrains.co.uk/train/";
                return RealtimeTrainsExternalSite;
            })(ExternalSiteBase);
            Train.RealtimeTrainsExternalSite = RealtimeTrainsExternalSite;

            var OpenTrainTimesExternalSite = (function (_super) {
                __extends(OpenTrainTimesExternalSite, _super);
                function OpenTrainTimesExternalSite() {
                    _super.call(this, "Open Train Times");
                }
                OpenTrainTimesExternalSite.prototype.updateFromTrainMovement = function (train, date) {
                    if (train && train.Schedule && (train.Actual || date)) {
                        this.url(OpenTrainTimesExternalSite.baseUrl + train.Schedule.TrainUid + "/" + moment(train.Actual ? train.Actual.OriginDepartTimestamp : date).format("YYYY-MM-DD"));
                    } else {
                        this.url(null);
                    }
                };
                OpenTrainTimesExternalSite.baseUrl = "http://www.opentraintimes.com/schedule/";
                return OpenTrainTimesExternalSite;
            })(ExternalSiteBase);
            Train.OpenTrainTimesExternalSite = OpenTrainTimesExternalSite;

            var TrainsImExternalSite = (function (_super) {
                __extends(TrainsImExternalSite, _super);
                function TrainsImExternalSite() {
                    _super.call(this, "trains.im");
                }
                TrainsImExternalSite.prototype.updateFromTrainMovement = function (train, date) {
                    if (train && train.Schedule && (train.Actual || date)) {
                        this.url(TrainsImExternalSite.baseUrl + train.Schedule.TrainUid + "/" + moment(train.Actual ? train.Actual.OriginDepartTimestamp : date).format("YYYY/MM/DD"));
                    } else {
                        this.url(null);
                    }
                };
                TrainsImExternalSite.baseUrl = "http://www.trains.im/schedule/";
                return TrainsImExternalSite;
            })(ExternalSiteBase);
            Train.TrainsImExternalSite = TrainsImExternalSite;

            var RaildarExternalSite = (function (_super) {
                __extends(RaildarExternalSite, _super);
                function RaildarExternalSite() {
                    _super.call(this, "Raildar");
                }
                RaildarExternalSite.prototype.updateFromTrainMovement = function (train, date) {
                    if (train && train.Schedule) {
                        this.url(RaildarExternalSite.baseUrl + train.Schedule.TrainUid);
                    } else {
                        this.url(null);
                    }
                };
                RaildarExternalSite.baseUrl = "http://raildar.co.uk/timetable/train/trainid/";
                return RaildarExternalSite;
            })(ExternalSiteBase);
            Train.RaildarExternalSite = RaildarExternalSite;

            var TrainTitleViewModel = (function () {
                function TrainTitleViewModel() {
                    this.id = ko.observable();
                    this.from = ko.observable();
                    this.to = ko.observable();
                    this.start = ko.observable();
                    this.end = ko.observable();
                    var self = this;
                    this.fullTitle = ko.computed(function () {
                        if (self.id() && self.from() && self.to() && self.start() && self.end()) {
                            document.title = self.id() + " " + self.from() + " to " + self.to() + " " + self.start() + " - " + self.end() + " - ";
                        }
                        return "";
                    }).extend({ throttle: 500 });
                }
                TrainTitleViewModel.prototype.clear = function (clearId) {
                    if (typeof clearId === "undefined") { clearId = true; }
                    if (clearId) {
                        this.id(null);
                    }
                    this.from(null);
                    this.to(null);
                    this.start(null);
                    this.end(null);
                };
                return TrainTitleViewModel;
            })();
            Train.TrainTitleViewModel = TrainTitleViewModel;
        })(KnockoutModels.Train || (KnockoutModels.Train = {}));
        var Train = KnockoutModels.Train;
    })(TrainNotifier.KnockoutModels || (TrainNotifier.KnockoutModels = {}));
    var KnockoutModels = TrainNotifier.KnockoutModels;
})(TrainNotifier || (TrainNotifier = {}));
