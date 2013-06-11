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
                    return self.crsCode() ? self.crsCode() : self.stanox() ? self.stanox() : "";
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
    })(TrainNotifier.KnockoutModels || (TrainNotifier.KnockoutModels = {}));
    var KnockoutModels = TrainNotifier.KnockoutModels;
})(TrainNotifier || (TrainNotifier = {}));
function PPMViewModel(ppmModel, parent) {
    var self = this;
    self.Operator = ko.observable(ppmModel ? ppmModel.Description : null);
    self.Sector = ko.observable(ppmModel ? ppmModel.SectorCode : null);
    self.Code = ko.observable(ppmModel ? ppmModel.OperatorCode : null);
    self.PPMData = ko.observableArray();
    self.Regions = ko.observableArray();
    self.Parent = (parent ? parent : ppmModel ? new PPMViewModel() : null);
    self.IsRegion = (parent ? true : false);
    self.LatestPPM = ko.computed(function () {
        if(self.PPMData().length > 0) {
            return self.PPMData()[self.PPMData().length - 1];
        }
        return {
        };
    });
    self.Id = ko.computed(function () {
        var id = "";
        if(!self.Code()) {
            id += "national-";
            if(self.Sector()) {
                id += self.Sector();
            } else {
                id += "all";
            }
        } else {
            id += self.Code() + "-";
            if(self.Sector()) {
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
        if(self.OnTime() && self.Total()) {
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
        if(TrainNotifier.Common.page && TrainNotifier.Common.page.pageTitle) {
            document.title = title + " - " + TrainNotifier.Common.page.pageTitle;
        }
    };
}
