/// <reference path="global.ts" />
/// <reference path="../typings/knockout/knockout.d.ts" />
/// <reference path="../typings/moment/moment.d.ts" />

function PPMViewModel(ppmModel?: any, parent?: any) {
    var self = this;

    self.Operator = ko.observable(ppmModel ? ppmModel.Description : null);
    self.Sector = ko.observable(ppmModel ? ppmModel.SectorCode : null);
    self.Code = ko.observable(ppmModel ? ppmModel.OperatorCode : null);
    self.PPMData = ko.observableArray();
    self.Regions = ko.observableArray();
    self.Parent = (parent ? parent : ppmModel ? new PPMViewModel() : null);
    self.IsRegion = (parent ? true : false);

    self.LatestPPM = ko.computed(function () {
        if (self.PPMData().length > 0)
            return self.PPMData()[self.PPMData().length - 1];

        return {};
    });

    self.Id = ko.computed(function () {
        var id = "";
        if (!self.Code()) {
            id += "national-";
            if (self.Sector()) {
                id += self.Sector();
            } else {
                id += "all";
            }
        } else {
            id += self.Code() + "-";
            if (self.Sector()) {
                id += self.Sector() + "-";
            } else {
                id += "all-";
            }
            id += self.Operator().toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, "");
        }

        return id;
    });

    self.updateStats = function (stats) {
        self.PPMData.push(new PPMRecord(stats));
    };
}

function PPMRecord(stats) {
    var self = this;

    self.OnTime = ko.observable(stats.OnTime);
    self.Late = ko.observable(stats.Late);
    self.CancelVeryLate = ko.observable(stats.CancelVeryLate);
    self.Total = ko.observable(stats.Total);
    self.Timestamp = ko.observable(moment(stats.Timestamp).format("HH:mm:ss"));

    self.PPM = ko.computed(function () {
        if (self.OnTime() && self.Total()) {
            return Math.round((self.OnTime() / self.Total()) * 100);
        } else {
            return null;
        }
    });
}

function TitleViewModel() {
    var self = this;

    self.From = ko.observable();
    self.To = ko.observable();
    self.DateRange = ko.observable();

    self.Text = ko.observable();

    self.setTitle = function (title) {
        self.Text(title);
        if (TrainNotifier.Common.page && TrainNotifier.Common.page.pageTitle) {
            document.title = title + " - " + TrainNotifier.Common.page.pageTitle;
        }
    };
}

function LocationViewModel() {
    var self = this;

    self.locationStanox = ko.observable();
    self.locationTiploc = ko.observable();
    self.locationDescription = ko.observable();
    self.locationCRS = ko.observable();
    self.stationName = ko.observable();
    self.stationLocation = ko.observable();
    self.Lat = ko.observable();
    self.Lon = ko.observable();

    self.toDisplay = ko.computed(function () {
        return self.stationName() ? self.stationName() : self.locationDescription();
    });
}

function ExternalSiteViewModel(name) {
    var self = this;

    self.Name = ko.observable(name);
    self.Url = ko.observable();
}

function TrainDetailsViewModel() {
    var self = this;

    self.Activated = ko.observable();
    self.AtocCode = new AtocCodeViewModel();
    self.Cancellation = ko.observable();
    self.ChangeOfOrigin = ko.observable();
    self.Reinstatement = ko.observable();
    self.Headcode = ko.observable();
    self.Id = ko.observable();
    self.Runs = ko.observable();
    self.STPValue = ko.observable();
    self.ServiceCode = ko.observable();
    self.StartDateValue = ko.observable();
    self.EndDateValue = ko.observable();
    self.TrainUid = ko.observable();
    self.Associations = ko.observableArray();
    self.Date = ko.observable();
    self.OtherSites = ko.observableArray([
        new ExternalSiteViewModel("Realtime Trains"),
        new ExternalSiteViewModel("Open Train Times"),
        new ExternalSiteViewModel("trains.im"),
        new ExternalSiteViewModel("Raildar")
    ]);

    self.addAssociation = function (assoc, trainUid, date) {
        self.Associations.push(new TrainAssociation(assoc, trainUid, date));
    };

    self.clearAssociations = function () {
        self.Associations.removeAll();
    };

    self.updateFromJson = function (schedule, liveData) {
        self.updateActivated(liveData.Activated);
        self.AtocCode.updateFromJson(schedule ? schedule.AtocCode : null);
        if (liveData.Cancellation) {
            var canxTxt = liveData.Cancellation.Type;
            if (liveData.Cancellation.CancelledAt)
                canxTxt += " @ " + liveData.Cancellation.CancelledAt.Description;
            canxTxt += " @ " + moment(liveData.Cancellation.CancelledTimestamp).format(TrainNotifier.DateTimeFormats.timeFormat)
                + " - Reason: ";
            if (liveData.Cancellation.Description) {
                canxTxt += liveData.Cancellation.Description;
            }
            canxTxt += " (" + liveData.Cancellation.ReasonCode + ")";
            self.Cancellation(canxTxt);
        } else {
            self.Cancellation(null);
        }
        if (liveData.ChangeOfOrigin) {
            var originText = liveData.ChangeOfOrigin.NewOrigin.Description
                        + " @ " + moment(liveData.ChangeOfOrigin.NewDepartureTime).format(TrainNotifier.DateTimeFormats.timeFormat);
            if (liveData.ChangeOfOrigin.ReasonCode) {
                originText += " (" + liveData.ChangeOfOrigin.ReasonCode + ": " + liveData.ChangeOfOrigin.Description + ")";
            }
            self.ChangeOfOrigin(originText);
        } else {
            self.ChangeOfOrigin(null);
        }
        if (liveData.Reinstatement) {
            self.Reinstatement(liveData.Reinstatement.NewOrigin.Description + " @ "
                + moment(liveData.Reinstatement.PlannedDepartureTime).format(TrainNotifier.DateTimeFormats.timeFormat));
        } else {
            self.Reinstatement(null);
        }
        self.EndDateValue(schedule ? moment(schedule.EndDate).format(TrainNotifier.DateTimeFormats.timeFormat) : null);
        self.Headcode(liveData.HeadCode);
        self.Id(liveData.Id);
        self.updateRuns(schedule ? schedule.Schedule : null);
        self.STPValue(schedule ? self.getSTPValue(schedule.STPIndicator) : null);
        self.ServiceCode(liveData.ServiceCode);
        self.StartDateValue(schedule ? moment(schedule.StartDate).format(TrainNotifier.DateTimeFormats.dateTimeFormat) : null);
        self.TrainUid(schedule ? schedule.TrainUid : liveData.TrainUid);

        if (liveData) {
            self.Date(moment(liveData.SchedOriginDeparture).format("YYYY-MM-DD"));
        } else {
            self.Date();
        }

        self.OtherSites()[0].Url("http://www.realtimetrains.co.uk/train/" + liveData.TrainUid + "/" + moment(liveData.SchedOriginDeparture).format("YYYY/MM/DD"));
        self.OtherSites()[1].Url("http://www.opentraintimes.com/schedule/" + liveData.TrainUid + "/" + moment(liveData.SchedOriginDeparture).format("YYYY-MM-DD"));
        self.OtherSites()[2].Url("http://www.trains.im/schedule/" + liveData.TrainUid + "/" + moment(liveData.SchedOriginDeparture).format("YYYY/MM/DD"));
        self.OtherSites()[3].Url("http://raildar.co.uk/timetable/train/trainid/" + liveData.TrainUid);
    };

    self.updateActivated = function (activated) {
        if (activated) {
            self.Activated(moment(activated).format(TrainNotifier.DateTimeFormats.dateTimeFormat));
        } else {
            self.Activated(null);
        }
    };

    self.updateRuns = function (schedule) {
        if (!schedule) {
            self.Runs(null);
            return;
        }
        var days = Array();
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
        self.Runs(days.join(","));
    };

    self.getSTPValue = function (stpIndicatorId) {
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
    };
}

module TrainNotifier.ViewModels {

    export class ScheduleTrainViewModel {
        public Stops = ko.observableArray();

        addStop(stop: any) {
            this.Stops.push(new ScheduleStopViewModel(stop));
        };

        clearStops() {
            this.Stops.removeAll();
        };

        updateFromJson(schedule: any) {
            this.clearStops();

            if (schedule && schedule.Stops) {
                for (var i in schedule.Stops) {
                    this.addStop(schedule.Stops[i]);
                }
            }
        };
    };

    export class ScheduleStopViewModel {

        public ActualArrival = ko.observable();
        public ActualDeparture = ko.observable();
        public Arrival: string = null;
        public Departure: string = null;
        public PublicArrival: string = null;
        public PublicDeparture: string = null;
        public Intermediate: string;
        public Line: string;
        public Origin: bool;
        public Pass: string;
        public Path: string;
        public EngineeringAllowance: number;
        public PathingAllowance: number;
        public PerformanceAllowance: number;
        public Platform: string;
        public StopNumber: number;
        public Terminate: bool;
        public Tiploc: any;

        constructor(stop: any) {
            this.Arrival = DateTimeFormats.formatTimeString(stop.Arrival);
            this.PublicArrival = DateTimeFormats.formatTimeString(stop.PublicArrival);
            this.Departure = DateTimeFormats.formatTimeString(stop.Departure);
            this.PublicDeparture = DateTimeFormats.formatTimeString(stop.PublicDeparture);

            this.EngineeringAllowance = stop.EngineeringAllowance;
            this.Intermediate = stop.Intermediate;
            this.Line = stop.Line;
            this.Origin = stop.Origin;
            this.Pass = stop.Pass;
            this.Path = stop.Path;
            this.PathingAllowance = stop.PathingAllowance;
            this.PerformanceAllowance = stop.PerformanceAllowance;
            this.Platform = stop.Platform;
            this.StopNumber = stop.StopNumber;
            this.Terminate = stop.Terminate;
            this.Tiploc = new TiplocViewModel(stop.Tiploc);
        };

        setActualArrivalTime(arrival: string) {
            this.ActualArrival(DateTimeFormats.formatTimeString(arrival));
        };

        setActualDepartureTime(departure: string) {
            this.ActualDeparture(DateTimeFormats.formatTimeString(departure));
        };
    };

    export class StopViewModel {
        public Stanox = ko.observable();
        public ArrivalPlannedTime = ko.observable();
        public ArrivalActualTimeStamp = ko.observable();
        public DepartPlannedTime = ko.observable();
        public DepartActualTimeStamp = ko.observable();
        public Line = ko.observable();
        public Platform = ko.observable();
        public ArrivalDelay = ko.observable();
        public DepartDelay = ko.observable();
        public NextStanox = ko.observable();
        public ExpectedAtNextStanox = ko.observable();
        public OffRoute = ko.observable();
        public BerthUpdate: bool;
        public Notes = ko.observable();
        public State = ko.observable();

        public ArrivalDelayResult: KnockoutComputed;
        public ArrivalDelayTitle: KnockoutComputed;
        public DepartDelayResult: KnockoutComputed;
        public DepartDelayTitle: KnockoutComputed;
        public StateClass: KnockoutComputed;
        public StateTitle: KnockoutComputed;

        constructor(berthUpdate?: bool) {
            this.BerthUpdate = berthUpdate || false;

            var self = this;
            this.ArrivalDelayResult = ko.computed(function () {
                if (self.ArrivalDelay() == 0)
                    return "badge-success";
                if (self.ArrivalDelay() < 0)
                    return "badge-info";
                if (self.ArrivalDelay() > 10)
                    return "badge-important";
                if (self.ArrivalDelay() > 0)
                    return "badge-warning";

                return "hidden";
            });
            this.ArrivalDelayTitle = ko.computed(function () {
                if (self.ArrivalDelay() == 0)
                    return "on time";
                if (self.ArrivalDelay() < 0)
                    return "early";
                return "late";
            });
            this.DepartDelayResult = ko.computed(function () {
                if (self.DepartDelay() == 0)
                    return "badge-success";
                if (self.DepartDelay() < 0)
                    return "badge-info";
                if (self.DepartDelay() > 10)
                    return "badge-important";
                if (self.DepartDelay() > 0)
                    return "badge-warning";

                return "hidden";
            });
            this.DepartDelayTitle = ko.computed(function () {
                if (self.DepartDelay() == 0)
                    return "on time";
                if (self.DepartDelay() < 0)
                    return "early";
                return "late";
            });
            this.StateClass = ko.computed(function () {
                switch (self.State()) {
                    case 1:
                        return "warning";
                    case 2:
                        return "error";
                    default:
                        //case "Normal":
                        return "";
                }
            });
            this.StateTitle = ko.computed(function () {
                switch (self.State()) {
                    case 1:
                        return "Terminated";
                    case 2:
                        return "Cancelled";
                    default:
                        //case "Normal":
                        return "";
                }
            });
        }
    };

    export class LiveTrainViewModel {

        public Id = ko.observable();
        public Uid = ko.observable();
        public Headcode = ko.observable();
        public ServiceCode = ko.observable();
        public Activated = ko.observable();
        public SchedOrigin = ko.observable();
        public SchedDepart = ko.observable();
        public Stops = ko.observableArray();
        public LastUpdate = ko.observable();
        public Cancellation = ko.observable();
        public ChangeOfOrigin = ko.observable();
        public Reinstatement = ko.observable();
        public Date: KnockoutComputed;

        constructor() {
            var self = this;
            this.Date = ko.computed(function () {
                if (self.SchedDepart()) {
                    return moment(self.SchedDepart(), DateTimeFormats.dateTimeFormat).format(DateTimeFormats.dateQueryFormat);
                }
                return "";
            });
        }

        addBerthStop(stopEl) {
            var stopModel = new StopViewModel(true);
            switch (stopEl.Type) {
                // TODO: more
                //case "CA":
                default:
                    stopModel.Stanox(stopEl.From + " - " + stopEl.To);
                    // supplied time is in UTC, want to format to local (in theory this is UK)
                    // note these times are shown with seconds as they may not be on the 00/30 mark
                    stopModel.ArrivalActualTimeStamp(moment.utc(stopEl.Time).local().format(DateTimeFormats.timeFormat));
                    stopModel.Notes("From Area: " + stopEl.AreaId);
                    break;
            }
            this.Stops.push(stopModel);
        };

        addStop(stopEl) {
            if (this.Stops().length == 0) {
                var stopModel = new StopViewModel();
                switch (stopEl.EventType.toLowerCase()) {
                    case "arrival":
                        LiveTrainViewModel.setArrival(stopEl, stopModel);
                        break;
                    case "departure":
                        LiveTrainViewModel.setDeparture(stopEl, stopModel);
                        break;
                }

                this.Stops.push(stopModel);
            } else {
                var stopModel = null;
                for (var i = (this.Stops().length - 1); i >= 0; i--) {
                    var stop = this.Stops()[i];
                    if (!stop.BerthUpdate) {
                        if (stop.Stanox() == stopEl.Stanox) {
                            stopModel = stop;
                            break;
                        }
                    }
                }
                if (!stopModel) {
                    stopModel = new StopViewModel();

                    this.Stops.push(stopModel);
                }
                switch (stopEl.EventType.toLowerCase()) {
                    case "arrival":
                        LiveTrainViewModel.setArrival(stopEl, stopModel);
                        if (stopEl.OffRoute) {
                            stopModel.OffRoute("Off Route.");
                        }
                        break;
                    case "departure":
                        LiveTrainViewModel.setDeparture(stopEl, stopModel);

                        if (stopEl.OffRoute) {
                            stopModel.OffRoute("Off Route.");
                        }
                        if (stopEl.NextStanox && stopEl.NextStanox.length > 0) {
                            stopModel.NextStanox(stopEl.NextStanox);
                        }
                        if (stopEl.ExpectedAtNextStanox && stopEl.ExpectedAtNextStanox.length > 0) {
                            stopModel.ExpectedAtNextStanox(DateTimeFormats.formatTimeString(stopEl.ExpectedAtNextStanox));
                        }
                        break;
                }
            }
        };

        clearStops() {
            this.Stops.removeAll();
        };

        updateFromJSON(data) {
            this.clearStops();
            this.Id(data.Id);
            this.Uid(data.TrainUid);
            this.Headcode(data.HeadCode);
            this.ServiceCode(data.ServiceCode);
            var activated = "";
            if (data.Activated) {
                activated = moment(data.Activated).format(TrainNotifier.DateTimeFormats.dateTimeFormat);
            }
            this.Activated(activated);

            this.SchedOrigin(data.SchedOriginStanox);
            var schedDepart = "";
            if (data.SchedOriginDeparture) {
                schedDepart = moment(data.SchedOriginDeparture).format(TrainNotifier.DateTimeFormats.dateTimeFormat);
            }
            this.SchedDepart(schedDepart);
            this.LastUpdate(moment().format(TrainNotifier.DateTimeFormats.dateTimeFormat));

            if (data.Cancellation) {
                var canxTxt = data.Cancellation.Type;
                if (data.Cancellation.CancelledAt)
                    canxTxt += " @ " + data.Cancellation.CancelledAt.Description;
                canxTxt += " @ " + moment(data.Cancellation.CancelledTimestamp).format(TrainNotifier.DateTimeFormats.timeFormat)
                    + " - Reason: ";
                if (data.Cancellation.Description) {
                    canxTxt += data.Cancellation.Description;
                }
                canxTxt += " (" + data.Cancellation.ReasonCode + ")";
                this.Cancellation(canxTxt);
            } else {
                this.Cancellation(null);
            }
            if (data.ChangeOfOrigin) {
                var originText = data.ChangeOfOrigin.NewOrigin.Description
                            + " @ " + moment(data.ChangeOfOrigin.NewDepartureTime).format(TrainNotifier.DateTimeFormats.timeFormat);
                if (data.ChangeOfOrigin.ReasonCode) {
                    originText += " (" + data.ChangeOfOrigin.ReasonCode + ": " + data.ChangeOfOrigin.Description + ")";
                }
                this.ChangeOfOrigin(originText);
            } else {
                this.ChangeOfOrigin(null);
            }
            if (data.Reinstatement) {
                this.Reinstatement(data.Reinstatement.NewOrigin.Description + " @ "
                    + moment(data.Reinstatement.PlannedDepartureTime).format(TrainNotifier.DateTimeFormats.timeFormat));
            } else {
                this.Reinstatement(null);
            }
        };

        private static setArrival(stopEl: any, stopModel: StopViewModel) {
            var times = LiveTrainViewModel.getTimes(stopEl);

            stopModel.ArrivalActualTimeStamp(DateTimeFormats.formatTimeString(times.ActualTimeStamp));
            stopModel.ArrivalPlannedTime(DateTimeFormats.formatTimeString(times.PlannedTimeStamp));
            stopModel.ArrivalDelay(times.Delay);

            LiveTrainViewModel.setCommon(stopEl, stopModel);
        };

        private static setDeparture(stopEl: any, stopModel: StopViewModel) {
            var times = LiveTrainViewModel.getTimes(stopEl);

            stopModel.DepartActualTimeStamp(DateTimeFormats.formatTimeString(times.ActualTimeStamp));
            stopModel.DepartPlannedTime(DateTimeFormats.formatTimeString(times.PlannedTimeStamp));
            stopModel.DepartDelay(times.Delay);

            LiveTrainViewModel.setCommon(stopEl, stopModel);
        };

        private static setCommon(stopEl: any, stopModel: StopViewModel) {
            var existingLine = stopModel.Line();
            if (!existingLine || existingLine == "") {
                stopModel.Line(stopEl.Line);
            }
            var existingPlatform = stopModel.Platform();
            if (!existingPlatform || existingPlatform == "") {
                stopModel.Platform(stopEl.Platform);
            }

            stopModel.State(stopEl.State);
            stopModel.Stanox(stopEl.Stanox);
        };

        private static getTimes(stopEl: any) : ITimeResult {
            var setTimes = true;
            var result: ITimeResult = {
                ActualTimeStamp: null,
                PlannedTimeStamp: null,
                Delay: 0
            };
            var actualTime = null;
            if (stopEl.ActualTimeStamp && stopEl.ActualTimeStamp.length > 0) {
                actualTime = new Date(stopEl.ActualTimeStamp);
                result.ActualTimeStamp = moment(stopEl.ActualTimeStamp).format(TrainNotifier.DateTimeFormats.timeFormat);
            } else {
                setTimes = false;
            }
            var plannedTime = null;
            if (stopEl.PlannedTime && stopEl.PlannedTime.length > 0) {
                plannedTime = new Date(stopEl.PlannedTime);
                result.PlannedTimeStamp = moment(stopEl.PlannedTime).format(TrainNotifier.DateTimeFormats.timeFormat);
            } else if (stopEl.ActualTimeStamp && stopEl.ActualTimeStamp.length > 0) {
                plannedTime = new Date(stopEl.ActualTimeStamp);
                result.PlannedTimeStamp = moment(stopEl.ActualTimeStamp).format(TrainNotifier.DateTimeFormats.timeFormat);
            } else {
                setTimes = false;
            }

            if (setTimes) {
                result.Delay = ((actualTime - plannedTime) / 60000);
            }

            return result;
        };
    };

    private interface ITimeResult{
        ActualTimeStamp: string;
        PlannedTimeStamp: string;
        Delay: number;
    };

    export class TrainTitleViewModel {

        public Id = ko.observable();
        public From = ko.observable();
        public To = ko.observable();
        public Start = ko.observable();
        public End = ko.observable();
        public FullTitle: KnockoutComputed;

        constructor() {
            var self = this;
            this.FullTitle = ko.computed(function () {
                if (TrainNotifier.Common.page && TrainNotifier.Common.page.pageTitle &&
                    self.Id() && self.From() && self.To() && self.Start() && self.End()) {
                    document.title = self.Id() + " "
                        + self.From()
                        + " to " + self.To() + " "
                        + self.Start() + " - " + self.End()
                        + " - " + TrainNotifier.Common.page.pageTitle;
                }
                return "";
            });
        };
    }
}

function AtocCodeViewModel() {
    var self = this;

    self.Code = ko.observable();
    self.Name = ko.observable();

    self.updateFromJson = function (atocCode) {
        if (atocCode) {
            self.Code(atocCode.Code);
            self.Name(atocCode.Name);
        } else {
            self.Code(null);
            self.Name(null);
        }
    };
}

function TiplocViewModel(tiploc) {
    var self = this;

    self.CRS = ko.observable(tiploc ? tiploc.CRS : null);
    self.Description = ko.observable(tiploc ? tiploc.Description.toLowerCase() : null);
    self.Nalco = ko.observable(tiploc ? tiploc.Nalco : null);
    self.Stanox = ko.observable(tiploc ? tiploc.Stanox : null);
    self.Tiploc = ko.observable(tiploc ? tiploc.Tiploc : null);
    self.TiplocId = ko.observable(tiploc ? tiploc.TiplocId : null);

    self.updateFromJson = function (tiploc) {
        if (tiploc) {
            self.CRS(tiploc.CRS);
            self.Description(tiploc.CRS);
            self.Nalco(tiploc.Nalco);
            self.Stanox(tiploc.Stanox);
            self.Tiploc(tiploc.Tiploc);
            self.TiplocId(tiploc.TiplocId);
        } else {
            self.CRS(null);
            self.Description(null);
            self.Nalco(null);
            self.Stanox(null);
            self.Tiploc(null);
            self.TiplocId(null);
        }
    };
}

var scheduleResultsMode = {
    Origin: 1,
    Terminate: 2,
    CallingAt: 3,
    Between: 4
};

function ScheduleSearchResults() {
    var self = this;

    self.Trains = ko.observableArray();

    self.addTrain = function (stop) {
        self.Trains.push(stop);
    };

    self.clearTrains = function () {
        self.Trains.removeAll();
    };
}

function TrainAssociation(association, trainUid, date) {
    var self = this;
    var _trainUid = trainUid;
    var _date = date;

    self.AssocTrainUid = ko.observable(association.AssocTrainUid);
    self.AssociationType = ko.observable(association.AssociationType);
    self.DateType = ko.observable(association.DateType);
    self.EndDate = ko.observable(association.EndDate);
    self.Location = new TiplocViewModel(association.Location);
    self.MainTrainUid = ko.observable(association.MainTrainUid);
    self.StartDate = ko.observable(association.StartDate);

    self.Title = ko.computed(function () {
        switch (self.AssociationType()) {
            case 0:
                if (self.MainTrainUid() == _trainUid)
                    return "Forms Next Train:";
                else
                    return "Formed of Train";
            case 1:
                return "Joins with Train:";
            case 2:
                return "Splits from Train:";
            default:
                return "";
        }
    });

    self.getTrain = function () {
        if (self.MainTrainUid() == _trainUid)
            return self.AssocTrainUid();
        else
            return self.MainTrainUid();
    };

    self.Train = ko.computed(function () {
        return self.getTrain();
    });

    self.View = ko.computed(function () {
        var date = _date;
        switch (self.DateType()) {
            case 1:
                date.subtract('days', 1);
                break;
            case 2:
                date.add('days', 1);
                break;
        }
        return self.getTrain() + "/" + date.format("YYYY-MM-DD");
    });

    self.Link = ko.computed(function () {
        var date = _date;
        switch (self.DateType()) {
            case 1:
                date.subtract('days', 1);
                break;
            case 2:
                date.add('days', 1);
                break;
        }
        return self.getTrain() + "/" + date.format("YYYY/MM/DD");
    });
}