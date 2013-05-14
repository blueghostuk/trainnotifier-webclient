var thisPage;
$(function () {
    $("input.search-query").keyup(function (e) {
        if(e.keyCode == 13) {
            parseGlobalSearchCommand($(this).val());
        }
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
