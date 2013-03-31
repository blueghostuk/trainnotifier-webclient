/// <reference path="moment.js" />
/// <reference path="knockout-2.2.0.js" />

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

function TrainTitleViewModel() {
    var self = this;

    self.Id = ko.observable();
    self.From = ko.observable();
    self.To = ko.observable();
    self.Start = ko.observable();
    self.End = ko.observable();
}

function ScheduleTrainViewModel(currentLocation) {
    var self = this;

    var timeFormat = "HH:mm:ss";
    var dateFormat = "DD/MM/YY HH:mm:ss";

    self.CurrentLocation = currentLocation;

    self.Activated = ko.observable();
    self.AtocCode = new AtocCodeViewModel();
    self.Cancellation = ko.observable();
    self.ChangeOfOrigin = ko.observable();
    self.Reinstatement = ko.observable();
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
    self.Associations = ko.observableArray();

    self.addStop = function (stop) {
        self.Stops.push(new ScheduleStopViewModel(stop));
    };

    self.clearStops = function () {
        self.Stops.removeAll();
    }

    self.addAssociation = function (assoc, trainUid, date) {
        self.Associations.push(new TrainAssociation(assoc, trainUid, date));
    };

    self.clearAssociations = function () {
        self.Associations.removeAll();
    }

    self.updateFromJson = function (schedule, liveData) {
        self.clearStops();

        self.updateActivated(liveData.Activated);
        self.AtocCode.updateFromJson(schedule ? schedule.AtocCode : null);
        if (liveData.Cancellation) {
            var canxTxt = liveData.Cancellation.Type;
            if (liveData.Cancellation.CancelledAt)
                canxTxt += " @ " + liveData.Cancellation.CancelledAt.Description;
            canxTxt += " @ " + moment(liveData.Cancellation.CancelledTimestamp).format(timeFormat)
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
                        + " @ " + moment(liveData.ChangeOfOrigin.NewDepartureTime).format(timeFormat);
            if (liveData.ChangeOfOrigin.ReasonCode) {
                originText += " (" + liveData.ChangeOfOrigin.ReasonCode + ": " + liveData.ChangeOfOrigin.Description + ")";
            }
            self.ChangeOfOrigin(originText);
        } else {
            self.ChangeOfOrigin(null);
        }
        if (liveData.Reinstatement) {
            self.Reinstatement(liveData.Reinstatement.NewOrigin.Description + " @ "
                + moment(liveData.Reinstatement.PlannedDepartureTime).format(timeFormat));
        } else {
            self.Reinstatement(null);
        }
        self.Destination.updateFromJson(schedule ? schedule.Destination : null);
        self.EndDateValue(schedule ? moment(schedule.EndDate).format(dateFormat) : null);
        self.Headcode(liveData.HeadCode);
        self.Id(liveData.Id);
        self.Origin.updateFromJson(schedule ? schedule.Origin : null);
        self.updateRuns(schedule ? schedule.Schedule : null);
        self.STPValue(schedule ? self.getSTPValue(schedule.STPIndicator) : null);
        self.ServiceCode(liveData.ServiceCode);
        self.StartDateValue(schedule ? moment(schedule.StartDate).format(dateFormat) : null);
        self.LastUpdate(moment().format(dateFormat));
        self.TrainUid(schedule ? schedule.TrainUid : liveData.TrainUid);

        if (schedule && schedule.Stops) {
            for (var stop in schedule.Stops) {
                self.addStop(schedule.Stops[stop]);
            }
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
    }
}

var scheduleResultsMode = {
    Origin : 1,
    Terminate : 2
};

function ScheduleSearchResults() {
    var self = this;

    self.Mode = scheduleResultsMode.Origin;

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

    self.ViewCommand = ko.computed(function () {
        var date = _date;
        switch (self.DateType()) {
            case 1:
                date.subtract('days', 1);
                break;
            case 2:
                data.add('days', 1);
                break;
        }
        return self.getTrain() + "#" + date.format("YYYY-MM-DD");
    });
}

function LiveTrainViewModel() {
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
    self.ChangeOfOrigin = ko.observable();
    self.Reinstatement = ko.observable();

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
                    if (stopEl.OffRoute) {
                        stopModel.OffRoute("Off Route.");
                    }
                    break;
                case "departure":
                    setDeparture(stopEl, stopModel);

                    if (stopEl.OffRoute) {
                        stopModel.OffRoute("Off Route.");
                    }
                    if (stopEl.NextStanox && stopEl.NextStanox.length > 0) {
                        stopModel.NextStanox(stopEl.NextStanox);
                    }
                    if (stopEl.ExpectedAtNextStanox && stopEl.ExpectedAtNextStanox.length > 0) {
                        stopModel.ExpectedAtNextStanox(moment(stopEl.ExpectedAtNextStanox, "HH:mm:ss").format("mm:ss"));
                    }
                    break;
            }
        }
    };

    self.clearStops = function () {
        self.Stops.removeAll();
    }

    self.updateFromJSON = function (data) {
        self.clearStops();
        self.Id(data.Id);
        self.Headcode(data.HeadCode);
        self.ServiceCode(data.ServiceCode);
        var activated = "";
        if (data.Activated) {
            activated = moment(data.Activated).format(dateFormat);
        }
        self.Activated(activated);
        if (data.WorkingTTId && data.WorkingTTId.length > 0) {
            self.WttId(data.WorkingTTId.substring(0, data.WorkingTTId.length - 1));
        } else {
            self.WttId('');
        }

        self.SchedOrigin(data.SchedOriginStanox);
        var schedDepart = "";
        if (data.SchedOriginDeparture) {
            schedDepart = moment(data.SchedOriginDeparture).format(dateFormat);
        }
        self.SchedDepart(schedDepart);
        self.LastUpdate(moment().format(dateFormat));

        if (data.Cancellation) {
            var canxTxt = data.Cancellation.Type;
            if (data.Cancellation.CancelledAt)
                canxTxt += " @ " + data.Cancellation.CancelledAt.Description;
            canxTxt += " @ " + moment(data.Cancellation.CancelledTimestamp).format(timeFormat)
                + " - Reason: ";
            if (data.Cancellation.Description) {
                canxTxt += data.Cancellation.Description;
            }
            canxTxt += " (" + data.Cancellation.ReasonCode + ")";
            self.Cancellation(canxTxt);
        } else {
            self.Cancellation(null);
        }
        if (data.ChangeOfOrigin) {
            var originText = data.ChangeOfOrigin.NewOrigin.Description
                        + " @ " + moment(data.ChangeOfOrigin.NewDepartureTime).format(timeFormat);
            if (data.ChangeOfOrigin.ReasonCode) {
                originText += " (" + data.ChangeOfOrigin.ReasonCode + ": " + data.ChangeOfOrigin.Description + ")";
            }
            self.ChangeOfOrigin(originText);
        } else {
            self.ChangeOfOrigin(null);
        }
        if (data.Reinstatement) {
            self.Reinstatement(data.Reinstatement.NewOrigin.Description + " @ "
                + moment(data.Reinstatement.PlannedDepartureTime).format(timeFormat));
        } else {
            self.Reinstatement(null);
        }
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

    stopModel.DepartActualTimeStamp(times.ActualTimeStamp);
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
    self.NextStanox = ko.observable();
    self.ExpectedAtNextStanox = ko.observable();
    self.OffRoute = ko.observable();

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