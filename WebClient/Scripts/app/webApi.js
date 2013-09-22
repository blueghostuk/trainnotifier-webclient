/// <reference path="global.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/moment/moment.d.ts" />
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

        WebApi.prototype.getArgs = function () {
            return {
                apiName: this.serverSettings.apiName
            };
        };

        WebApi.prototype.getStations = function () {
            return $.getJSON(this.getBaseUrl() + "/Station/", this.getArgs());
        };

        WebApi.prototype.getStanox = function (stanox) {
            return $.getJSON(this.getBaseUrl() + "/Stanox/" + stanox);
        };

        WebApi.prototype.getStationByLocation = function (lat, lon) {
            return $.getJSON(this.getBaseUrl() + "/Station/GeoLookup", $.extend({}, this.getArgs(), {
                lat: lat,
                lon: lon
            }));
        };

        WebApi.prototype.getStanoxByCrsCode = function (crsCode) {
            return $.getJSON(this.getBaseUrl() + "/Stanox/?GetByCRS", $.extend({}, this.getArgs(), {
                crsCode: crsCode
            }));
        };

        WebApi.prototype.getTrainMovementByUid = function (uid, date) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/Uid/" + uid + "/" + date, this.getArgs());
        };

        WebApi.prototype.getTrainMovementById = function (id) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/" + id, this.getArgs());
        };

        WebApi.prototype.getTrainMovementAssociations = function (uid, date) {
            return $.getJSON(this.getBaseUrl() + "/Association/" + uid + "/" + date, this.getArgs());
        };

        WebApi.prototype.getTrainMovementsByHeadcode = function (headcode, date) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/Headcode/" + headcode + "/" + date, this.getArgs());
        };

        WebApi.prototype.getTrainMovementsTerminatingAtLocation = function (stanox, startDate, endDate) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/TerminatingAt/Location/" + stanox, $.extend({}, this.getArgs(), {
                startDate: startDate,
                endDate: endDate
            }));
        };

        WebApi.prototype.getTrainMovementsTerminatingAtStation = function (crsCode, startDate, endDate) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/TerminatingAt/Station/" + crsCode, $.extend({}, this.getArgs(), {
                startDate: startDate,
                endDate: endDate
            }));
        };

        WebApi.prototype.getTrainMovementsStartingAtLocation = function (stanox, startDate, endDate) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/StartingAt/Location/" + stanox, $.extend({}, this.getArgs(), {
                startDate: startDate,
                endDate: endDate
            }));
        };

        WebApi.prototype.getTrainMovementsStartingAtStation = function (crsCode, startDate, endDate) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/StartingAt/Station/" + crsCode, $.extend({}, this.getArgs(), {
                startDate: startDate,
                endDate: endDate
            }));
        };

        WebApi.prototype.getTrainMovementsCallingAtLocation = function (stanox, startDate, endDate) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/CallingAt/Location/" + stanox, $.extend({}, this.getArgs(), {
                startDate: startDate,
                endDate: endDate
            }));
        };

        WebApi.prototype.getTrainMovementsCallingAtStation = function (crsCode, startDate, endDate) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/CallingAt/Station/" + crsCode, $.extend({}, this.getArgs(), {
                startDate: startDate,
                endDate: endDate
            }));
        };

        WebApi.prototype.getTrainMovementsBetweenLocations = function (fromStanox, toStanox, startDate, endDate) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/Between/Location/" + fromStanox + "/" + toStanox, $.extend({}, this.getArgs(), {
                startDate: startDate,
                endDate: endDate
            }));
        };

        WebApi.prototype.getTrainMovementsBetweenStations = function (fromCrsCode, toCrsCode, startDate, endDate) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/Between/Station/" + fromCrsCode + "/" + toCrsCode, $.extend({}, this.getArgs(), {
                startDate: startDate,
                endDate: endDate
            }));
        };

        WebApi.prototype.getPPMData = function (operatorCode, name) {
            return $.getJSON(this.getBaseUrl() + "/PPM/", $.extend({}, this.getArgs(), {
                operatorCode: operatorCode,
                name: name
            }));
        };

        WebApi.prototype.getPPMOperatorRegions = function (operatorCode) {
            operatorCode = operatorCode || "";
            return $.getJSON(this.getBaseUrl() + "/PPM/" + operatorCode, this.getArgs());
        };

        WebApi.prototype.getPPMSectors = function () {
            return $.getJSON(this.getBaseUrl() + "/PPM/", this.getArgs());
        };

        WebApi.prototype.getBerthContents = function (berth) {
            return $.getJSON(this.getBaseUrl() + "/Td/Berth/" + berth, this.getArgs());
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

    (function (PowerTypeId) {
        PowerTypeId[PowerTypeId["D"] = 1] = "D";
        PowerTypeId[PowerTypeId["DEM"] = 2] = "DEM";
        PowerTypeId[PowerTypeId["DMU"] = 3] = "DMU";
        PowerTypeId[PowerTypeId["E"] = 4] = "E";
        PowerTypeId[PowerTypeId["ED"] = 5] = "ED";
        PowerTypeId[PowerTypeId["EML"] = 6] = "EML";
        PowerTypeId[PowerTypeId["EMU"] = 7] = "EMU";
        PowerTypeId[PowerTypeId["EPU"] = 8] = "EPU";
        PowerTypeId[PowerTypeId["HST"] = 9] = "HST";
        PowerTypeId[PowerTypeId["LDS"] = 10] = "LDS";
    })(TrainNotifier.PowerTypeId || (TrainNotifier.PowerTypeId = {}));
    var PowerTypeId = TrainNotifier.PowerTypeId;

    var PowerTypeLookup = (function () {
        function PowerTypeLookup() {
        }
        PowerTypeLookup.getPowerType = function (powerType) {
            if (!powerType)
                return null;

            switch (powerType) {
                case PowerTypeId.D:
                    return this._d;

                case PowerTypeId.DEM:
                    return this._dem;

                case PowerTypeId.DMU:
                    return this._dmu;

                case PowerTypeId.E:
                    return this._e;

                case PowerTypeId.ED:
                    return this._ed;

                case PowerTypeId.EML:
                    return this._eml;

                case PowerTypeId.EMU:
                    return this._emu;

                case PowerTypeId.EPU:
                    return this._epu;

                case PowerTypeId.HST:
                    return this._hst;

                case PowerTypeId.LDS:
                    return this._lds;
            }

            return null;
        };
        PowerTypeLookup._d = {
            PowerTypeId: PowerTypeId.D,
            Code: "D",
            Description: "Diesel Electric Multiple Unit"
        };
        PowerTypeLookup._dem = {
            PowerTypeId: PowerTypeId.DEM,
            Code: "DEM",
            Description: "Diesel Electric Multiple Unit"
        };
        PowerTypeLookup._dmu = {
            PowerTypeId: PowerTypeId.DMU,
            Code: "DMU",
            Description: "Diesel Mechanical Multiple Unit"
        };
        PowerTypeLookup._e = {
            PowerTypeId: PowerTypeId.E,
            Code: "E",
            Description: "Electric"
        };
        PowerTypeLookup._ed = {
            PowerTypeId: PowerTypeId.ED,
            Code: "ED",
            Description: "Electro-Diesel"
        };
        PowerTypeLookup._eml = {
            PowerTypeId: PowerTypeId.EML,
            Code: "EML",
            Description: "EMU plus D, E, ED locomotive"
        };
        PowerTypeLookup._emu = {
            PowerTypeId: PowerTypeId.EMU,
            Code: "EMU",
            Description: "Electric Multiple Unit"
        };
        PowerTypeLookup._epu = {
            PowerTypeId: PowerTypeId.EPU,
            Code: "EPU",
            Description: "Electric Parcels Unit"
        };
        PowerTypeLookup._hst = {
            PowerTypeId: PowerTypeId.HST,
            Code: "HST",
            Description: "High Speed Train"
        };
        PowerTypeLookup._lds = {
            PowerTypeId: PowerTypeId.LDS,
            Code: "LDS",
            Description: "Diesel Shunting Locomotive"
        };
        return PowerTypeLookup;
    })();
    TrainNotifier.PowerTypeLookup = PowerTypeLookup;

    (function (CategoryTypeId) {
        CategoryTypeId[CategoryTypeId["OL"] = 1] = "OL";
        CategoryTypeId[CategoryTypeId["OU"] = 2] = "OU";
        CategoryTypeId[CategoryTypeId["OO"] = 3] = "OO";
        CategoryTypeId[CategoryTypeId["OS"] = 4] = "OS";
        CategoryTypeId[CategoryTypeId["OW"] = 5] = "OW";
        CategoryTypeId[CategoryTypeId["XC"] = 6] = "XC";
        CategoryTypeId[CategoryTypeId["XD"] = 7] = "XD";
        CategoryTypeId[CategoryTypeId["XI"] = 8] = "XI";
        CategoryTypeId[CategoryTypeId["XR"] = 9] = "XR";
        CategoryTypeId[CategoryTypeId["XU"] = 10] = "XU";
        CategoryTypeId[CategoryTypeId["XX"] = 11] = "XX";
        CategoryTypeId[CategoryTypeId["XZ"] = 12] = "XZ";
        CategoryTypeId[CategoryTypeId["BR"] = 13] = "BR";
        CategoryTypeId[CategoryTypeId["BS"] = 14] = "BS";
        CategoryTypeId[CategoryTypeId["EE"] = 15] = "EE";
        CategoryTypeId[CategoryTypeId["EL"] = 16] = "EL";
        CategoryTypeId[CategoryTypeId["ES"] = 17] = "ES";
        CategoryTypeId[CategoryTypeId["JJ"] = 18] = "JJ";
        CategoryTypeId[CategoryTypeId["PM"] = 19] = "PM";
        CategoryTypeId[CategoryTypeId["PP"] = 20] = "PP";
        CategoryTypeId[CategoryTypeId["PV"] = 21] = "PV";
        CategoryTypeId[CategoryTypeId["DD"] = 22] = "DD";
        CategoryTypeId[CategoryTypeId["DH"] = 23] = "DH";
        CategoryTypeId[CategoryTypeId["DI"] = 24] = "DI";
        CategoryTypeId[CategoryTypeId["DQ"] = 25] = "DQ";
        CategoryTypeId[CategoryTypeId["DT"] = 26] = "DT";
        CategoryTypeId[CategoryTypeId["DY"] = 27] = "DY";
        CategoryTypeId[CategoryTypeId["ZB"] = 28] = "ZB";
        CategoryTypeId[CategoryTypeId["ZZ"] = 29] = "ZZ";
        CategoryTypeId[CategoryTypeId["J2"] = 30] = "J2";
        CategoryTypeId[CategoryTypeId["H2"] = 31] = "H2";
        CategoryTypeId[CategoryTypeId["J3"] = 32] = "J3";
        CategoryTypeId[CategoryTypeId["J4"] = 33] = "J4";
        CategoryTypeId[CategoryTypeId["J5"] = 34] = "J5";
        CategoryTypeId[CategoryTypeId["J6"] = 35] = "J6";
        CategoryTypeId[CategoryTypeId["J8"] = 36] = "J8";
        CategoryTypeId[CategoryTypeId["H8"] = 37] = "H8";
        CategoryTypeId[CategoryTypeId["J9"] = 38] = "J9";
        CategoryTypeId[CategoryTypeId["H9"] = 39] = "H9";
        CategoryTypeId[CategoryTypeId["A0"] = 40] = "A0";
        CategoryTypeId[CategoryTypeId["E0"] = 41] = "E0";
        CategoryTypeId[CategoryTypeId["B0"] = 42] = "B0";
        CategoryTypeId[CategoryTypeId["B1"] = 43] = "B1";
        CategoryTypeId[CategoryTypeId["B4"] = 44] = "B4";
        CategoryTypeId[CategoryTypeId["B5"] = 45] = "B5";
        CategoryTypeId[CategoryTypeId["B6"] = 46] = "B6";
        CategoryTypeId[CategoryTypeId["B7"] = 47] = "B7";
        CategoryTypeId[CategoryTypeId["H0"] = 48] = "H0";
        CategoryTypeId[CategoryTypeId["H1"] = 49] = "H1";
        CategoryTypeId[CategoryTypeId["H3"] = 50] = "H3";
        CategoryTypeId[CategoryTypeId["H4"] = 51] = "H4";
        CategoryTypeId[CategoryTypeId["H5"] = 52] = "H5";
        CategoryTypeId[CategoryTypeId["H6"] = 53] = "H6";
    })(TrainNotifier.CategoryTypeId || (TrainNotifier.CategoryTypeId = {}));
    var CategoryTypeId = TrainNotifier.CategoryTypeId;

    var CategoryTypeLookup = (function () {
        function CategoryTypeLookup() {
        }
        CategoryTypeLookup.getCategoryType = function (categoryType) {
            if (!categoryType)
                return null;

            switch (categoryType) {
                case CategoryTypeId.OL:
                    return this._ol;
                case CategoryTypeId.OU:
                    return this._ou;
                case CategoryTypeId.OO:
                    return this._oo;
                case CategoryTypeId.OS:
                    return this._os;
                case CategoryTypeId.OW:
                    return this._ow;
                case CategoryTypeId.XC:
                    return this._xc;
                case CategoryTypeId.XD:
                    return this._xd;
                case CategoryTypeId.XI:
                    return this._xi;
                case CategoryTypeId.XR:
                    return this._xr;
                case CategoryTypeId.XU:
                    return this._xu;
                case CategoryTypeId.XX:
                    return this._xx;
                case CategoryTypeId.XZ:
                    return this._xz;
                case CategoryTypeId.BR:
                    return this._br;
                case CategoryTypeId.BS:
                    return this._bs;
                case CategoryTypeId.EE:
                    return this._ee;
                case CategoryTypeId.EL:
                    return this._el;
                case CategoryTypeId.ES:
                    return this._es;
                case CategoryTypeId.JJ:
                    return this._jj;
                case CategoryTypeId.PM:
                    return this._pm;
                case CategoryTypeId.PP:
                    return this._pp;
                case CategoryTypeId.PV:
                    return this._pv;
                case CategoryTypeId.DD:
                    return this._dd;
                case CategoryTypeId.DH:
                    return this._dh;
                case CategoryTypeId.DI:
                    return this._di;
                case CategoryTypeId.DQ:
                    return this._dq;
                case CategoryTypeId.DT:
                    return this._dt;
                case CategoryTypeId.DY:
                    return this._dy;
                case CategoryTypeId.ZB:
                    return this._zb;
                case CategoryTypeId.ZZ:
                    return this._zz;
                case CategoryTypeId.J2:
                    return this._j2;
                case CategoryTypeId.H2:
                    return this._h2;
                case CategoryTypeId.J3:
                    return this._j3;
                case CategoryTypeId.J4:
                    return this._j4;
                case CategoryTypeId.J5:
                    return this._j5;
                case CategoryTypeId.J6:
                    return this._j6;
                case CategoryTypeId.J8:
                    return this._j8;
                case CategoryTypeId.H8:
                    return this._h8;
                case CategoryTypeId.J9:
                    return this._j9;
                case CategoryTypeId.H9:
                    return this._h9;
                case CategoryTypeId.A0:
                    return this._a0;
                case CategoryTypeId.E0:
                    return this._e0;
                case CategoryTypeId.B0:
                    return this._b0;
                case CategoryTypeId.B1:
                    return this._b1;
                case CategoryTypeId.B4:
                    return this._b4;
                case CategoryTypeId.B5:
                    return this._b5;
                case CategoryTypeId.B6:
                    return this._b6;
                case CategoryTypeId.B7:
                    return this._b7;
                case CategoryTypeId.H0:
                    return this._h0;
                case CategoryTypeId.H1:
                    return this._h1;
                case CategoryTypeId.H3:
                    return this._h3;
                case CategoryTypeId.H4:
                    return this._h4;
                case CategoryTypeId.H5:
                    return this._h5;
                case CategoryTypeId.H6:
                    return this._h6;
            }

            return null;
        };
        CategoryTypeLookup._ol = { CategoryTypeId: CategoryTypeId.OL, Code: "OL", Description: "London Underground/Metro Service" };
        CategoryTypeLookup._ou = { CategoryTypeId: CategoryTypeId.OU, Code: "OU", Description: "Unadvertised Ordinary Passenger" };
        CategoryTypeLookup._oo = { CategoryTypeId: CategoryTypeId.OO, Code: "OO", Description: "Ordinary Passenger" };
        CategoryTypeLookup._os = { CategoryTypeId: CategoryTypeId.OS, Code: "OS", Description: "Staff Train" };
        CategoryTypeLookup._ow = { CategoryTypeId: CategoryTypeId.OW, Code: "OW", Description: "Mixed" };
        CategoryTypeLookup._xc = { CategoryTypeId: CategoryTypeId.XC, Code: "XC", Description: "Channel Tunnel" };
        CategoryTypeLookup._xd = { CategoryTypeId: CategoryTypeId.XD, Code: "XD", Description: "Sleeper (Europe Night Services)" };
        CategoryTypeLookup._xi = { CategoryTypeId: CategoryTypeId.XI, Code: "XI", Description: "International" };
        CategoryTypeLookup._xr = { CategoryTypeId: CategoryTypeId.XR, Code: "XR", Description: "Motorail" };
        CategoryTypeLookup._xu = { CategoryTypeId: CategoryTypeId.XU, Code: "XU", Description: "Unadvertised Express" };
        CategoryTypeLookup._xx = { CategoryTypeId: CategoryTypeId.XX, Code: "XX", Description: "Express Passenger" };
        CategoryTypeLookup._xz = { CategoryTypeId: CategoryTypeId.XZ, Code: "XZ", Description: "Sleeper (Domestic)" };
        CategoryTypeLookup._br = { CategoryTypeId: CategoryTypeId.BR, Code: "BR", Description: "Bus � Replacement due to engineering work" };
        CategoryTypeLookup._bs = { CategoryTypeId: CategoryTypeId.BS, Code: "BS", Description: "Bus � WTT Service" };
        CategoryTypeLookup._ee = { CategoryTypeId: CategoryTypeId.EE, Code: "EE", Description: "Empty Coaching Stock (ECS)" };
        CategoryTypeLookup._el = { CategoryTypeId: CategoryTypeId.EL, Code: "EL", Description: "ECS, London Underground/Metro Service" };
        CategoryTypeLookup._es = { CategoryTypeId: CategoryTypeId.ES, Code: "ES", Description: "ECS & Staff" };
        CategoryTypeLookup._jj = { CategoryTypeId: CategoryTypeId.JJ, Code: "JJ", Description: "Postal" };
        CategoryTypeLookup._pm = { CategoryTypeId: CategoryTypeId.PM, Code: "PM", Description: "Post Office Controlled Parcels" };
        CategoryTypeLookup._pp = { CategoryTypeId: CategoryTypeId.PP, Code: "PP", Description: "Parcels" };
        CategoryTypeLookup._pv = { CategoryTypeId: CategoryTypeId.PV, Code: "PV", Description: "Empty NPCCS" };
        CategoryTypeLookup._dd = { CategoryTypeId: CategoryTypeId.DD, Code: "DD", Description: "Departmental" };
        CategoryTypeLookup._dh = { CategoryTypeId: CategoryTypeId.DH, Code: "DH", Description: "Civil Engineer" };
        CategoryTypeLookup._di = { CategoryTypeId: CategoryTypeId.DI, Code: "DI", Description: "Mechanical & Electrical Engineer" };
        CategoryTypeLookup._dq = { CategoryTypeId: CategoryTypeId.DQ, Code: "DQ", Description: "Stores" };
        CategoryTypeLookup._dt = { CategoryTypeId: CategoryTypeId.DT, Code: "DT", Description: "Test" };
        CategoryTypeLookup._dy = { CategoryTypeId: CategoryTypeId.DY, Code: "DY", Description: "Signal & Telecommunications Engineer" };
        CategoryTypeLookup._zb = { CategoryTypeId: CategoryTypeId.ZB, Code: "ZB", Description: "Locomotive & Brake Van" };
        CategoryTypeLookup._zz = { CategoryTypeId: CategoryTypeId.ZZ, Code: "ZZ", Description: "Light Locomotive" };
        CategoryTypeLookup._j2 = { CategoryTypeId: CategoryTypeId.J2, Code: "J2", Description: "RfD Automotive (Components)" };
        CategoryTypeLookup._h2 = { CategoryTypeId: CategoryTypeId.H2, Code: "H2", Description: "RfD Automotive (Vehicles)" };
        CategoryTypeLookup._j3 = { CategoryTypeId: CategoryTypeId.J3, Code: "J3", Description: "RfD Edible Products (UK Contracts)" };
        CategoryTypeLookup._j4 = { CategoryTypeId: CategoryTypeId.J4, Code: "J4", Description: "RfD Industrial Minerals (UK Contracts)" };
        CategoryTypeLookup._j5 = { CategoryTypeId: CategoryTypeId.J5, Code: "J5", Description: "RfD Chemicals (UK Contracts)" };
        CategoryTypeLookup._j6 = { CategoryTypeId: CategoryTypeId.J6, Code: "J6", Description: "RfD Building Materials (UK Contracts)" };
        CategoryTypeLookup._j8 = { CategoryTypeId: CategoryTypeId.J8, Code: "J8", Description: "RfD General Merchandise (UK Contracts)" };
        CategoryTypeLookup._h8 = { CategoryTypeId: CategoryTypeId.H8, Code: "H8", Description: "RfD European" };
        CategoryTypeLookup._j9 = { CategoryTypeId: CategoryTypeId.J9, Code: "J9", Description: "RfD Freightliner (Contracts)" };
        CategoryTypeLookup._h9 = { CategoryTypeId: CategoryTypeId.H9, Code: "H9", Description: "RfD Freightliner (Other)" };
        CategoryTypeLookup._a0 = { CategoryTypeId: CategoryTypeId.A0, Code: "A0", Description: "Coal (Distributive)" };
        CategoryTypeLookup._e0 = { CategoryTypeId: CategoryTypeId.E0, Code: "E0", Description: "Coal (Electricity) MGR" };
        CategoryTypeLookup._b0 = { CategoryTypeId: CategoryTypeId.B0, Code: "B0", Description: "Coal (Other) and Nuclear" };
        CategoryTypeLookup._b1 = { CategoryTypeId: CategoryTypeId.B1, Code: "B1", Description: "Metals" };
        CategoryTypeLookup._b4 = { CategoryTypeId: CategoryTypeId.B4, Code: "B4", Description: "Aggregates" };
        CategoryTypeLookup._b5 = { CategoryTypeId: CategoryTypeId.B5, Code: "B5", Description: "Domestic and Industrial Waste" };
        CategoryTypeLookup._b6 = { CategoryTypeId: CategoryTypeId.B6, Code: "B6", Description: "Building Materials (TLF)" };
        CategoryTypeLookup._b7 = { CategoryTypeId: CategoryTypeId.B7, Code: "B7", Description: "Petroleum Products" };
        CategoryTypeLookup._h0 = { CategoryTypeId: CategoryTypeId.H0, Code: "H0", Description: "RfD European Channel Tunnel (Mixed Business)" };
        CategoryTypeLookup._h1 = { CategoryTypeId: CategoryTypeId.H1, Code: "H1", Description: "RfD European Channel Tunnel Intermodal" };
        CategoryTypeLookup._h3 = { CategoryTypeId: CategoryTypeId.H3, Code: "H3", Description: "RfD European Channel Tunnel Automotive" };
        CategoryTypeLookup._h4 = { CategoryTypeId: CategoryTypeId.H4, Code: "H4", Description: "RfD European Channel Tunnel Contract Services" };
        CategoryTypeLookup._h5 = { CategoryTypeId: CategoryTypeId.H5, Code: "H5", Description: "RfD European Channel Tunnel Haulmark" };
        CategoryTypeLookup._h6 = { CategoryTypeId: CategoryTypeId.H6, Code: "H6", Description: "RfD European Channel Tunnel Joint Venture" };
        return CategoryTypeLookup;
    })();
    TrainNotifier.CategoryTypeLookup = CategoryTypeLookup;
})(TrainNotifier || (TrainNotifier = {}));
