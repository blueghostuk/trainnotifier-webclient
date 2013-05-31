var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var TrainNotifier;
(function (TrainNotifier) {
    (function (KnockoutModels) {
        var TrainMovement = (function () {
            function TrainMovement(trainMovement, tiplocs) {
                this.operatorCode = "NA";
                this.operatorName = "Unknown";
                this.trainId = trainMovement.Schedule.TrainUid;
                if(trainMovement.Schedule.AtocCode) {
                    this.operatorCode = trainMovement.Schedule.AtocCode.Code;
                    this.operatorName = trainMovement.Schedule.AtocCode.Name;
                }
                if(trainMovement.Actual) {
                    this.headCode = trainMovement.Actual.HeadCode;
                } else {
                    this.headCode = this.trainId;
                }
            }
            return TrainMovement;
        })();
        KnockoutModels.TrainMovement = TrainMovement;        
        var StartingAtTrainMovement = (function (_super) {
            __extends(StartingAtTrainMovement, _super);
            function StartingAtTrainMovement(trainMovement, tiplocs) {
                        _super.call(this, trainMovement, tiplocs);
                this.publicDeparture = "";
                this.actualDeparture = "";
                this.publicArrival = "";
                this.actualArrival = "";
                this.departureDate = "";
                var toStop;
                if(trainMovement.Actual && trainMovement.Actual.OriginDepartTimestamp) {
                    this.departureDate = moment(trainMovement.Actual.OriginDepartTimestamp).format(TrainNotifier.DateTimeFormats.dateUrlFormat);
                }
                if(trainMovement.Schedule.Stops.length > 0) {
                    var fromStop = trainMovement.Schedule.Stops[0];
                    var fromTiploc = TrainNotifier.StationTiploc.findStationTiploc(fromStop.TiplocStanoxCode, tiplocs);
                    if(fromTiploc) {
                        this.fromStation = fromTiploc.Description.toLowerCase();
                    }
                    this.fromPlatform = fromStop.Platform;
                    this.publicDeparture = TrainNotifier.DateTimeFormats.formatTimeString(fromStop.PublicDeparture);
                    this.wttDeparture = TrainNotifier.DateTimeFormats.formatTimeString(fromStop.Departure);
                    toStop = trainMovement.Schedule.Stops[trainMovement.Schedule.Stops.length - 1];
                    var toTiploc = TrainNotifier.StationTiploc.findStationTiploc(toStop.TiplocStanoxCode, tiplocs);
                    if(toTiploc) {
                        this.toStation = toTiploc.Description.toLowerCase();
                    }
                    this.toPlatform = toStop.Platform;
                    this.publicArrival = TrainNotifier.DateTimeFormats.formatTimeString(toStop.PublicArrival);
                    this.wttArrival = TrainNotifier.DateTimeFormats.formatTimeString(toStop.Arrival);
                }
                if(trainMovement.Actual && trainMovement.Actual.Stops.length > 0) {
                    var fromActual = trainMovement.Actual.Stops[0];
                    this.actualDeparture = TrainNotifier.DateTimeFormats.formatDateTimeString(fromActual.ActualTimestamp);
                    if(toStop) {
                        var lastActual = trainMovement.Actual.Stops[trainMovement.Actual.Stops.length - 1];
                        if(lastActual.ScheduleStopNumber == toStop.StopNumber && lastActual.EventType == TrainNotifier.EventType.Arrival && lastActual.TiplocStanoxCode == toStop.TiplocStanoxCode) {
                            this.actualArrival = TrainNotifier.DateTimeFormats.formatDateTimeString(lastActual.ActualTimestamp);
                        }
                    }
                }
            }
            return StartingAtTrainMovement;
        })(TrainMovement);
        KnockoutModels.StartingAtTrainMovement = StartingAtTrainMovement;        
    })(TrainNotifier.KnockoutModels || (TrainNotifier.KnockoutModels = {}));
    var KnockoutModels = TrainNotifier.KnockoutModels;
})(TrainNotifier || (TrainNotifier = {}));
