/// <reference path="global.ts" />
/// <reference path="webApi.ts" />

module TrainNotifier{
    export class WebSockets{
        private ws: WebSocket;

        connect() {
            $(".btn-connect").attr("disabled", true);
            $(".btn-disconnect").attr("disabled", false);

            this.ws = new WebSocket("ws://" + TrainNotifier.Common.serverSettings.server + ":" + TrainNotifier.Common.serverSettings.wsPort);
            this.ws.onopen = function () {
                if (TrainNotifier.Common.page.setStatus) {
                    TrainNotifier.Common.page.setStatus("Connected");
                }

                $("#status").removeClass("btn-warning");
                $("#status").removeClass("btn-info");
                $("#status").addClass("btn-success");
                $(".btn-connect").attr("disabled", true);

                try {
                    if (TrainNotifier.Common.page.wsOpenCommand) {
                        TrainNotifier.Common.page.wsOpenCommand();
                    }
                } catch (err) { }
            };
            this.ws.onclose = function () {
                if (TrainNotifier.Common.page.setStatus) {
                    TrainNotifier.Common.page.setStatus("Disconnected");
                }
                $("#status").removeClass("btn-success");
                $("#status").removeClass("btn-info");
                $("#status").addClass("btn-warning");
                $(".btn-connect").attr("disabled", false);
                $(".btn-disconnect").attr("disabled", true);
            };
        };

        disconnect() {
            $(".btn-connect").attr("disabled", false);
            $(".btn-disconnect").attr("disabled", true);

            this.ws.close();
            if (TrainNotifier.Common.page.setStatus) {
                TrainNotifier.Common.page.setStatus("Closed");
            }
            $("#status").removeClass("btn-success");
            $("#status").removeClass("btn-info");
            $("#status").addClass("btn-warning");
        };

        onMessageHandler(handler : any) {
            this.ws.onmessage = handler;
        };

        send(message: any) {
            this.ws.send(message);
        };

        get state() {
            return this.ws !== null ? this.ws.readyState : WebSocket.CLOSED;
        };
    }
}