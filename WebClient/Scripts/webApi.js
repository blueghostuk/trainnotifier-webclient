var TrainNotifier;
(function (TrainNotifier) {
    var WebApi = (function () {
        function WebApi(serverSettings) {
            this.serverSettings = serverSettings;
        }
        WebApi.prototype.getBaseUrl = function () {
            return "http://" + this.serverSettings.server + ":" + this.serverSettings.apiPort;
        };
        WebApi.prototype.getStations = function () {
            return $.getJSON(this.getBaseUrl() + "/Station/");
        };
        return WebApi;
    })();
    TrainNotifier.WebApi = WebApi;    
})(TrainNotifier || (TrainNotifier = {}));
