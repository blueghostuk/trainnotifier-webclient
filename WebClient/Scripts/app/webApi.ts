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

interface IStanox {
    StationName: string;
    Lat: number;
    Lon: number;
    Tiploc: string;
    Nalco: string;
    Description: string;
    Stanox: string;
    CRS: string;
}

// Module
module TrainNotifier {

    // Class
    export class WebApi implements IWebApi {

        // Constructor
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