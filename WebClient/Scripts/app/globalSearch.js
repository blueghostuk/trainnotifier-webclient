$(function () {
    TrainNotifier.Common.webApi = new TrainNotifier.WebApi();

    $("#global-search-box").keypress(function (e) {
        console.log(e.keyCode);
        if (e.keyCode == 13) {
            parseGlobalSearchCommand($(this).val());
            return false;
        }
    });

    TrainNotifier.Common.webApi.getStations().done(function (stations) {
        var commands = [];
        for (var i in stations) {
            var tokens = [stations[i].StationName, stations[i].CRS, stations[i].Tiploc];
            commands.push({
                value: 'at/' + stations[i].CRS,
                title: 'Trains calling at ' + stations[i].StationName,
                tokens: tokens
            });
            commands.push({
                value: 'from/' + stations[i].CRS,
                title: 'Trains starting from ' + stations[i].StationName,
                tokens: tokens
            });
            commands.push({
                value: 'to/' + stations[i].CRS,
                title: 'Trains terminating at ' + stations[i].StationName,
                tokens: tokens
            });
        }
        $("#global-search-box").typeahead({
            name: 'global-lookup',
            local: commands,
            template: '<p title="{{title}}">{{value}}</p>',
            engine: Hogan
        });
    });
});

function parseGlobalSearchCommand(command) {
    if (TrainNotifier.Common.page) {
        TrainNotifier.Common.page.settingHash = true;
        TrainNotifier.Common.page.setCommand(command);
        if (TrainNotifier.Common.page.parseCommand()) {
            return;
        }
    }

    var idx = command.indexOf("/");
    if (idx == -1)
        return;

    var cmd = command.substring(0, idx);
    var args = command.substring(idx + 1).split('/');

    var url;

    switch (cmd) {
        case 'from':
            if (args.length >= 3 && args[1] == "to") {
                url = "search/from/" + args[0] + "/to/" + args[2];
                //getCallingBetween(args[0], args[2], convertFromCrs, getDateTime(args.slice(3, 5)), (args.length <= 5 ? null : getDateTime(args.slice(3, 4).concat(args.slice(5, 7)))));
            } else {
                url = "search/from/" + args[0];
                //getOrigin(args[0], convertFromCrs, getDateTime(args.slice(1, 3)), (args.length <= 3 ? null : getDateTime(args.slice(1, 2).concat(args.slice(3, 5)))));
            }
            break;
        case 'to':
            url = "search/to/" + args[0];

            break;
        case 'at':
            url = "search/at/" + args[0];

            break;
        case 'get':
            break;
        case 'sub':
            break;
        case 'id':
            break;
    }

    if (url && url.length > 0) {
        document.location.href = url;
    }
}
