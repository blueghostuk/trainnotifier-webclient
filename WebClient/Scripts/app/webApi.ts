/// <reference path="global.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />
/// <reference path="../typings/moment/moment.d.ts" />

interface IWebApi {
    getStanox(stanox: string): JQueryPromise<any>;
    getStanoxByCrsCode(crsCode: string): JQueryPromise<any>;

    getStations(): JQueryPromise<any>;
    getStationByLocation(lat: number, lon: number): JQueryPromise<any>;

    getTrainMovementByUid(uid: string, date: string): JQueryPromise<any>;
    getTrainMovementById(id: string): JQueryPromise<any>;
    getTrainMovementAssociations(uid: string, date: string): JQueryPromise<any>;

    getTrainMovementsTerminatingAtLocation(stanox: string, startDate: string, endDate: string): JQueryPromise<any>;
    getTrainMovementsTerminatingAtStation(crsCode: string, startDate: string, endDate: string): JQueryPromise<any>;
    getTrainMovementsStartingAtLocation(stanox: string, startDate: string, endDate: string): JQueryPromise<any>;
    getTrainMovementsStartingAtStation(crsCode: string, startDate: string, endDate: string): JQueryPromise<any>;
    getTrainMovementsCallingAtLocation(stanox: string, startDate: string, endDate: string): JQueryPromise<any>;
    getTrainMovementsCallingAtStation(crsCode: string, startDate: string, endDate: string): JQueryPromise<any>;
    getTrainMovementsBetweenLocations(fromStanox: string, toStanox: string, startDate: string, endDate: string): JQueryPromise<any>;
    getTrainMovementsBetweenStations(fromCrsCode: string, toCrsCode: string, startDate: string, endDate: string): JQueryPromise<any>;

    getPPMSectors(): JQueryPromise<any>;
    getPPMOperatorRegions(operatorCode: string): JQueryPromise<any>;
    getPPMData(operatorCode: string, name: string): JQueryPromise<any>;

    getBerthContents(berth: string): JQueryPromise<any>;
}

interface IEstimate {
    Arrival?: Moment;
    PublicArrival?: Moment;
    Departure?: Moment;
    PublicDeparture?: Moment;
    Pass?: Moment;
    CurrentDelay: number;
}

module TrainNotifier {

    export class WebApi implements IWebApi {

        constructor(public serverSettings?: IServerSettings) {
            if (!serverSettings) {
                this.serverSettings = TrainNotifier.Common.serverSettings;
            }
        }

        private getBaseUrl() {
            return "http://" + this.serverSettings.apiUrl;
        }

        getStations() {
            return $.getJSON(this.getBaseUrl() + "/Station/");
        }

        getStanox(stanox: string) {
            return $.getJSON(this.getBaseUrl() + "/Stanox/" + stanox);
        }

        getStationByLocation(lat: number, lon: number) {
            return $.getJSON(this.getBaseUrl() + "/Station/GeoLookup", {
                lat: lat,
                lon: lon
            });
        }

        getStanoxByCrsCode(crsCode: string) {
            return $.getJSON(this.getBaseUrl() + "/Stanox/?GetByCRS&crsCode=" + crsCode);
        }

        getTrainMovementByUid(uid: string, date: string) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/Uid/" + uid + "/" + date);
        }

        getTrainMovementById(id: string) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/" + id);
        }

        getTrainMovementAssociations(uid: string, date: string) {
            return $.getJSON(this.getBaseUrl() + "/Association/" + uid + "/" + date);
        }

        getTrainMovementsTerminatingAtLocation(stanox: string, startDate: string, endDate: string) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/TerminatingAt/Location/" + stanox, {
                startDate: startDate,
                endDate: endDate
            });
        }

        getTrainMovementsTerminatingAtStation(crsCode: string, startDate: string, endDate: string) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/TerminatingAt/Station/" + crsCode, {
                startDate: startDate,
                endDate: endDate
            });
        }

        getTrainMovementsStartingAtLocation(stanox: string, startDate: string, endDate: string) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/StartingAt/Location/" + stanox, {
                startDate: startDate,
                endDate: endDate
            });
        }

        getTrainMovementsStartingAtStation(crsCode: string, startDate: string, endDate: string) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/StartingAt/Station/" + crsCode, {
                startDate: startDate,
                endDate: endDate
            });
        }

        getTrainMovementsCallingAtLocation(stanox: string, startDate: string, endDate: string) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/CallingAt/Location/" + stanox, {
                startDate: startDate,
                endDate: endDate
            });
        }

        getTrainMovementsCallingAtStation(crsCode: string, startDate: string, endDate: string) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/CallingAt/Station/" + crsCode, {
                startDate: startDate,
                endDate: endDate
            });
        }

        getTrainMovementsBetweenLocations(fromStanox: string, toStanox: string, startDate: string, endDate: string) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/Between/Location/" + fromStanox + "/" + toStanox, {
                startDate: startDate,
                endDate: endDate
            });
        }

        getTrainMovementsBetweenStations(fromCrsCode: string, toCrsCode: string, startDate: string, endDate: string) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/Between/Station/" + fromCrsCode + "/" + toCrsCode, {
                startDate: startDate,
                endDate: endDate
            });
        }

        getPPMData(operatorCode: string, name: string) {
            return $.getJSON(this.getBaseUrl() + "/PPM/", {
                operatorCode: operatorCode,
                name: name
            });
        }

        getPPMOperatorRegions(operatorCode: string) {
            operatorCode = operatorCode || "";
            return $.getJSON(this.getBaseUrl() + "/PPM/" + operatorCode);
        }

        getPPMSectors() {
            return $.getJSON(this.getBaseUrl() + "/PPM/");
        }

        getBerthContents(berth: string) {
            return $.getJSON(this.getBaseUrl() + "/Td/Berth/" + berth);
        }
    }
}

interface ITiploc {
    Tiploc: string;
    Nalco: string;
    Description: string;
    Stanox: string;
    CRS: string;
}

interface IStationTiploc extends ITiploc {
    StationName: string;
    Lat: number;
    Lon: number;
}

interface IBerthContents {
    // timestamp
    m_Item1: string;
    // contents
    m_Item2: string;
}

module TrainNotifier {

    export enum EventType {
        Departure = 1,
        Arrival = 2
    }

    export enum TrainState {
        Activated = 1,
        Cancelled = 2,
        ActivatedAndCancelled = 3,
        Terminated = 4,
        ActivatedAndTerminated = 5
    }

    export enum AssociationType {
        NextTrain = 0,
        Join = 1,
        Split = 2
    }

    export enum AssociationDateType {
        SameDay = 0,
        PreviousDay = 1,
        NextDay = 2
    }

    export class ScheduleStatus {
        public static Bus: IScheduleStatus = {
            StatusId: 1,
            Code: 'B',
            Name: 'Bus'
        }
        public static Freight: IScheduleStatus = {
            StatusId: 2,
            Code: 'F',
            Name: 'Freight'
        }
        public static PassengerAndParcels: IScheduleStatus = {
            StatusId: 3,
            Code: 'P',
            Name: 'Passenger And Parcels'
        }
        public static Ship: IScheduleStatus = {
            StatusId: 4,
            Code: 'S',
            Name: 'Ship'
        }
        public static Trip: IScheduleStatus = {
            StatusId: 5,
            Code: 'T',
            Name: 'Trip'
        }
        public static STPPassengerAndParcels: IScheduleStatus = {
            StatusId: 6,
            Code: '1',
            Name: 'STP Passenger And Parcels'
        }
        public static STPFreight: IScheduleStatus = {
            StatusId: 7,
            Code: '2',
            Name: 'STP Freight'
        }
        public static STPTrip: IScheduleStatus = {
            StatusId: 8,
            Code: '3',
            Name: 'STP Trip'
        }
        public static STPShip: IScheduleStatus = {
            StatusId: 9,
            Code: '4',
            Name: 'STP Ship'
        }
        public static STPBus: IScheduleStatus = {
            StatusId: 10,
            Code: '5',
            Name: 'STP Bus'
        }

        public static getScheduleStatus(scheduleStatusId: number) {
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
        }
    }

    export class CancellationCodes {
        public static EnRoute = "EN ROUTE";
    }

    export class STPIndicator {
        public static Cancellation: ISTPIndicator = {
            STPIndicatorId: 1,
            Code: 'C',
            Description: 'Cancellation Of Permanent Schedule'
        }
        public static STP: ISTPIndicator = {
            STPIndicatorId: 2,
            Code: 'N',
            Description: 'STP'
        }
        public static Overlay: ISTPIndicator = {
            STPIndicatorId: 3,
            Code: 'O',
            Description: 'Overlay'
        }
        public static Permanent: ISTPIndicator = {
            STPIndicatorId: 4,
            Code: 'P',
            Description: 'Permanent'
        }

        public static getSTPIndicator(stpIndicatorId: number) {
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
        }
    }

    export class StationTiploc {
        public static findStationTiplocs(stanoxCode: string, tiplocs: IStationTiploc[]) {
            return tiplocs.filter(function (element: IStationTiploc) {
                return element.Stanox == stanoxCode;
            });
        }
        public static findStationTiploc(stanoxCode: string, tiplocs: IStationTiploc[]) {
            var results = StationTiploc.findStationTiplocs(stanoxCode, tiplocs);
            if (results && results.length > 0)
                return results[0];
            return null;
        }
    }

    export class RunningTrainEstimater {

        public static estimateTrainTimes(trainMovement: ITrainMovementResult) {
            if (trainMovement.Schedule && trainMovement.Schedule.Stops && trainMovement.Schedule.Stops.length > 0) {
                var currentDelay = 0;
                if (trainMovement.Actual && trainMovement.Actual.Stops && trainMovement.Actual.Stops.length > 0) {
                    var lastStop = trainMovement.Actual.Stops[trainMovement.Actual.Stops.length - 1];
                    currentDelay = moment(lastStop.ActualTimestamp)
                        .diff(moment(lastStop.PlannedTimestamp), 'minutes');
                }

                trainMovement.Schedule.Stops.forEach(function (stop: IRunningScheduleTrainStop) {
                    var estimate = RunningTrainEstimater.estimateTimes(stop, currentDelay);
                    currentDelay = estimate.CurrentDelay;
                });
            }
        }

        public static estimateTimes(
            scheduleStop: IRunningScheduleTrainStop,
            currentDelay: number = 0): IEstimate {

            var arrival: Moment,
                pubArrival: Moment,
                departure: Moment,
                pubDeparture: Moment,
                pass: Moment;

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
        }
    }

    export enum PowerTypeId {
        D = 1,
        DEM = 2,
        DMU = 3,
        E = 4,
        ED = 5,
        EML = 6,
        EMU = 7,
        EPU = 8,
        HST = 9,
        LDS = 10
    }

    export class PowerTypeLookup {

        private static _d: IPowerType = {
            PowerTypeId: PowerTypeId.D,
            Code: "D",
            Description: "Diesel Electric Multiple Unit"
        };
        private static _dem: IPowerType = {
            PowerTypeId: PowerTypeId.DEM,
            Code: "DEM",
            Description: "Diesel Electric Multiple Unit"
        };
        private static _dmu: IPowerType = {
            PowerTypeId: PowerTypeId.DMU,
            Code: "DMU",
            Description: "Diesel Mechanical Multiple Unit"
        };
        private static _e: IPowerType = {
            PowerTypeId: PowerTypeId.E,
            Code: "E",
            Description: "Electric"
        };
        private static _ed: IPowerType = {
            PowerTypeId: PowerTypeId.ED,
            Code: "ED",
            Description: "Electro-Diesel"
        };
        private static _eml: IPowerType = {
            PowerTypeId: PowerTypeId.EML,
            Code: "EML",
            Description: "EMU plus D, E, ED locomotive"
        };
        private static _emu: IPowerType = {
            PowerTypeId: PowerTypeId.EMU,
            Code: "EMU",
            Description: "Electric Multiple Unit"
        };
        private static _epu: IPowerType = {
            PowerTypeId: PowerTypeId.EPU,
            Code: "EPU",
            Description: "Electric Parcels Unit"
        };
        private static _hst: IPowerType = {
            PowerTypeId: PowerTypeId.HST,
            Code: "HST",
            Description: "High Speed Train"
        };
        private static _lds: IPowerType = {
            PowerTypeId: PowerTypeId.LDS,
            Code: "LDS",
            Description: "Diesel Shunting Locomotive"
        };

        public static getPowerType(powerType?: PowerTypeId): IPowerType {
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
        }
    }

    export enum CategoryTypeId {
        OL = 1,
        OU = 2,
        OO = 3,
        OS = 4,
        OW = 5,
        XC = 6,
        XD = 7,
        XI = 8,
        XR = 9,
        XU = 10,
        XX = 11,
        XZ = 12,
        BR = 13,
        BS = 14,
        EE = 15,
        EL = 16,
        ES = 17,
        JJ = 18,
        PM = 19,
        PP = 20,
        PV = 21,
        DD = 22,
        DH = 23,
        DI = 24,
        DQ = 25,
        DT = 26,
        DY = 27,
        ZB = 28,
        ZZ = 29,
        J2 = 30,
        H2 = 31,
        J3 = 32,
        J4 = 33,
        J5 = 34,
        J6 = 35,
        J8 = 36,
        H8 = 37,
        J9 = 38,
        H9 = 39,
        A0 = 40,
        E0 = 41,
        B0 = 42,
        B1 = 43,
        B4 = 44,
        B5 = 45,
        B6 = 46,
        B7 = 47,
        H0 = 48,
        H1 = 49,
        H3 = 50,
        H4 = 51,
        H5 = 52,
        H6 = 53
    }

    export class CategoryTypeLookup {

        private static _ol: ICategoryType = { CategoryTypeId: CategoryTypeId.OL, Code: "OL", Description: "London Underground/Metro Service" };
        private static _ou: ICategoryType = { CategoryTypeId: CategoryTypeId.OU, Code: "OU", Description: "Unadvertised Ordinary Passenger" };
        private static _oo: ICategoryType = { CategoryTypeId: CategoryTypeId.OO, Code: "OO", Description: "Ordinary Passenger" };
        private static _os: ICategoryType = { CategoryTypeId: CategoryTypeId.OS, Code: "OS", Description: "Staff Train" };
        private static _ow: ICategoryType = { CategoryTypeId: CategoryTypeId.OW, Code: "OW", Description: "Mixed" };
        private static _xc: ICategoryType = { CategoryTypeId: CategoryTypeId.XC, Code: "XC", Description: "Channel Tunnel" };
        private static _xd: ICategoryType = { CategoryTypeId: CategoryTypeId.XD, Code: "XD", Description: "Sleeper (Europe Night Services)" };
        private static _xi: ICategoryType = { CategoryTypeId: CategoryTypeId.XI, Code: "XI", Description: "International" };
        private static _xr: ICategoryType = { CategoryTypeId: CategoryTypeId.XR, Code: "XR", Description: "Motorail" };
        private static _xu: ICategoryType = { CategoryTypeId: CategoryTypeId.XU, Code: "XU", Description: "Unadvertised Express" };
        private static _xx: ICategoryType = { CategoryTypeId: CategoryTypeId.XX, Code: "XX", Description: "Express Passenger" };
        private static _xz: ICategoryType = { CategoryTypeId: CategoryTypeId.XZ, Code: "XZ", Description: "Sleeper (Domestic)" };
        private static _br: ICategoryType = { CategoryTypeId: CategoryTypeId.BR, Code: "BR", Description: "Bus � Replacement due to engineering work" };
        private static _bs: ICategoryType = { CategoryTypeId: CategoryTypeId.BS, Code: "BS", Description: "Bus � WTT Service" };
        private static _ee: ICategoryType = { CategoryTypeId: CategoryTypeId.EE, Code: "EE", Description: "Empty Coaching Stock (ECS)" };
        private static _el: ICategoryType = { CategoryTypeId: CategoryTypeId.EL, Code: "EL", Description: "ECS, London Underground/Metro Service" };
        private static _es: ICategoryType = { CategoryTypeId: CategoryTypeId.ES, Code: "ES", Description: "ECS & Staff" };
        private static _jj: ICategoryType = { CategoryTypeId: CategoryTypeId.JJ, Code: "JJ", Description: "Postal" };
        private static _pm: ICategoryType = { CategoryTypeId: CategoryTypeId.PM, Code: "PM", Description: "Post Office Controlled Parcels" };
        private static _pp: ICategoryType = { CategoryTypeId: CategoryTypeId.PP, Code: "PP", Description: "Parcels" };
        private static _pv: ICategoryType = { CategoryTypeId: CategoryTypeId.PV, Code: "PV", Description: "Empty NPCCS" };
        private static _dd: ICategoryType = { CategoryTypeId: CategoryTypeId.DD, Code: "DD", Description: "Departmental" };
        private static _dh: ICategoryType = { CategoryTypeId: CategoryTypeId.DH, Code: "DH", Description: "Civil Engineer" };
        private static _di: ICategoryType = { CategoryTypeId: CategoryTypeId.DI, Code: "DI", Description: "Mechanical & Electrical Engineer" };
        private static _dq: ICategoryType = { CategoryTypeId: CategoryTypeId.DQ, Code: "DQ", Description: "Stores" };
        private static _dt: ICategoryType = { CategoryTypeId: CategoryTypeId.DT, Code: "DT", Description: "Test" };
        private static _dy: ICategoryType = { CategoryTypeId: CategoryTypeId.DY, Code: "DY", Description: "Signal & Telecommunications Engineer" };
        private static _zb: ICategoryType = { CategoryTypeId: CategoryTypeId.ZB, Code: "ZB", Description: "Locomotive & Brake Van" };
        private static _zz: ICategoryType = { CategoryTypeId: CategoryTypeId.ZZ, Code: "ZZ", Description: "Light Locomotive" };
        private static _j2: ICategoryType = { CategoryTypeId: CategoryTypeId.J2, Code: "J2", Description: "RfD Automotive (Components)" };
        private static _h2: ICategoryType = { CategoryTypeId: CategoryTypeId.H2, Code: "H2", Description: "RfD Automotive (Vehicles)" };
        private static _j3: ICategoryType = { CategoryTypeId: CategoryTypeId.J3, Code: "J3", Description: "RfD Edible Products (UK Contracts)" };
        private static _j4: ICategoryType = { CategoryTypeId: CategoryTypeId.J4, Code: "J4", Description: "RfD Industrial Minerals (UK Contracts)" };
        private static _j5: ICategoryType = { CategoryTypeId: CategoryTypeId.J5, Code: "J5", Description: "RfD Chemicals (UK Contracts)" };
        private static _j6: ICategoryType = { CategoryTypeId: CategoryTypeId.J6, Code: "J6", Description: "RfD Building Materials (UK Contracts)" };
        private static _j8: ICategoryType = { CategoryTypeId: CategoryTypeId.J8, Code: "J8", Description: "RfD General Merchandise (UK Contracts)" };
        private static _h8: ICategoryType = { CategoryTypeId: CategoryTypeId.H8, Code: "H8", Description: "RfD European" };
        private static _j9: ICategoryType = { CategoryTypeId: CategoryTypeId.J9, Code: "J9", Description: "RfD Freightliner (Contracts)" };
        private static _h9: ICategoryType = { CategoryTypeId: CategoryTypeId.H9, Code: "H9", Description: "RfD Freightliner (Other)" };
        private static _a0: ICategoryType = { CategoryTypeId: CategoryTypeId.A0, Code: "A0", Description: "Coal (Distributive)" };
        private static _e0: ICategoryType = { CategoryTypeId: CategoryTypeId.E0, Code: "E0", Description: "Coal (Electricity) MGR" };
        private static _b0: ICategoryType = { CategoryTypeId: CategoryTypeId.B0, Code: "B0", Description: "Coal (Other) and Nuclear" };
        private static _b1: ICategoryType = { CategoryTypeId: CategoryTypeId.B1, Code: "B1", Description: "Metals" };
        private static _b4: ICategoryType = { CategoryTypeId: CategoryTypeId.B4, Code: "B4", Description: "Aggregates" };
        private static _b5: ICategoryType = { CategoryTypeId: CategoryTypeId.B5, Code: "B5", Description: "Domestic and Industrial Waste" };
        private static _b6: ICategoryType = { CategoryTypeId: CategoryTypeId.B6, Code: "B6", Description: "Building Materials (TLF)" };
        private static _b7: ICategoryType = { CategoryTypeId: CategoryTypeId.B7, Code: "B7", Description: "Petroleum Products" };
        private static _h0: ICategoryType = { CategoryTypeId: CategoryTypeId.H0, Code: "H0", Description: "RfD European Channel Tunnel (Mixed Business)" };
        private static _h1: ICategoryType = { CategoryTypeId: CategoryTypeId.H1, Code: "H1", Description: "RfD European Channel Tunnel Intermodal" };
        private static _h3: ICategoryType = { CategoryTypeId: CategoryTypeId.H3, Code: "H3", Description: "RfD European Channel Tunnel Automotive" };
        private static _h4: ICategoryType = { CategoryTypeId: CategoryTypeId.H4, Code: "H4", Description: "RfD European Channel Tunnel Contract Services" };
        private static _h5: ICategoryType = { CategoryTypeId: CategoryTypeId.H5, Code: "H5", Description: "RfD European Channel Tunnel Haulmark" };
        private static _h6: ICategoryType = { CategoryTypeId: CategoryTypeId.H6, Code: "H6", Description: "RfD European Channel Tunnel Joint Venture" };

        public static getCategoryType(categoryType?: CategoryTypeId): ICategoryType {
            if (!categoryType)
                return null;

            switch (categoryType) {
                case CategoryTypeId.OL: return this._ol;
                case CategoryTypeId.OU: return this._ou;
                case CategoryTypeId.OO: return this._oo;
                case CategoryTypeId.OS: return this._os;
                case CategoryTypeId.OW: return this._ow;
                case CategoryTypeId.XC: return this._xc;
                case CategoryTypeId.XD: return this._xd;
                case CategoryTypeId.XI: return this._xi;
                case CategoryTypeId.XR: return this._xr;
                case CategoryTypeId.XU: return this._xu;
                case CategoryTypeId.XX: return this._xx;
                case CategoryTypeId.XZ: return this._xz;
                case CategoryTypeId.BR: return this._br;
                case CategoryTypeId.BS: return this._bs;
                case CategoryTypeId.EE: return this._ee;
                case CategoryTypeId.EL: return this._el;
                case CategoryTypeId.ES: return this._es;
                case CategoryTypeId.JJ: return this._jj;
                case CategoryTypeId.PM: return this._pm;
                case CategoryTypeId.PP: return this._pp;
                case CategoryTypeId.PV: return this._pv;
                case CategoryTypeId.DD: return this._dd;
                case CategoryTypeId.DH: return this._dh;
                case CategoryTypeId.DI: return this._di;
                case CategoryTypeId.DQ: return this._dq;
                case CategoryTypeId.DT: return this._dt;
                case CategoryTypeId.DY: return this._dy;
                case CategoryTypeId.ZB: return this._zb;
                case CategoryTypeId.ZZ: return this._zz;
                case CategoryTypeId.J2: return this._j2;
                case CategoryTypeId.H2: return this._h2;
                case CategoryTypeId.J3: return this._j3;
                case CategoryTypeId.J4: return this._j4;
                case CategoryTypeId.J5: return this._j5;
                case CategoryTypeId.J6: return this._j6;
                case CategoryTypeId.J8: return this._j8;
                case CategoryTypeId.H8: return this._h8;
                case CategoryTypeId.J9: return this._j9;
                case CategoryTypeId.H9: return this._h9;
                case CategoryTypeId.A0: return this._a0;
                case CategoryTypeId.E0: return this._e0;
                case CategoryTypeId.B0: return this._b0;
                case CategoryTypeId.B1: return this._b1;
                case CategoryTypeId.B4: return this._b4;
                case CategoryTypeId.B5: return this._b5;
                case CategoryTypeId.B6: return this._b6;
                case CategoryTypeId.B7: return this._b7;
                case CategoryTypeId.H0: return this._h0;
                case CategoryTypeId.H1: return this._h1;
                case CategoryTypeId.H3: return this._h3;
                case CategoryTypeId.H4: return this._h4;
                case CategoryTypeId.H5: return this._h5;
                case CategoryTypeId.H6: return this._h6;
            }

            return null;
        }
    }
}

interface IRunningTrainActualStop {
    EventType: number;
    PlannedTimestamp: string;
    ActualTimestamp?: string;
    Line?: string;
    Platform?: string;
    ScheduleStopNumber: number;
    TiplocStanoxCode: string;
}

interface IRunningTrainActual {
    Activated: string;
    TrainId: string;
    HeadCode: string;
    TrainServiceCode: string;
    State: number;
    ScheduleOriginStanoxCode: string;
    OriginDepartTimestamp: string;
    Stops: IRunningTrainActualStop[];
}

interface IAtocCode {
    Code: string;
    Name: string;
}

interface ISchedule {
    Monday: boolean;
    Tuesday: boolean;
    Wednesday: boolean;
    Thursday: boolean;
    Friday: boolean;
    Saturday: boolean;
    Sunday: boolean;
    BankHoliday: boolean;
}

interface IScheduleStatus {
    StatusId: number;
    Code: string;
    Name: string;
}

interface ISTPIndicator {
    STPIndicatorId: number;
    Code: string;
    Description: string;
}

interface IPowerType {
    PowerTypeId: TrainNotifier.PowerTypeId;
    Code: string;
    Description: string;
}

interface ICategoryType {
    CategoryTypeId: TrainNotifier.CategoryTypeId;
    Code: string;
    Description: string;
}

interface IRunningScheduleTrainStop {
    TiplocStanoxCode: string;
    StopNumber: number;
    Arrival?: string;
    Departure?: string;
    Pass?: string;
    PublicArrival?: string;
    PublicDeparture?: string;
    Line?: string;
    Path?: string;
    Platform?: string;
    EngineeringAllowance?: number;
    PathingAllowance?: number;
    PerformanceAllowance?: number;
    Origin: boolean;
    Intermediate: boolean;
    Terminate: boolean;

    Estimate?: IEstimate;
}

interface ICancellation {
    CancelledAtStanoxCode: string;
    CancelledTimestamp: string;
    ReasonCode: string;
    Description: string;
    Type: string;
}

interface IReinstatement {
    NewOriginStanoxCode: string;
    PlannedDepartureTime: string;
}
interface IChangeOfOrigin {
    NewOriginStanoxCode: string;
    ReasonCode: string;
    Description: string;
    NewDepartureTime: string;
}

interface IRunningScheduleTrain {
    TrainUid: string;
    Headcode: string;
    StartDate: string;
    EndDate: string;
    AtocCode: IAtocCode;
    ScheduleStatusId: number;
    STPIndicatorId: number;
    PowerTypeId?: TrainNotifier.PowerTypeId;
    CategoryTypeId?: TrainNotifier.CategoryTypeId;
    Speed?: number;
    Stops: IRunningScheduleTrainStop[];
    Schedule: ISchedule;
}

interface ITrainMovementResult {
    Actual: IRunningTrainActual;
    Schedule: IRunningScheduleTrain;
    Cancellations: ICancellation[];
    Reinstatements: IReinstatement[];
    ChangeOfOrigins: IChangeOfOrigin[];
}

interface ITrainMovementResults {
    Movements: ITrainMovementResult[];
    Tiplocs: IStationTiploc[];
}

interface ISingleTrainMovementResult {
    Movement: ITrainMovementResult;
    Tiplocs: IStationTiploc[];
}

interface IAssociation {
    AssociationType: number;
    MainTrainUid: string;
    AssocTrainUid: string;
    StartDate: string;
    EndDate: string;
    DateType: number;
    // not used
    Schedule?: any;
    STPIndicator: number;
    Location: ITiploc;
}