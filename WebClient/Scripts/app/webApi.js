var TrainNotifier;
(function (TrainNotifier) {
    var WebApi = (function () {
        function WebApi(serverSettings) {
            this.serverSettings = serverSettings;
            if(!serverSettings) {
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
        WebApi.prototype.getSchedule = function (uid, date) {
            return $.getJSON(this.getBaseUrl() + "/Schedule/uid/" + uid + "/" + date);
        };
        WebApi.prototype.getPPMData = function (operatorCode, name) {
            return $.getJSON(this.getBaseUrl() + "/PPM/", {
                operatorCode: operatorCode,
                name: name
            });
        };
        WebApi.prototype.getPPMOperatorRegions = function (operatorCode) {
            return $.getJSON(this.getBaseUrl() + "/PPM/" + operatorCode);
        };
        WebApi.prototype.getPPMSectors = function () {
            return $.getJSON(this.getBaseUrl() + "/PPM/");
        };
        return WebApi;
    })();
    TrainNotifier.WebApi = WebApi;    
})(TrainNotifier || (TrainNotifier = {}));
