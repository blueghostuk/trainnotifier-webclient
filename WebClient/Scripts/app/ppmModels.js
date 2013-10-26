var TrainNotifier;
(function (TrainNotifier) {
    (function (KnockoutModels) {
        /// <reference path="global.ts" />
        /// <reference path="../typings/knockout/knockout.d.ts" />
        /// <reference path="../typings/moment/moment.d.ts" />
        (function (PPM) {
            var PPMRecord = (function () {
                function PPMRecord(stats) {
                    this.OnTime = ko.observable();
                    this.Late = ko.observable();
                    this.CancelVeryLate = ko.observable();
                    this.Total = ko.observable();
                    this.Timestamp = ko.observable();
                    this.OnTime(stats.OnTime);
                    this.Late(stats.Late);
                    this.CancelVeryLate(stats.CancelVeryLate);
                    this.Total(stats.Total);
                    this.Timestamp(moment(stats.Timestamp).format(TrainNotifier.DateTimeFormats.timeFormat));

                    var self = this;
                    this.PPM = ko.computed(function () {
                        if (self.OnTime() && self.Total()) {
                            return Math.round((self.OnTime() / self.Total()) * 100);
                        } else {
                            return null;
                        }
                    });
                }
                return PPMRecord;
            })();
            PPM.PPMRecord = PPMRecord;

            var PPMViewModel = (function () {
                function PPMViewModel(ppmModel, parent, createParent) {
                    if (typeof createParent === "undefined") { createParent = true; }
                    this.Operator = ko.observable();
                    this.Sector = ko.observable();
                    this.Code = ko.observable();
                    this.PPMData = ko.observableArray();
                    this.Regions = ko.observableArray();
                    if (ppmModel) {
                        this.Operator(ppmModel.Description);
                        this.Sector(ppmModel.SectorCode);
                        this.Code(ppmModel.OperatorCode);
                    }
                    if (parent) {
                        this.Parent = parent;
                    } else if (createParent) {
                        this.Parent = new PPMViewModel(null, null, false);
                    }
                    this.IsRegion = parent != null;

                    var self = this;
                    this.LatestPPM = ko.computed(function () {
                        if (self.PPMData().length > 0)
                            return self.PPMData()[self.PPMData().length - 1];

                        return {};
                    });
                    this.Id = ko.computed(function () {
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
                }
                PPMViewModel.prototype.updateStats = function (stats) {
                    this.PPMData.push(new PPMRecord(stats));
                };
                return PPMViewModel;
            })();
            PPM.PPMViewModel = PPMViewModel;
        })(KnockoutModels.PPM || (KnockoutModels.PPM = {}));
        var PPM = KnockoutModels.PPM;
    })(TrainNotifier.KnockoutModels || (TrainNotifier.KnockoutModels = {}));
    var KnockoutModels = TrainNotifier.KnockoutModels;
})(TrainNotifier || (TrainNotifier = {}));
