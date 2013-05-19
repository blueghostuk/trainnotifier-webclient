/// <reference path="typings/jquery/jquery.d.ts" />

interface IWebApi {
    getStations(): JQueryPromise;
    getStanox(stanox: string): JQueryPromise;
}

interface IServerSettings {
    server: string;
    apiPort: string;
    wsPort: string;
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
        constructor(public serverSettings: IServerSettings) { }

        private getBaseUrl(){
            return "http://" + this.serverSettings.server + ":" + this.serverSettings.apiPort;
        };

        getStations() {
            return $.getJSON(this.getBaseUrl() + "/Station/");
        };

        getStanox(stanox: string) {
            return $.getJSON(this.getBaseUrl() + "/Stanox/" + stanox);
        };

    }

}