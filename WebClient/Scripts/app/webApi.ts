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
    getTrainMovementsTerminatingAt(stanox: string, startDate: string, endDate: string): JQueryPromise;
    getTrainMovementsStartingAt(stanox: string, startDate: string, endDate: string): JQueryPromise;
    getTrainMovementsCallingAt(stanox: string, startDate: string, endDate: string): JQueryPromise;
    getTrainMovementsBetween(fromStanox: string, toStanox: string, startDate: string, endDate: string): JQueryPromise;

    getSchedule(uid: string, date: string): JQueryPromise;

    getPPMSectors(): JQueryPromise;
    getPPMOperatorRegions(operatorCode: string): JQueryPromise;
    getPPMData(operatorCode: string, name: string): JQueryPromise;
}

interface IStanox{
    Name: string;
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

        private getBaseUrl(){
            return "http://" + this.serverSettings.server + ":" + this.serverSettings.apiPort;
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

        getTrainMovementsTerminatingAt(stanox: string, startDate: string, endDate: string) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/TerminatingAtStation/" + stanox, {
                startDate: startDate,
                endDate: endDate
            });
        };

        getTrainMovementsStartingAt(stanox: string, startDate: string, endDate: string) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/StartingAtStation/" + stanox, {
                startDate: startDate,
                endDate: endDate
            });
        };

        getTrainMovementsCallingAt(stanox: string, startDate: string, endDate: string) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/CallingAtStation/" + stanox, {
                startDate: startDate,
                endDate: endDate
            });
        };

        getTrainMovementsBetween(fromStanox: string, toStanox: string, startDate: string, endDate: string) {
            return $.getJSON(this.getBaseUrl() + "/TrainMovement/" + fromStanox + "/" + toStanox, {
                startDate: startDate,
                endDate: endDate
            });
        };

        getSchedule(uid: string, date: string) {
            return $.getJSON(this.getBaseUrl() + "/Schedule/uid/" + uid + "/" + date);
        };

        getPPMData(operatorCode: string, name: string){
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