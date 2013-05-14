/// <reference path="typings/jquery/jquery.d.ts" />

interface Page{
    setCommand(command: string);
    parseCommand(): bool;
}

var thisPage: Page;

$(function () {
    $("input.search-query").keyup(function (e) {
        if (e.keyCode == 13) {
            parseGlobalSearchCommand($(this).val());
        }
    });
});

function parseGlobalSearchCommand(command: string) {
    // see if have a page object that can handle commands already
    if (thisPage) {
        thisPage.setCommand(command);
        if (thisPage.parseCommand()) {
            return;
        }
    }

    var idx = command.indexOf("/");
    if (idx == -1)
        return;

    var cmd = command.substring(0, idx);
    var args = command.substring(idx + 1).split('/');

    var url: string;

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
            //getDestination(args[0], convertFromCrs, getDateTime(args.slice(1, 3)), (args.length <= 3 ? null : getDateTime(args.slice(1, 2).concat(args.slice(3, 5)))));
            break;
        case 'at':
            url = "search/at/" + args[0];
            //getStation(args[0], convertFromCrs, getDateTime(args.slice(1, 3)), (args.length <= 3 ? null : getDateTime(args.slice(1, 2).concat(args.slice(3, 5)))));
            break;
        case 'get':
            // todo
            break;
        case 'sub':
            // todo
            break;
        case 'id':
            // todo
            break;
    }

    if (url && url.length > 0) {
        document.location.href = url;
    }
}