var webApi;

var empty = {
    Describer: "",
    Trains: []
};
var liveTrain = ko.observable(empty);

$(function () {
    webApi = new TrainNotifier.WebApi();
    TrainNotifier.Common.webApi = webApi;

    $("#form").submit(function (e) {
        var val = $("#trainId").val();
        if (val && val.length > 0) {
            getLiveTrain(val);
            document.location.hash = "!" + val;
        }
        event.preventDefault();
    });

    ko.applyBindings(liveTrain, $("#trains").get(0));

    if (document.location.hash.length > 2) {
        var trainId = document.location.hash.substr(2);
        $("#trainId").val(trainId);
        getLiveTrain(trainId);
    }
});

function getLiveTrain(trainId) {
    webApi.getLiveTrain(trainId).done(function (result) {
        if (!result) {
            liveTrain(empty);
            return;
        }
        for (var i = 0; i < result.Trains.length; i++) {
            result.Trains[i].BerthsArray = [];
            $.each(result.Trains[i].Berths, function (index, value) {
                for (var j = 0; j < value.length; j++) {
                    result.Trains[i].BerthsArray.push(value[j]);
                }
            });
            result.Trains[i].BerthsArray.sort(function (a, b) {
                return moment(a.FirstSeen).isAfter(moment(b.FirstSeen)) ? 1 : -1;
            });
        }
        liveTrain(result);
    });
}
