/// <reference path="typings/jquery/jquery.d.ts" />

interface IWebApi {
    getStations(): JQueryPromise;
}

interface IServerSettings {
    server: string;
    apiPort: string;
    wsPort: string;
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

    }

}