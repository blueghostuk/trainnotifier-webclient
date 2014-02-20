
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
                returnTiplocs: !this.serverSettings.useLocalStorage,
                apiName: this.serverSettings.apiName
            };
        };

        WebApi.prototype.getTrainMovementResults = function (results) {
            if (this.serverSettings.useLocalStorage) {
                return $.when(this.getStations(), results).then(function (stations, trainMovementResults) {
                    var trainMovement = trainMovementResults[0];
                    trainMovement.Tiplocs = stations;
                    return $.Deferred().resolve(trainMovement).promise();
                });
            } else {
                return results;
            }
        };

        WebApi.prototype.getTrainMovementResult = function (results) {
            if (this.serverSettings.useLocalStorage) {
                return $.when(this.getStations(), results).then(function (stations, trainMovementResults) {
                    var trainMovement = trainMovementResults[0];
                    trainMovement.Tiplocs = stations;
                    return $.Deferred().resolve(trainMovement).promise();
                });
            } else {
                return results;
            }
        };

        WebApi.prototype.getStations = function () {
            return this.getTiplocs();
        };

        WebApi.prototype.getTiplocs = function () {
            if (this.serverSettings.useLocalStorage) {
                var stations = localStorage.getItem(WebApi.tiplocsLocalStorageKey);
                if (stations) {
                    return $.Deferred().resolve(JSON.parse(stations)).promise();
                } else {
                    return $.getJSON(this.getBaseUrl() + "/Stanox/", this.getArgs()).done(function (stations) {
                        localStorage.setItem(WebApi.tiplocsLocalStorageKey, JSON.stringify(stations));
                        return $.Deferred().resolve(stations).promise();
                    });
                }
            }
            return $.getJSON(this.getBaseUrl() + "/Station/", this.getArgs());
        };

        WebApi.prototype.getStanox = function (stanox) {
            if (this.serverSettings.useLocalStorage) {
                stanox = stanox.toLowerCase();
                return this.getTiplocs().then(function (stations) {
                    var filtered = stations.filter(function (s) {
                        return s.Stanox != null && s.Stanox.toLowerCase() == stanox;
                    });
                    return $.Deferred().resolve(filtered).promise();
                });
            }
            return $.getJSON(this.getBaseUrl() + "/Stanox/" + stanox);
        };

        WebApi.prototype.getStationByLocation = function (lat, lon, limit) {
            if (typeof limit === "undefined") { limit = 5; }
            return $.getJSON(this.getBaseUrl() + "/Station/GeoLookup", $.extend({}, this.getArgs(), {
                lat: lat,
                lon: lon,
                limit: limit
            }));
        };

        WebApi.prototype.getStanoxByCrsCode = function (crsCode) {
            return $.getJSON(this.getBaseUrl() + "/Stanox/Single/" + crsCode, this.getArgs());
        };

        WebApi.prototype.getAllStanoxByCrsCode = function (crsCode) {
            if (this.serverSettings.useLocalStorage) {
                crsCode = crsCode.toLowerCase();
                return this.getStations().then(function (stations) {
                    var filtered = stations.filter(function (s) {
                        return s.CRS != null && s.CRS.toLowerCase() == crsCode;
                    });
                    return $.Deferred().resolve(filtered).promise();
                });
            }
            return $.getJSON(this.getBaseUrl() + "/Stanox/Find/" + crsCode, this.getArgs());
        };

        WebApi.prototype.getTrainMovementByUid = function (uid, date) {
            return this.getTrainMovementResult($.getJSON(this.getBaseUrl() + "/TrainMovement/Uid/" + uid + "/" + date, this.getArgs()));
        };

        WebApi.prototype.getTrainMovementById = function (id) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/" + id, this.getArgs());
        };

        WebApi.prototype.getTrainMovementAssociations = function (uid, date) {
            return $.getJSON(this.getBaseUrl() + "/Association/" + uid + "/" + date, this.getArgs());
        };

        WebApi.prototype.getTrainMovementsByHeadcode = function (headcode, date) {
            return this.getTrainMovementResults($.getJSON(this.getBaseUrl() + "/TrainMovement/Headcode/" + headcode + "/" + date, this.getArgs()));
        };

        WebApi.prototype.getTrainMovementsTerminatingAtLocation = function (stanox, startDate, endDate, atocCode) {
            return this.getTrainMovementResults($.getJSON(this.getBaseUrl() + "/TrainMovement/TerminatingAt/Location/" + stanox, $.extend({}, this.getArgs(), {
                startDate: startDate,
                endDate: endDate,
                atocCode: atocCode
            })));
        };

        WebApi.prototype.getTrainMovementsTerminatingAtStation = function (crsCode, startDate, endDate, atocCode) {
            return this.getTrainMovementResults($.getJSON(this.getBaseUrl() + "/TrainMovement/TerminatingAt/Station/" + crsCode, $.extend({}, this.getArgs(), {
                startDate: startDate,
                endDate: endDate,
                atocCode: atocCode
            })));
        };

        WebApi.prototype.getTrainMovementsNearLocation = function (lat, lon, limit) {
            if (typeof limit === "undefined") { limit = 10; }
            return this.getTrainMovementResults($.getJSON(this.getBaseUrl() + "/TrainMovement/Nearest/", $.extend({}, this.getArgs(), {
                lat: lat,
                lon: lon,
                limit: limit
            })));
        };

        WebApi.prototype.getTrainMovementsCallingAtLocation = function (stanox, startDate, endDate, atocCode) {
            return this.getTrainMovementResults($.getJSON(this.getBaseUrl() + "/TrainMovement/CallingAt/Location/" + stanox, $.extend({}, this.getArgs(), {
                startDate: startDate,
                endDate: endDate,
                atocCode: atocCode
            })));
        };

        WebApi.prototype.getTrainMovementsCallingAtStation = function (crsCode, startDate, endDate, atocCode) {
            return this.getTrainMovementResults($.getJSON(this.getBaseUrl() + "/TrainMovement/CallingAt/Station/" + crsCode, $.extend({}, this.getArgs(), {
                startDate: startDate,
                endDate: endDate,
                atocCode: atocCode
            })));
        };

        WebApi.prototype.getTrainMovementsBetweenLocations = function (fromStanox, toStanox, startDate, endDate, atocCode) {
            return this.getTrainMovementResults($.getJSON(this.getBaseUrl() + "/TrainMovement/Between/Location/" + fromStanox + "/" + toStanox, $.extend({}, this.getArgs(), {
                startDate: startDate,
                endDate: endDate,
                atocCode: atocCode
            })));
        };

        WebApi.prototype.getTrainMovementsBetweenStations = function (fromCrsCode, toCrsCode, startDate, endDate, atocCode) {
            return this.getTrainMovementResults($.getJSON(this.getBaseUrl() + "/TrainMovement/Between/Station/" + fromCrsCode + "/" + toCrsCode, $.extend({}, this.getArgs(), {
                startDate: startDate,
                endDate: endDate,
                atocCode: atocCode
            })));
        };

        WebApi.prototype.getTrainMovementsStartingAtStation = function (crsCode, startDate, endDate, atocCode) {
            return this.getTrainMovementResults($.getJSON(this.getBaseUrl() + "/TrainMovement/StartingAt/Station/" + crsCode, $.extend({}, this.getArgs(), {
                startDate: startDate,
                endDate: endDate,
                atocCode: atocCode
            })));
        };

        WebApi.prototype.getTrainMovementsStartingAtLocation = function (stanox, startDate, endDate, atocCode) {
            return this.getTrainMovementResults($.getJSON(this.getBaseUrl() + "/TrainMovement/StartingAt/Location/" + stanox, $.extend({}, this.getArgs(), {
                startDate: startDate,
                endDate: endDate,
                atocCode: atocCode
            })));
        };

        WebApi.prototype.getTrainMovementLink = function (headcode, crsCode, platform) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/Headcode/" + headcode + "/" + crsCode + "/" + platform + "/", this.getArgs());
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
        WebApi.tiplocsLocalStorageKey = "tn-tiplocs";
        return WebApi;
    })();
    TrainNotifier.WebApi = WebApi;
})(TrainNotifier || (TrainNotifier = {}));

var TrainNotifier;
(function (TrainNotifier) {
    (function (LiveTrainStopSource) {
        LiveTrainStopSource[LiveTrainStopSource["Trust"] = 0] = "Trust";
        LiveTrainStopSource[LiveTrainStopSource["TD"] = 1] = "TD";
    })(TrainNotifier.LiveTrainStopSource || (TrainNotifier.LiveTrainStopSource = {}));
    var LiveTrainStopSource = TrainNotifier.LiveTrainStopSource;

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

    (function (STPIndicatorValue) {
        STPIndicatorValue[STPIndicatorValue["Cancellation"] = 1] = "Cancellation";
        STPIndicatorValue[STPIndicatorValue["STP"] = 2] = "STP";
        STPIndicatorValue[STPIndicatorValue["Overlay"] = 3] = "Overlay";
        STPIndicatorValue[STPIndicatorValue["Permanent"] = 4] = "Permanent";
    })(TrainNotifier.STPIndicatorValue || (TrainNotifier.STPIndicatorValue = {}));
    var STPIndicatorValue = TrainNotifier.STPIndicatorValue;

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
            STPIndicatorId: 1 /* Cancellation */,
            Code: 'C',
            Description: 'Cancellation Of Permanent Schedule'
        };
        STPIndicator.STP = {
            STPIndicatorId: 2 /* STP */,
            Code: 'N',
            Description: 'STP'
        };
        STPIndicator.Overlay = {
            STPIndicatorId: 3 /* Overlay */,
            Code: 'O',
            Description: 'Overlay'
        };
        STPIndicator.Permanent = {
            STPIndicatorId: 4 /* Permanent */,
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
        StationTiploc.stationTiplocMatches = function (tiploc, tiplocs) {
            return tiplocs.some(function (t) {
                return t.CRS == tiploc.CRS || t.Stanox == tiploc.Stanox;
            });
        };
        StationTiploc.toDisplayString = function (tiploc, lowercase) {
            if (typeof lowercase === "undefined") { lowercase = true; }
            var value = (tiploc.StationName && tiploc.StationName.length > 0 ? tiploc.StationName : tiploc.Description && tiploc.Description.length > 0 ? tiploc.Description : tiploc.Tiploc);
            if (lowercase)
                return value.toLowerCase();
            return value;
        };
        return StationTiploc;
    })();
    TrainNotifier.StationTiploc = StationTiploc;

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
                case 1 /* D */:
                    return this._d;

                case 2 /* DEM */:
                    return this._dem;

                case 3 /* DMU */:
                    return this._dmu;

                case 4 /* E */:
                    return this._e;

                case 5 /* ED */:
                    return this._ed;

                case 6 /* EML */:
                    return this._eml;

                case 7 /* EMU */:
                    return this._emu;

                case 8 /* EPU */:
                    return this._epu;

                case 9 /* HST */:
                    return this._hst;

                case 10 /* LDS */:
                    return this._lds;
            }

            return null;
        };
        PowerTypeLookup._d = {
            PowerTypeId: 1 /* D */,
            Code: "D",
            Description: "Diesel Electric Multiple Unit"
        };
        PowerTypeLookup._dem = {
            PowerTypeId: 2 /* DEM */,
            Code: "DEM",
            Description: "Diesel Electric Multiple Unit"
        };
        PowerTypeLookup._dmu = {
            PowerTypeId: 3 /* DMU */,
            Code: "DMU",
            Description: "Diesel Mechanical Multiple Unit"
        };
        PowerTypeLookup._e = {
            PowerTypeId: 4 /* E */,
            Code: "E",
            Description: "Electric"
        };
        PowerTypeLookup._ed = {
            PowerTypeId: 5 /* ED */,
            Code: "ED",
            Description: "Electro-Diesel"
        };
        PowerTypeLookup._eml = {
            PowerTypeId: 6 /* EML */,
            Code: "EML",
            Description: "EMU plus D, E, ED locomotive"
        };
        PowerTypeLookup._emu = {
            PowerTypeId: 7 /* EMU */,
            Code: "EMU",
            Description: "Electric Multiple Unit"
        };
        PowerTypeLookup._epu = {
            PowerTypeId: 8 /* EPU */,
            Code: "EPU",
            Description: "Electric Parcels Unit"
        };
        PowerTypeLookup._hst = {
            PowerTypeId: 9 /* HST */,
            Code: "HST",
            Description: "High Speed Train"
        };
        PowerTypeLookup._lds = {
            PowerTypeId: 10 /* LDS */,
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
                case 1 /* OL */:
                    return this._ol;
                case 2 /* OU */:
                    return this._ou;
                case 3 /* OO */:
                    return this._oo;
                case 4 /* OS */:
                    return this._os;
                case 5 /* OW */:
                    return this._ow;
                case 6 /* XC */:
                    return this._xc;
                case 7 /* XD */:
                    return this._xd;
                case 8 /* XI */:
                    return this._xi;
                case 9 /* XR */:
                    return this._xr;
                case 10 /* XU */:
                    return this._xu;
                case 11 /* XX */:
                    return this._xx;
                case 12 /* XZ */:
                    return this._xz;
                case 13 /* BR */:
                    return this._br;
                case 14 /* BS */:
                    return this._bs;
                case 15 /* EE */:
                    return this._ee;
                case 16 /* EL */:
                    return this._el;
                case 17 /* ES */:
                    return this._es;
                case 18 /* JJ */:
                    return this._jj;
                case 19 /* PM */:
                    return this._pm;
                case 20 /* PP */:
                    return this._pp;
                case 21 /* PV */:
                    return this._pv;
                case 22 /* DD */:
                    return this._dd;
                case 23 /* DH */:
                    return this._dh;
                case 24 /* DI */:
                    return this._di;
                case 25 /* DQ */:
                    return this._dq;
                case 26 /* DT */:
                    return this._dt;
                case 27 /* DY */:
                    return this._dy;
                case 28 /* ZB */:
                    return this._zb;
                case 29 /* ZZ */:
                    return this._zz;
                case 30 /* J2 */:
                    return this._j2;
                case 31 /* H2 */:
                    return this._h2;
                case 32 /* J3 */:
                    return this._j3;
                case 33 /* J4 */:
                    return this._j4;
                case 34 /* J5 */:
                    return this._j5;
                case 35 /* J6 */:
                    return this._j6;
                case 36 /* J8 */:
                    return this._j8;
                case 37 /* H8 */:
                    return this._h8;
                case 38 /* J9 */:
                    return this._j9;
                case 39 /* H9 */:
                    return this._h9;
                case 40 /* A0 */:
                    return this._a0;
                case 41 /* E0 */:
                    return this._e0;
                case 42 /* B0 */:
                    return this._b0;
                case 43 /* B1 */:
                    return this._b1;
                case 44 /* B4 */:
                    return this._b4;
                case 45 /* B5 */:
                    return this._b5;
                case 46 /* B6 */:
                    return this._b6;
                case 47 /* B7 */:
                    return this._b7;
                case 48 /* H0 */:
                    return this._h0;
                case 49 /* H1 */:
                    return this._h1;
                case 50 /* H3 */:
                    return this._h3;
                case 51 /* H4 */:
                    return this._h4;
                case 52 /* H5 */:
                    return this._h5;
                case 53 /* H6 */:
                    return this._h6;
            }

            return null;
        };
        CategoryTypeLookup._ol = { CategoryTypeId: 1 /* OL */, Code: "OL", Description: "London Underground/Metro Service" };
        CategoryTypeLookup._ou = { CategoryTypeId: 2 /* OU */, Code: "OU", Description: "Unadvertised Ordinary Passenger" };
        CategoryTypeLookup._oo = { CategoryTypeId: 3 /* OO */, Code: "OO", Description: "Ordinary Passenger" };
        CategoryTypeLookup._os = { CategoryTypeId: 4 /* OS */, Code: "OS", Description: "Staff Train" };
        CategoryTypeLookup._ow = { CategoryTypeId: 5 /* OW */, Code: "OW", Description: "Mixed" };
        CategoryTypeLookup._xc = { CategoryTypeId: 6 /* XC */, Code: "XC", Description: "Channel Tunnel" };
        CategoryTypeLookup._xd = { CategoryTypeId: 7 /* XD */, Code: "XD", Description: "Sleeper (Europe Night Services)" };
        CategoryTypeLookup._xi = { CategoryTypeId: 8 /* XI */, Code: "XI", Description: "International" };
        CategoryTypeLookup._xr = { CategoryTypeId: 9 /* XR */, Code: "XR", Description: "Motorail" };
        CategoryTypeLookup._xu = { CategoryTypeId: 10 /* XU */, Code: "XU", Description: "Unadvertised Express" };
        CategoryTypeLookup._xx = { CategoryTypeId: 11 /* XX */, Code: "XX", Description: "Express Passenger" };
        CategoryTypeLookup._xz = { CategoryTypeId: 12 /* XZ */, Code: "XZ", Description: "Sleeper (Domestic)" };
        CategoryTypeLookup._br = { CategoryTypeId: 13 /* BR */, Code: "BR", Description: "Bus Replacement due to engineering work" };
        CategoryTypeLookup._bs = { CategoryTypeId: 14 /* BS */, Code: "BS", Description: "Bus WTT Service" };
        CategoryTypeLookup._ee = { CategoryTypeId: 15 /* EE */, Code: "EE", Description: "Empty Coaching Stock (ECS)" };
        CategoryTypeLookup._el = { CategoryTypeId: 16 /* EL */, Code: "EL", Description: "ECS, London Underground/Metro Service" };
        CategoryTypeLookup._es = { CategoryTypeId: 17 /* ES */, Code: "ES", Description: "ECS & Staff" };
        CategoryTypeLookup._jj = { CategoryTypeId: 18 /* JJ */, Code: "JJ", Description: "Postal" };
        CategoryTypeLookup._pm = { CategoryTypeId: 19 /* PM */, Code: "PM", Description: "Post Office Controlled Parcels" };
        CategoryTypeLookup._pp = { CategoryTypeId: 20 /* PP */, Code: "PP", Description: "Parcels" };
        CategoryTypeLookup._pv = { CategoryTypeId: 21 /* PV */, Code: "PV", Description: "Empty NPCCS" };
        CategoryTypeLookup._dd = { CategoryTypeId: 22 /* DD */, Code: "DD", Description: "Departmental" };
        CategoryTypeLookup._dh = { CategoryTypeId: 23 /* DH */, Code: "DH", Description: "Civil Engineer" };
        CategoryTypeLookup._di = { CategoryTypeId: 24 /* DI */, Code: "DI", Description: "Mechanical & Electrical Engineer" };
        CategoryTypeLookup._dq = { CategoryTypeId: 25 /* DQ */, Code: "DQ", Description: "Stores" };
        CategoryTypeLookup._dt = { CategoryTypeId: 26 /* DT */, Code: "DT", Description: "Test" };
        CategoryTypeLookup._dy = { CategoryTypeId: 27 /* DY */, Code: "DY", Description: "Signal & Telecommunications Engineer" };
        CategoryTypeLookup._zb = { CategoryTypeId: 28 /* ZB */, Code: "ZB", Description: "Locomotive & Brake Van" };
        CategoryTypeLookup._zz = { CategoryTypeId: 29 /* ZZ */, Code: "ZZ", Description: "Light Locomotive" };
        CategoryTypeLookup._j2 = { CategoryTypeId: 30 /* J2 */, Code: "J2", Description: "RfD Automotive (Components)" };
        CategoryTypeLookup._h2 = { CategoryTypeId: 31 /* H2 */, Code: "H2", Description: "RfD Automotive (Vehicles)" };
        CategoryTypeLookup._j3 = { CategoryTypeId: 32 /* J3 */, Code: "J3", Description: "RfD Edible Products (UK Contracts)" };
        CategoryTypeLookup._j4 = { CategoryTypeId: 33 /* J4 */, Code: "J4", Description: "RfD Industrial Minerals (UK Contracts)" };
        CategoryTypeLookup._j5 = { CategoryTypeId: 34 /* J5 */, Code: "J5", Description: "RfD Chemicals (UK Contracts)" };
        CategoryTypeLookup._j6 = { CategoryTypeId: 35 /* J6 */, Code: "J6", Description: "RfD Building Materials (UK Contracts)" };
        CategoryTypeLookup._j8 = { CategoryTypeId: 36 /* J8 */, Code: "J8", Description: "RfD General Merchandise (UK Contracts)" };
        CategoryTypeLookup._h8 = { CategoryTypeId: 37 /* H8 */, Code: "H8", Description: "RfD European" };
        CategoryTypeLookup._j9 = { CategoryTypeId: 38 /* J9 */, Code: "J9", Description: "RfD Freightliner (Contracts)" };
        CategoryTypeLookup._h9 = { CategoryTypeId: 39 /* H9 */, Code: "H9", Description: "RfD Freightliner (Other)" };
        CategoryTypeLookup._a0 = { CategoryTypeId: 40 /* A0 */, Code: "A0", Description: "Coal (Distributive)" };
        CategoryTypeLookup._e0 = { CategoryTypeId: 41 /* E0 */, Code: "E0", Description: "Coal (Electricity) MGR" };
        CategoryTypeLookup._b0 = { CategoryTypeId: 42 /* B0 */, Code: "B0", Description: "Coal (Other) and Nuclear" };
        CategoryTypeLookup._b1 = { CategoryTypeId: 43 /* B1 */, Code: "B1", Description: "Metals" };
        CategoryTypeLookup._b4 = { CategoryTypeId: 44 /* B4 */, Code: "B4", Description: "Aggregates" };
        CategoryTypeLookup._b5 = { CategoryTypeId: 45 /* B5 */, Code: "B5", Description: "Domestic and Industrial Waste" };
        CategoryTypeLookup._b6 = { CategoryTypeId: 46 /* B6 */, Code: "B6", Description: "Building Materials (TLF)" };
        CategoryTypeLookup._b7 = { CategoryTypeId: 47 /* B7 */, Code: "B7", Description: "Petroleum Products" };
        CategoryTypeLookup._h0 = { CategoryTypeId: 48 /* H0 */, Code: "H0", Description: "RfD European Channel Tunnel (Mixed Business)" };
        CategoryTypeLookup._h1 = { CategoryTypeId: 49 /* H1 */, Code: "H1", Description: "RfD European Channel Tunnel Intermodal" };
        CategoryTypeLookup._h3 = { CategoryTypeId: 50 /* H3 */, Code: "H3", Description: "RfD European Channel Tunnel Automotive" };
        CategoryTypeLookup._h4 = { CategoryTypeId: 51 /* H4 */, Code: "H4", Description: "RfD European Channel Tunnel Contract Services" };
        CategoryTypeLookup._h5 = { CategoryTypeId: 52 /* H5 */, Code: "H5", Description: "RfD European Channel Tunnel Haulmark" };
        CategoryTypeLookup._h6 = { CategoryTypeId: 53 /* H6 */, Code: "H6", Description: "RfD European Channel Tunnel Joint Venture" };
        return CategoryTypeLookup;
    })();
    TrainNotifier.CategoryTypeLookup = CategoryTypeLookup;
})(TrainNotifier || (TrainNotifier = {}));
