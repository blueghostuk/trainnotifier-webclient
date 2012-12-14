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

function WttSearchResult() {
    var self = this;

    self.TrainId = ko.observable();
    self.TrainUid = ko.observable();
    self.Headcode = ko.observable();
    self.WttId = ko.observable();
    self.From = ko.observable();
    self.Depart = ko.observable();
    self.To = ko.observable();
    self.Arrive = ko.observableArray();

    self.addStop = function (stop) {
        self.Stops.push(stop);
    };

    self.clearStops = function () {
        self.Stops.removeAll();
    }
}

function WttSearchResults() {
    var self = this;

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

    self.addStop = function (stop) {
        self.Stops.push(stop);
    };

    self.clearStops = function () {
        self.Stops.removeAll();
    }
}

function StopViewModel() {
    var self = this;

    self.Stanox = ko.observable();
    self.PlannedTime = ko.observable();
    self.ActualTimeStamp = ko.observable();
    self.EventType = ko.observable();
    self.Line = ko.observable();
    self.Platform = ko.observable();
    self.Delay = ko.observable();

    self.DelayResult = ko.computed(function () {
        if (this.Delay() == 0)
            return "label-success";
        if (this.Delay() < 0)
            return "label-info";
        if (this.Delay() > 10)
            return "label-important";

        return "label-warning";
    }, self);

    self.DelayTitle = ko.computed(function () {
        if (this.Delay() == 0)
            return "on time";
        if (this.Delay() < 0)
            return "early";
        return "late";
    }, self);

    self.State = ko.observable();

    self.StateClass = ko.computed(function () {
        switch (this.State()) {
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
    }, self);

    self.StateTitle = ko.computed(function () {
        switch (this.State()) {
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
    }, self);
}