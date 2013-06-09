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


    // TODO: implement in new model
    //self.updateFromJson = function (schedule, liveData) {
    //    self.updateActivated(liveData.Activated);
    //    self.AtocCode.updateFromJson(schedule ? schedule.AtocCode : null);
    //    if (liveData.Cancellation) {
    //        var canxTxt = liveData.Cancellation.Type;
    //        if (liveData.Cancellation.CancelledAt)
    //            canxTxt += " @ " + liveData.Cancellation.CancelledAt.Description;
    //        canxTxt += " @ " + moment(liveData.Cancellation.CancelledTimestamp).format(TrainNotifier.DateTimeFormats.timeFormat)
    //            + " - Reason: ";
    //        if (liveData.Cancellation.Description) {
    //            canxTxt += liveData.Cancellation.Description;
    //        }
    //        canxTxt += " (" + liveData.Cancellation.ReasonCode + ")";
    //        self.Cancellation(canxTxt);
    //    } else {
    //        self.Cancellation(null);
    //    }
    //    if (liveData.ChangeOfOrigin) {
    //        var originText = liveData.ChangeOfOrigin.NewOrigin.Description
    //                    + " @ " + moment(liveData.ChangeOfOrigin.NewDepartureTime).format(TrainNotifier.DateTimeFormats.timeFormat);
    //        if (liveData.ChangeOfOrigin.ReasonCode) {
    //            originText += " (" + liveData.ChangeOfOrigin.ReasonCode + ": " + liveData.ChangeOfOrigin.Description + ")";
    //        }
    //        self.ChangeOfOrigin(originText);
    //    } else {
    //        self.ChangeOfOrigin(null);
    //    }
    //    if (liveData.Reinstatement) {
    //        self.Reinstatement(liveData.Reinstatement.NewOrigin.Description + " @ "
    //            + moment(liveData.Reinstatement.PlannedDepartureTime).format(TrainNotifier.DateTimeFormats.timeFormat));
    //    } else {
    //        self.Reinstatement(null);
    //    }

// TODO: to implement in new model
//function TrainAssociation(association, trainUid, date) {
//    var self = this;
//    var _trainUid = trainUid;
//    var _date = date;

//    self.AssocTrainUid = ko.observable(association.AssocTrainUid);
//    self.AssociationType = ko.observable(association.AssociationType);
//    self.DateType = ko.observable(association.DateType);
//    self.EndDate = ko.observable(association.EndDate);
//    self.Location = new TiplocViewModel(association.Location);
//    self.MainTrainUid = ko.observable(association.MainTrainUid);
//    self.StartDate = ko.observable(association.StartDate);

//    self.Title = ko.computed(function () {
//        switch (self.AssociationType()) {
//            case 0:
//                if (self.MainTrainUid() == _trainUid)
//                    return "Forms Next Train:";
//                else
//                    return "Formed of Train";
//            case 1:
//                return "Joins with Train:";
//            case 2:
//                return "Splits from Train:";
//            default:
//                return "";
//        }
//    });

//    self.getTrain = function () {
//        if (self.MainTrainUid() == _trainUid)
//            return self.AssocTrainUid();
//        else
//            return self.MainTrainUid();
//    };

//    self.Train = ko.computed(function () {
//        return self.getTrain();
//    });

//    self.View = ko.computed(function () {
//        var date = _date;
//        switch (self.DateType()) {
//            case 1:
//                date.subtract('days', 1);
//                break;
//            case 2:
//                date.add('days', 1);
//                break;
//        }
//        return self.getTrain() + "/" + date.format("YYYY-MM-DD");
//    });

//    self.Link = ko.computed(function () {
//        var date = _date;
//        switch (self.DateType()) {
//            case 1:
//                date.subtract('days', 1);
//                break;
//            case 2:
//                date.add('days', 1);
//                break;
//        }
//        return self.getTrain() + "/" + date.format("YYYY/MM/DD");
//    });
//}