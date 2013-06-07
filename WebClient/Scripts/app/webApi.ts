/// <reference path="global.ts" />
/// <reference path="../typings/jquery/jquery.d.ts" />

interface IWebApi {
    getStanox(stanox: string): JQueryPromise;
    getStanoxByCrsCode(crsCode: string): JQueryPromise;

    getStations(): JQueryPromise;
    getStationByLocation(lat: number, lon: number): JQueryPromise;

    getTrainMovementByUid(uid: string, date: string): JQueryPromise;
    getTrainMovementById(id: string): JQueryPromise;
    getTrainMovementAssociations(uid: string, date: string): JQueryPromise;

    getTrainMovementsTerminatingAtLocation(stanox: string, startDate: string, endDate: string): JQueryPromise;
    getTrainMovementsTerminatingAtStation(crsCode: string, startDate: string, endDate: string): JQueryPromise;
    getTrainMovementsStartingAtLocation(stanox: string, startDate: string, endDate: string): JQueryPromise;
    getTrainMovementsStartingAtStation(crsCode: string, startDate: string, endDate: string): JQueryPromise;
    getTrainMovementsCallingAtLocation(stanox: string, startDate: string, endDate: string): JQueryPromise;
    getTrainMovementsCallingAtStation(crsCode: string, startDate: string, endDate: string): JQueryPromise;
    getTrainMovementsBetweenLocations(fromStanox: string, toStanox: string, startDate: string, endDate: string): JQueryPromise;
    getTrainMovementsBetweenStations(fromCrsCode: string, toCrsCode: string, startDate: string, endDate: string): JQueryPromise;

    getSchedule(uid: string, date: string): JQueryPromise;

    getPPMSectors(): JQueryPromise;
    getPPMOperatorRegions(operatorCode: string): JQueryPromise;
    getPPMData(operatorCode: string, name: string): JQueryPromise;
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
        };

        getStations() {
            return $.getJSON(this.getBaseUrl() + "/Station/");
        };

        getStanox(stanox: string) {
            return $.getJSON(this.getBaseUrl() + "/Stanox/" + stanox);
        };

        getStationByLocation(lat: number, lon: number) {
            return $.getJSON(this.getBaseUrl() + "/Station/GeoLookup", {
                lat: lat,
                lon: lon
            });
        };

        getStanoxByCrsCode(crsCode: string) {
            return $.getJSON(this.getBaseUrl() + "/Stanox/?GetByCRS&crsCode=" + crsCode);
        };

        getTrainMovementByUid(uid: string, date: string) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/Uid/" + uid + "/" + date);
        };

        getTrainMovementById(id: string) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/" + id);
        };

        getTrainMovementAssociations(uid: string, date: string) {
            return $.getJSON(this.getBaseUrl() + "/Association/" + uid + "/" + date);
        };

        getTrainMovementsTerminatingAtLocation(stanox: string, startDate: string, endDate: string) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/TerminatingAt/Location/" + stanox, {
                startDate: startDate,
                endDate: endDate
            });
        };

        getTrainMovementsTerminatingAtStation(crsCode: string, startDate: string, endDate: string) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/TerminatingAt/Station/" + crsCode, {
                startDate: startDate,
                endDate: endDate
            });
        };

        getTrainMovementsStartingAtLocation(stanox: string, startDate: string, endDate: string) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/StartingAt/Location/" + stanox, {
                startDate: startDate,
                endDate: endDate
            });
        };

        getTrainMovementsStartingAtStation(crsCode: string, startDate: string, endDate: string) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/StartingAt/Station/" + crsCode, {
                startDate: startDate,
                endDate: endDate
            });
        };

        getTrainMovementsCallingAtLocation(stanox: string, startDate: string, endDate: string) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/CallingAt/Location/" + stanox, {
                startDate: startDate,
                endDate: endDate
            });
        };

        getTrainMovementsCallingAtStation(crsCode: string, startDate: string, endDate: string) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/CallingAt/Station/" + crsCode, {
                startDate: startDate,
                endDate: endDate
            });
        };

        getTrainMovementsBetweenLocations(fromStanox: string, toStanox: string, startDate: string, endDate: string) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/Between/Location/" + fromStanox + "/" + toStanox, {
                startDate: startDate,
                endDate: endDate
            });
        };

        getTrainMovementsBetweenStations(fromCrsCode: string, toCrsCode: string, startDate: string, endDate: string) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/Between/Station/" + fromCrsCode + "/" + toCrsCode, {
                startDate: startDate,
                endDate: endDate
            });
        };

        getSchedule(uid: string, date: string) {
            return $.getJSON(this.getBaseUrl() + "/Schedule/uid/" + uid + "/" + date);
        };

        getPPMData(operatorCode: string, name: string) {
            return $.getJSON(this.getBaseUrl() + "/PPM/", {
                operatorCode: operatorCode,
                name: name
            });
        };

        getPPMOperatorRegions(operatorCode: string) {
            return $.getJSON(this.getBaseUrl() + "/PPM/" + operatorCode);
        };

        getPPMSectors() {
            return $.getJSON(this.getBaseUrl() + "/PPM/");
        };
    }
}

interface IStationTiploc {
    StationName: string;
    Lat: number;
    Lon: number;
    Tiploc: string;
    Nalco: string;
    Description: string;
    Stanox: string;
    CRS: string;
}

module TrainNotifier {

    export class EventType {
        public static Departure = 1;
        public static Arrival = 2;
    }

    export class TrainState {
        public static Activated = 1;
        public static Cancelled = 2;
        public static ActivatedAndCancelled = 3;
        public static Terminated = 4;
        public static ActivatedAndTerminated = 5;
    }

    export class ScheduleStatus {
        public static Bus: IScheduleStatus = {
            StatusId: 1,
            Code: 'B',
            Name: 'Bus'
        };
        public static Freight: IScheduleStatus = {
            StatusId: 2,
            Code: 'F',
            Name: 'Freight'
        };
        public static PassengerAndParcels: IScheduleStatus = {
            StatusId: 3,
            Code: 'P',
            Name: 'Passenger And Parcels'
        };
        public static Ship: IScheduleStatus = {
            StatusId: 4,
            Code: 'S',
            Name: 'Ship'
        };
        public static Trip: IScheduleStatus = {
            StatusId: 5,
            Code: 'T',
            Name: 'Trip'
        };
        public static STPPassengerAndParcels: IScheduleStatus = {
            StatusId: 6,
            Code: '1',
            Name: 'STP Passenger And Parcels'
        };
        public static STPFreight: IScheduleStatus = {
            StatusId: 7,
            Code: '2',
            Name: 'STP Freight'
        };
        public static STPTrip: IScheduleStatus = {
            StatusId: 8,
            Code: '3',
            Name: 'STP Trip'
        };
        public static STPShip: IScheduleStatus = {
            StatusId: 9,
            Code: '4',
            Name: 'STP Ship'
        };
        public static STPBus: IScheduleStatus = {
            StatusId: 10,
            Code: '5',
            Name: 'STP Bus'
        };

        public static getScheduleStatus(scheduleStatusId: number) {
            switch (scheduleStatusId) {
                case Bus.StatusId:
                    return Bus;
                case Freight.StatusId:
                    return Freight;
                case PassengerAndParcels.StatusId:
                    return PassengerAndParcels;
                case Ship.StatusId:
                    return Ship;
                case Trip.StatusId:
                    return Trip;
                case STPPassengerAndParcels.StatusId:
                    return STPPassengerAndParcels;
                case STPFreight.StatusId:
                    return STPFreight;
                case STPTrip.StatusId:
                    return STPTrip;
                case STPShip.StatusId:
                    return STPShip;
                case STPBus.StatusId:
                    return STPBus;
                default:
                    return null;
            }
        };
    }

    export class CancellationCodes {
        public static EnRoute = "EN ROUTE";
    }

    export class STPIndicator {
        public static Cancellation: ISTPIndicator = {
            STPIndicatorId: 1,
            Code: 'C',
            Description: 'Cancellation Of Permanent Schedule'
        };
        public static STP: ISTPIndicator = {
            STPIndicatorId: 2,
            Code: 'N',
            Description: 'STP'
        };
        public static Overlay: ISTPIndicator = {
            STPIndicatorId: 3,
            Code: 'O',
            Description: 'Overlay'
        };
        public static Permanent: ISTPIndicator = {
            STPIndicatorId: 4,
            Code: 'P',
            Description: 'Permanent'
        };

        public static getSTPIndicator(stpIndicatorId: number) {
            switch (stpIndicatorId) {
                case Cancellation.STPIndicatorId:
                    return Cancellation;
                case STP.STPIndicatorId:
                    return STP;
                case Overlay.STPIndicatorId:
                    return Overlay;
                case Permanent.STPIndicatorId:
                    return Permanent;
                default:
                    return null;
            }
        };
    };

    export class StationTiploc {
        public static findStationTiplocs(stanoxCode: string, tiplocs: IStationTiploc[]) {
            return tiplocs.filter(function (element: IStationTiploc) {
                return element.Stanox == stanoxCode;
            });
        };
        public static findStationTiploc(stanoxCode: string, tiplocs: IStationTiploc[]) {
            var results = findStationTiplocs(stanoxCode, tiplocs);
            if (results && results.length > 0)
                return results[0];
            return null;
        };
    };
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
    Monday: bool;
    Tuesday: bool;
    Wednesday: bool;
    Thursday: bool;
    Friday: bool;
    Saturday: bool;
    Sunday: bool;
    BankHoliday: bool;
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
    Origin: bool;
    Intermediate: bool;
    Terminate: bool;
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
    StartDate: string;
    EndDate: string;
    AtocCode: IAtocCode;
    ScheduleStatusId: number;
    STPIndicatorId: number;
    Stops: IRunningScheduleTrainStop[];
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