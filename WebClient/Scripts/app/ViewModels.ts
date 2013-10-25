/// <reference path="global.ts" />
/// <reference path="../typings/knockout/knockout.d.ts" />
/// <reference path="../typings/moment/moment.d.ts" />

module TrainNotifier.KnockoutModels {

    export class CurrentLocation {
        public name = ko.observable();
        public crsCode = ko.observable();
        public stanox = ko.observable();
        public url: KnockoutComputed<string>;

        constructor(location?: IStationTiploc) {
            var self = this;
            this.update(location);
            this.url = ko.computed(function () {
                return self.crsCode() ? self.crsCode() : self.stanox() ? self.stanox() : "";
            });
        }

        update(location?: IStationTiploc) {
            if (location) {
                this.name(location.Description);
                this.crsCode(location.CRS);
                this.stanox(location.Stanox);
            } else {
                this.name(null);
                this.crsCode(null);
                this.stanox(null);
            }
        }
    }

    export class PPMRecord {
        public OnTime = ko.observable<number>();
        public Late = ko.observable<number>();
        public CancelVeryLate = ko.observable<number>();
        public Total = ko.observable<number>();
        public Timestamp = ko.observable<string>();
        public PPM: KnockoutComputed<number>;

        constructor(stats: IPPMData) {
            this.OnTime(stats.OnTime);
            this.Late(stats.Late);
            this.CancelVeryLate(stats.CancelVeryLate);
            this.Total(stats.Total);
            this.Timestamp(moment(stats.Timestamp).format(DateTimeFormats.timeFormat));

            var self = this;
            this.PPM = ko.computed(function () {
                if (self.OnTime() && self.Total()) {
                    return Math.round((self.OnTime() / self.Total()) * 100);
                } else {
                    return null;
                }
            });
        }
    }

    export class PPMViewModel {
        public Operator = ko.observable<string>();
        public Sector = ko.observable<string>();
        public Code = ko.observable<string>();
        public PPMData = ko.observableArray<PPMRecord>();
        public Regions = ko.observableArray<PPMViewModel>();
        public Parent: PPMViewModel;
        public IsRegion: boolean;
        public LatestPPM: KnockoutComputed<any>;
        public Id: KnockoutComputed<string>;

        constructor(ppmModel?: IPPMRegion, parent?: PPMViewModel, createParent : boolean = true) {
            if (ppmModel) {
                this.Operator(ppmModel.Description);
                this.Sector(ppmModel.SectorCode);
                this.Code(ppmModel.OperatorCode);
            }
            if (parent) {
                this.Parent = parent;
            } else if (createParent){
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

        updateStats(stats: IPPMData) {
            this.PPMData.push(new PPMRecord(stats));
        }
    }

    export class TitleViewModel {
        public From = ko.observable<string>();
        public To = ko.observable<string>();
        public DateRange = ko.observable<string>();
        public Text = ko.observable<string>();

        setTitle(title: string) {
            this.Text(title);
            if (TrainNotifier.Common.page && TrainNotifier.Common.page.pageTitle) {
                document.title = title + " - " + TrainNotifier.Common.page.pageTitle;
            }
        }
    }
}