var TrainNotifier;
(function (TrainNotifier) {
    var WebApi = (function () {
        function WebApi(serverSettings) {
            this.serverSettings = serverSettings;
            if (!serverSettings) {
                this.serverSettings = TrainNotifier.Common.serverSettings;
            }
        }
        WebApi.prototype.getBaseUrl = function () {
            return "http://" + this.serverSettings.apiUrl;
        };

        WebApi.prototype.getStations = function () {
            return $.getJSON(this.getBaseUrl() + "/Station/");
        };

        WebApi.prototype.getStanox = function (stanox) {
            return $.getJSON(this.getBaseUrl() + "/Stanox/" + stanox);
        };

        WebApi.prototype.getStationByLocation = function (lat, lon) {
            return $.getJSON(this.getBaseUrl() + "/Station/GeoLookup", {
                lat: lat,
                lon: lon
            });
        };

        WebApi.prototype.getStanoxByCrsCode = function (crsCode) {
            return $.getJSON(this.getBaseUrl() + "/Stanox/?GetByCRS&crsCode=" + crsCode);
        };

        WebApi.prototype.getTrainMovementByUid = function (uid, date) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/Uid/" + uid + "/" + date);
        };

        WebApi.prototype.getTrainMovementById = function (id) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/" + id);
        };

        WebApi.prototype.getTrainMovementAssociations = function (uid, date) {
            return $.getJSON(this.getBaseUrl() + "/Association/" + uid + "/" + date);
        };

        WebApi.prototype.getTrainMovementsTerminatingAtLocation = function (stanox, startDate, endDate) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/TerminatingAt/Location/" + stanox, {
                startDate: startDate,
                endDate: endDate
            });
        };

        WebApi.prototype.getTrainMovementsTerminatingAtStation = function (crsCode, startDate, endDate) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/TerminatingAt/Station/" + crsCode, {
                startDate: startDate,
                endDate: endDate
            });
        };

        WebApi.prototype.getTrainMovementsStartingAtLocation = function (stanox, startDate, endDate) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/StartingAt/Location/" + stanox, {
                startDate: startDate,
                endDate: endDate
            });
        };

        WebApi.prototype.getTrainMovementsStartingAtStation = function (crsCode, startDate, endDate) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/StartingAt/Station/" + crsCode, {
                startDate: startDate,
                endDate: endDate
            });
        };

        WebApi.prototype.getTrainMovementsCallingAtLocation = function (stanox, startDate, endDate) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/CallingAt/Location/" + stanox, {
                startDate: startDate,
                endDate: endDate
            });
        };

        WebApi.prototype.getTrainMovementsCallingAtStation = function (crsCode, startDate, endDate) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/CallingAt/Station/" + crsCode, {
                startDate: startDate,
                endDate: endDate
            });
        };

        WebApi.prototype.getTrainMovementsBetweenLocations = function (fromStanox, toStanox, startDate, endDate) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/Between/Location/" + fromStanox + "/" + toStanox, {
                startDate: startDate,
                endDate: endDate
            });
        };

        WebApi.prototype.getTrainMovementsBetweenStations = function (fromCrsCode, toCrsCode, startDate, endDate) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/Between/Station/" + fromCrsCode + "/" + toCrsCode, {
                startDate: startDate,
                endDate: endDate
            });
        };

        WebApi.prototype.getPPMData = function (operatorCode, name) {
            return $.getJSON(this.getBaseUrl() + "/PPM/", {
                operatorCode: operatorCode,
                name: name
            });
        };

        WebApi.prototype.getPPMOperatorRegions = function (operatorCode) {
            operatorCode = operatorCode || "";
            return $.getJSON(this.getBaseUrl() + "/PPM/" + operatorCode);
        };

        WebApi.prototype.getPPMSectors = function () {
            return $.getJSON(this.getBaseUrl() + "/PPM/");
        };
        return WebApi;
    })();
    TrainNotifier.WebApi = WebApi;
})(TrainNotifier || (TrainNotifier = {}));

var TrainNotifier;
(function (TrainNotifier) {
    (function (EventType) {
        EventType[EventType["Departure"] = 1] = "Departure";

        EventType[EventType["Arrival"] = 2] = "Arrival";
    })(TrainNotifier.EventType || (TrainNotifier.EventType = {}));
    var EventType = TrainNotifier.EventType;

    (function (TrainState) {
        TrainState[TrainState["Activated"] = 1] = "Activated";
        TrainState[TrainState["Cancelled"] = 2] = "Cancelled";
        TrainState[TrainState["ActivatedAndCancelled"] = 3] = "ActivatedAndCancelled";
        TrainState[TrainState["Terminated"] = 4] = "Terminated";

        TrainState[TrainState["ActivatedAndTerminated"] = 5] = "ActivatedAndTerminated";
    })(TrainNotifier.TrainState || (TrainNotifier.TrainState = {}));
    var TrainState = TrainNotifier.TrainState;

    (function (AssociationType) {
        AssociationType[AssociationType["NextTrain"] = 0] = "NextTrain";
        AssociationType[AssociationType["Join"] = 1] = "Join";

        AssociationType[AssociationType["Split"] = 2] = "Split";
    })(TrainNotifier.AssociationType || (TrainNotifier.AssociationType = {}));
    var AssociationType = TrainNotifier.AssociationType;

    (function (AssociationDateType) {
        AssociationDateType[AssociationDateType["SameDay"] = 0] = "SameDay";
        AssociationDateType[AssociationDateType["PreviousDay"] = 1] = "PreviousDay";

        AssociationDateType[AssociationDateType["NextDay"] = 2] = "NextDay";
    })(TrainNotifier.AssociationDateType || (TrainNotifier.AssociationDateType = {}));
    var AssociationDateType = TrainNotifier.AssociationDateType;

    var ScheduleStatus = (function () {
        function ScheduleStatus() {
        }
        ScheduleStatus.getScheduleStatus = function (scheduleStatusId) {
            switch (scheduleStatusId) {
                case ScheduleStatus.Bus.StatusId:
                    return ScheduleStatus.Bus;
                case ScheduleStatus.Freight.StatusId:
                    return ScheduleStatus.Freight;
                case ScheduleStatus.PassengerAndParcels.StatusId:
                    return ScheduleStatus.PassengerAndParcels;
                case ScheduleStatus.Ship.StatusId:
                    return ScheduleStatus.Ship;
                case ScheduleStatus.Trip.StatusId:
                    return ScheduleStatus.Trip;
                case ScheduleStatus.STPPassengerAndParcels.StatusId:
                    return ScheduleStatus.STPPassengerAndParcels;
                case ScheduleStatus.STPFreight.StatusId:
                    return ScheduleStatus.STPFreight;
                case ScheduleStatus.STPTrip.StatusId:
                    return ScheduleStatus.STPTrip;
                case ScheduleStatus.STPShip.StatusId:
                    return ScheduleStatus.STPShip;
                case ScheduleStatus.STPBus.StatusId:
                    return ScheduleStatus.STPBus;
                default:
                    return null;
            }
        };
        ScheduleStatus.Bus = {
            StatusId: 1,
            Code: 'B',
            Name: 'Bus'
        };
        ScheduleStatus.Freight = {
            StatusId: 2,
            Code: 'F',
            Name: 'Freight'
        };
        ScheduleStatus.PassengerAndParcels = {
            StatusId: 3,
            Code: 'P',
            Name: 'Passenger And Parcels'
        };
        ScheduleStatus.Ship = {
            StatusId: 4,
            Code: 'S',
            Name: 'Ship'
        };
        ScheduleStatus.Trip = {
            StatusId: 5,
            Code: 'T',
            Name: 'Trip'
        };
        ScheduleStatus.STPPassengerAndParcels = {
            StatusId: 6,
            Code: '1',
            Name: 'STP Passenger And Parcels'
        };
        ScheduleStatus.STPFreight = {
            StatusId: 7,
            Code: '2',
            Name: 'STP Freight'
        };
        ScheduleStatus.STPTrip = {
            StatusId: 8,
            Code: '3',
            Name: 'STP Trip'
        };
        ScheduleStatus.STPShip = {
            StatusId: 9,
            Code: '4',
            Name: 'STP Ship'
        };
        ScheduleStatus.STPBus = {
            StatusId: 10,
            Code: '5',
            Name: 'STP Bus'
        };
        return ScheduleStatus;
    })();
    TrainNotifier.ScheduleStatus = ScheduleStatus;

    var CancellationCodes = (function () {
        function CancellationCodes() {
        }
        CancellationCodes.EnRoute = "EN ROUTE";
        return CancellationCodes;
    })();
    TrainNotifier.CancellationCodes = CancellationCodes;

    var STPIndicator = (function () {
        function STPIndicator() {
        }
        STPIndicator.getSTPIndicator = function (stpIndicatorId) {
            switch (stpIndicatorId) {
                case STPIndicator.Cancellation.STPIndicatorId:
                    return STPIndicator.Cancellation;
                case STPIndicator.STP.STPIndicatorId:
                    return STPIndicator.STP;
                case STPIndicator.Overlay.STPIndicatorId:
                    return STPIndicator.Overlay;
                case STPIndicator.Permanent.STPIndicatorId:
                    return STPIndicator.Permanent;
                default:
                    return null;
            }
        };
        STPIndicator.Cancellation = {
            STPIndicatorId: 1,
            Code: 'C',
            Description: 'Cancellation Of Permanent Schedule'
        };
        STPIndicator.STP = {
            STPIndicatorId: 2,
            Code: 'N',
            Description: 'STP'
        };
        STPIndicator.Overlay = {
            STPIndicatorId: 3,
            Code: 'O',
            Description: 'Overlay'
        };
        STPIndicator.Permanent = {
            STPIndicatorId: 4,
            Code: 'P',
            Description: 'Permanent'
        };
        return STPIndicator;
    })();
    TrainNotifier.STPIndicator = STPIndicator;

    var StationTiploc = (function () {
        function StationTiploc() {
        }
        StationTiploc.findStationTiplocs = function (stanoxCode, tiplocs) {
            return tiplocs.filter(function (element) {
                return element.Stanox == stanoxCode;
            });
        };
        StationTiploc.findStationTiploc = function (stanoxCode, tiplocs) {
            var results = StationTiploc.findStationTiplocs(stanoxCode, tiplocs);
            if (results && results.length > 0)
                return results[0];
            return null;
        };
        return StationTiploc;
    })();
    TrainNotifier.StationTiploc = StationTiploc;

    var RunningTrainEstimater = (function () {
        function RunningTrainEstimater() {
        }
        RunningTrainEstimater.estimateTrainTimes = function (trainMovement) {
            if (trainMovement.Schedule && trainMovement.Schedule.Stops && trainMovement.Schedule.Stops.length > 0) {
                var currentDelay = 0;
                if (trainMovement.Actual && trainMovement.Actual.Stops && trainMovement.Actual.Stops.length > 0) {
                    var lastStop = trainMovement.Actual.Stops[trainMovement.Actual.Stops.length - 1];
                    currentDelay = moment(lastStop.ActualTimestamp).diff(moment(lastStop.PlannedTimestamp), 'minutes');
                }

                trainMovement.Schedule.Stops.forEach(function (stop) {
                    var estimate = RunningTrainEstimater.estimateTimes(stop, currentDelay);
                    currentDelay = estimate.CurrentDelay;
                });
            }
        };

        RunningTrainEstimater.estimateTimes = function (scheduleStop, currentDelay) {
            if (typeof currentDelay === "undefined") { currentDelay = 0; }
            var arrival, pubArrival, departure, pubDeparture, pass;

            if (currentDelay > 0) {
                if (scheduleStop.EngineeringAllowance) {
                    currentDelay -= scheduleStop.EngineeringAllowance;
                }
                if (scheduleStop.PathingAllowance) {
                    currentDelay -= scheduleStop.PathingAllowance;
                }
                if (scheduleStop.PerformanceAllowance) {
                    currentDelay -= scheduleStop.PerformanceAllowance;
                }
            }
            if (currentDelay < 0) {
                currentDelay = 0;
            }

            if (scheduleStop.Arrival) {
                arrival = moment(scheduleStop.Arrival, TrainNotifier.DateTimeFormats.timeFormat);
                arrival = arrival.add({ minutes: currentDelay });
            }
            if (scheduleStop.PublicArrival) {
                pubArrival = moment(scheduleStop.PublicArrival, TrainNotifier.DateTimeFormats.timeFormat);
                pubArrival = pubArrival.add({ minutes: currentDelay });
            }

            if (scheduleStop.Departure) {
                departure = moment(scheduleStop.Departure, TrainNotifier.DateTimeFormats.timeFormat);
                departure = departure.add({ minutes: currentDelay });
            }
            if (scheduleStop.PublicDeparture) {
                pubDeparture = moment(scheduleStop.PublicDeparture, TrainNotifier.DateTimeFormats.timeFormat);
                pubDeparture = pubDeparture.add({ minutes: currentDelay });
            }
            if (scheduleStop.Pass) {
                pass = moment(scheduleStop.Pass, TrainNotifier.DateTimeFormats.timeFormat);
                pass = pass.add({ minutes: currentDelay });
            }

            scheduleStop.Estimate = {
                Arrival: arrival,
                PublicArrival: pubArrival,
                Departure: departure,
                PublicDeparture: pubDeparture,
                Pass: pass,
                CurrentDelay: currentDelay
            };
            return scheduleStop.Estimate;
        };
        return RunningTrainEstimater;
    })();
    TrainNotifier.RunningTrainEstimater = RunningTrainEstimater;
})(TrainNotifier || (TrainNotifier = {}));
