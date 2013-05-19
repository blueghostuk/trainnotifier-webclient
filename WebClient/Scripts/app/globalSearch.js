var thisPage;
var serverSettings;
var webApi;
$(function () {
    webApi = new TrainNotifier.WebApi(serverSettings);
    $("#global-search-box").keyup(function (e) {
        if(e.keyCode == 13) {
            parseGlobalSearchCommand($(this).val());
        }
    });
    webApi.getStations().done(function (stations) {
        var commands = [];
        commands.push('get/');
        commands.push('sub/');
        commands.push('from/');
        for (var i in stations) {
            commands.push('from/' + stations[i].Name);
            commands.push('from/' + stations[i].CRS);
        }
        commands.push('at/');
        for (var i in stations) {
            commands.push('at/' + stations[i].Name);
            commands.push('at/' + stations[i].CRS);
        }
        commands.push('to/');
        for (var i in stations) {
            commands.push('to/' + stations[i].Name);
            commands.push('to/' + stations[i].CRS);
        }
        $("#global-search-box").typeahead({
            source: commands
        });
    });
});
function parseGlobalSearchCommand(command) {
    if(thisPage) {
        thisPage.setCommand(command);
        if(thisPage.parseCommand()) {
            return;
        }
    }
    var idx = command.indexOf("/");
    if(idx == -1) {
        return;
    }
    var cmd = command.substring(0, idx);
    var args = command.substring(idx + 1).split('/');
    var url;
    switch(cmd) {
        case 'from':
            if(args.length >= 3 && args[1] == "to") {
                url = "search/from/" + args[0] + "/to/" + args[2];
            } else {
                url = "search/from/" + args[0];
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
    if(url && url.length > 0) {
        document.location.href = url;
    }
}
