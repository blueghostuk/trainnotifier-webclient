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
        result.ActualTimeStamp = moment(stopEl.ActualTimeStamp).format("HH:mm:ss");
    } else {
        result.ActualTimeStamp = "";
        setTimes = false;
    }

    if (stopEl.PlannedTime && stopEl.PlannedTime.length > 0) {
        var plannedTime = new Date(stopEl.PlannedTime);
        result.PlannedTimeStamp = moment(stopEl.PlannedTime).format("HH:mm:ss");
    } else if (stopEl.ActualTimeStamp && stopEl.ActualTimeStamp.length > 0) {
        result.PlannedTimeStamp = moment(stopEl.ActualTimeStamp).format("HH:mm:ss");
    } else {
        result.PlannedTimeStamp = "";
        setTimes = false;
    }

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
            return "label-success";
        if (self.ArrivalDelay() < 0)
            return "label-info";
        if (self.ArrivalDelay() > 10)
            return "label-important";
        if (self.ArrivalDelay() > 0)
            return "label-warning";

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
            return "label-success";
        if (self.DepartDelay() < 0)
            return "label-info";
        if (self.DepartDelay() > 10)
            return "label-important";
        if (self.DepartDelay() > 0)
            return "label-warning";

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