var ws;

function connect() {
    $(".btn-connect").attr("disabled", true);
    $(".btn-disconnect").attr("disabled", false);

    ws = new WebSocket("ws://" + server + ":81");
    ws.onopen = function () {
        setStatus("Connected");

        $("#status").removeClass("btn-warning");
        $("#status").removeClass("btn-info");
        $("#status").addClass("btn-success");
        $(".btn-connect").attr("disabled", true);

        try{
            wsOpenCommand();
        } catch (err) { }
    };
    ws.onclose = function () {
        setStatus("Disconnected");
        $("#status").removeClass("btn-success");
        $("#status").removeClass("btn-info");
        $("#status").addClass("btn-warning");
        $(".btn-connect").attr("disabled", false);
        $(".btn-disconnect").attr("disabled", true);
    };
}

function disconnect() {
    $(".btn-connect").attr("disabled", false);
    $(".btn-disconnect").attr("disabled", true);

    ws.close();
    setStatus("Closed");
    $("#status").removeClass("btn-success");
    $("#status").removeClass("btn-info");
    $("#status").addClass("btn-warning");
}