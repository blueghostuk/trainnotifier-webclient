/// <reference path="moment.js" />
/// <reference path="knockout-2.2.0.js" />

function LocationViewModel() {
    this.locationStanox = ko.observable();
    this.locationTiploc = ko.observable();
    this.locationDescription = ko.observable();
    this.locationCRS = ko.observable();
    this.stationName = ko.observable();
    this.stationLocation = ko.observable();
    this.Lat = ko.observable();
    this.Lon = ko.observable();
}

function ScheduleTrainViewModel() {
    var self = this;

    var timeFormat = "HH:mm:ss";
    var dateFormat = "DD/MM/YY HH:mm:ss";

    self.Activated = ko.observable();
    self.AtocCode = new AtocCodeViewModel();
    self.Cancellation = ko.observable();
    self.Destination = new TiplocViewModel();
    self.EndDateValue = ko.observable();
    self.Headcode = ko.observable();
    self.Id = ko.observable();
    self.Origin = new TiplocViewModel();
    self.Runs = ko.observable();
    self.STPValue = ko.observable();
    self.ServiceCode = ko.observable();
    self.StartDateValue = ko.observable();
    self.Status = ko.observable();
    self.ServiceCode = ko.observable();
    self.LastUpdate = ko.observable();
    self.Stops = ko.observableArray();
    self.TrainUid = ko.observable();

    self.addStop = function (stop) {
        self.Stops.push(new ScheduleStopViewModel(stop));
    };

    self.clearStops = function () {
        self.Stops.removeAll();
    }

    self.updateFromJson = function (schedule, liveData) {
        self.clearStops();

        self.updateActivated(liveData.Activated);
        self.AtocCode.updateFromJson(schedule.AtocCode);
        if (liveData.Cancellation) {
            var canxTxt =
                liveData.Cancellation.Type
                + " @ " + liveData.Cancellation.CancelledAt.Description
                + " @ " + moment(liveData.Cancellation.CancelledTimestamp).format(timeFormat)
                + " - Reason: ";
            if (liveData.Cancellation.Description) {
                canxTxt += liveData.Cancellation.Description;
            }
            canxTxt += " (" + liveData.Cancellation.ReasonCode + ")";
            self.Cancellation(canxTxt);
        } else {
            self.Cancellation(null);
        }

        self.Destination.updateFromJson(schedule.Destination);
        self.EndDateValue(moment(schedule.EndDate).format(dateFormat));
        self.Headcode(liveData.HeadCode);
        self.Id(liveData.Id);
        self.Origin.updateFromJson(schedule.Origin);
        self.updateRuns(schedule.Schedule);
        self.STPValue(self.getSTPValue(schedule.STPIndicator));
        self.ServiceCode(liveData.ServiceCode);
        self.StartDateValue(moment(schedule.StartDate).format(dateFormat));
        self.LastUpdate(moment().format(dateFormat));
        self.TrainUid(schedule.TrainUid);

        for (var stop in schedule.Stops) {
            self.addStop(schedule.Stops[stop]);
        }
    }

    self.updateActivated = function (activated) {
        if (activated) {
            self.Activated(moment(activated).format(dateFormat));
        } else {
            self.Activated(null);
        }
    };

    self.updateRuns = function (schedule) {
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
    }
}

function ScheduleStopViewModel(stop) {
    var self = this;

    self.ActualArrival = ko.observable();
    self.ActualDeparture = ko.observable();
    self.Arrival = stop.Arrival;
    self.Departure = stop.Departure;
    self.EngineeringAllowance = stop.EngineeringAllowance;
    self.Intermediate = stop.Intermediate;
    self.Line = stop.Line;
    self.Origin = stop.Origin;
    self.Pass = stop.Pass;
    self.Path = stop.Path;
    self.PathingAllowance = stop.PathingAllowance;
    self.PerformanceAllowance = stop.PerformanceAllowance;
    self.Platform = stop.Platform;
    self.PublicArrival = stop.PublicArrival;
    self.PublicDeparture = stop.PublicDeparture;
    self.StopNumber = stop.StopNumber;
    self.Terminate = stop.Terminate;
    self.Origin = stop.Origin;
    self.Tiploc = new TiplocViewModel(stop.Tiploc);
}

function AtocCodeViewModel() {
    var self = this;

    self.Code = ko.observable();
    self.Name = ko.observable();

    self.updateFromJson = function (atocCode) {
        if (atocCode){
            self.Code(atocCode.Code);
            self.Name(atocCode.Name);
        }else{
            self.Code(null);
            self.Name(null);
        }
    };
}

function TiplocViewModel(tiploc) {
    var self = this;

    self.CRS = ko.observable(tiploc ? tiploc.CRS : null);
    self.Description = ko.observable(tiploc ? tiploc.Description : null);
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
    }
}

function ScheduleSearchResults() {
    var self = this;

    self.PreviousDay = ko.observable();
    self.NextDay = ko.observable();
    self.Day = ko.observable();

    self.Trains = ko.observableArray();

    self.addTrain = function (stop) {
        self.Trains.push(stop);
    };

    self.clearTrains = function () {
        self.Trains.removeAll();
    }
}

function TrainViewModel() {
    var self = this;

    self.Id = ko.observable();
    self.Headcode = ko.observable();
    self.ServiceCode = ko.observable();
    self.Activated = ko.observable();
    self.SchedOrigin = ko.observable();
    self.SchedDepart = ko.observable();
    self.Stops = ko.observableArray();
    self.LastUpdate = ko.observable();
    self.WttId = ko.observable();
    self.Cancellation = ko.observable();

    self.addStop = function (stopEl) {
        if (self.Stops().length == 0) {
            var stopModel = new StopViewModel();
            switch (stopEl.EventType.toLowerCase()) {
                case "arrival":
                    setArrival(stopEl, stopModel);
                    break;
                case "departure":
                    setDeparture(stopEl, stopModel);
                    break;
            }
            self.Stops.push(stopModel);
        } else {
            var stopModel = self.Stops()[self.Stops().length - 1];
            if (stopModel.Stanox() != stopEl.Stanox) {
                stopModel = new StopViewModel();
                self.Stops.push(stopModel);
            } 
            switch (stopEl.EventType.toLowerCase()) {
                case "arrival":
                    setArrival(stopEl, stopModel);
                    break;
                case "departure":
                    setDeparture(stopEl, stopModel);
                    break;
            }
        }
    };

    self.clearStops = function () {
        self.Stops.removeAll();
    }
}

function setArrival(stopEl, stopModel) {
    var times = getTimes(stopEl);

    stopModel.ArrivalActualTimeStamp(times.ActualTimeStamp);
    stopModel.ArrivalPlannedTime(times.PlannedTimeStamp);
    stopModel.ArrivalDelay(times.Delay);

    setCommon(stopEl, stopModel);
}

function setDeparture(stopEl, stopModel) {
    var times = getTimes(stopEl);

    stopModel.DepartActualTimeStamp (times.ActualTimeStamp);
    stopModel.DepartPlannedTime(times.PlannedTimeStamp);
    stopModel.DepartDelay(times.Delay);

    setCommon(stopEl, stopModel);
}

function setCommon(stopEl, stopModel) {
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
}

function getTimes(stopEl) {
    var setTimes = true;
    var result = {
        ActualTimeStamp: null,
        PlannedTimeStamp: null,
        Delay: 0
    };
    if (stopEl.ActualTimeStamp && stopEl.ActualTimeStamp.length > 0) {
        var actualTime = new Date(stopEl.ActualTimeStamp);
        result.ActualTimeStamp = moment(actualTime).format("HH:mm:ss");
    } else {
        result.ActualTimeStamp = "";
        setTimes = false;
    }

    if (stopEl.PlannedTime && stopEl.PlannedTime.length > 0) {
        var plannedTime = new Date(stopEl.PlannedTime);
    } else if (stopEl.ActualTimeStamp && stopEl.ActualTimeStamp.length > 0) {
        var plannedTime = new Date(stopEl.ActualTimeStamp);
    } else {
        result.PlannedTimeStamp = "";
        setTimes = false;
    }
    if (plannedTime)
        result.PlannedTimeStamp = moment(plannedTime).format("HH:mm:ss");

    if (setTimes) {
        result.Delay = ((actualTime - plannedTime) / 60000);
    }

    return result;
}

function StopViewModel() {
    var self = this;

    self.Stanox = ko.observable();
    self.ArrivalPlannedTime = ko.observable();
    self.ArrivalActualTimeStamp = ko.observable();
    self.DepartPlannedTime = ko.observable();
    self.DepartActualTimeStamp = ko.observable();
    self.Line = ko.observable();
    self.Platform = ko.observable();
    self.ArrivalDelay = ko.observable();
    self.DepartDelay = ko.observable();

    self.ArrivalDelayResult = ko.computed(function () {
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

    self.ArrivalDelayTitle = ko.computed(function () {
        if (self.ArrivalDelay() == 0)
            return "on time";
        if (self.ArrivalDelay() < 0)
            return "early";
        return "late";
    });

    self.DepartDelayResult = ko.computed(function () {
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

    self.DepartDelayTitle = ko.computed(function () {
        if (self.DepartDelay() == 0)
            return "on time";
        if (self.DepartDelay() < 0)
            return "early";
        return "late";
    });

    self.State = ko.observable();

    self.StateClass = ko.computed(function () {
        switch (self.State()) {
            case 1:
                return "warning";
                break;
            case 2:
                return "error";
                break;
            default:
                //case "Normal":
                return "";
        }
    });

    self.StateTitle = ko.computed(function () {
        switch (self.State()) {
            case 1:
                return "Terminated";
                break;
            case 2:
                return "Cancelled";
                break;
            default:
                //case "Normal":
                return "";
        }
    });
}