/// <reference path="global.ts" />
/// <reference path="webApi.ts" />

interface IWebSocketResponse {
    Command: string;
    Args: string;
    Response: any[];
}

interface IWebSocketTrainMovement {
    TrainId?: string;
    // in UPPERCASE
    EventType: string;
    // date time
    PlannedTime: string;
    // date time
    ActualTimeStamp: string;
    Stanox: string;
    Line: string;
    Platform: string;
    State: number;
    ScheduleStopNumber?: number;
    OffRoute: bool;
    NextStanox: string;
    // Timestamp
    ExpectedAtNextStanox: string;
}

interface IWebSocketBerthStep {
    From: string;
    To: string;
    // date time
    Time: string;
    AreaId: string;
    Description: string;
    Type: string;
}

module TrainNotifier{

    export class WebSocketCommands {
        public static BerthUpdate = "subtrainupdate-berth";
        public static LocationUpdate = "subtrainupdate";

        public static Departure = "DEPARTURE";
        public static Arrival = "ARRIVAL";
    }

    export class WebSockets{
        private ws: WebSocket;

        connect() {
            $(".btn-connect").attr("disabled", true);
            $(".btn-disconnect").attr("disabled", false);

            this.ws = new WebSocket("ws://" + TrainNotifier.Common.serverSettings.wsUrl);
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
                } catch (err) {
                    console.error(err.message);
                }
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
        }

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
        }

        onMessageHandler(handler : any) {
            this.ws.onmessage = handler;
        }

        send(message: any) {
            this.ws.send(message);
        }

        get state() {
            return this.ws !== null ? this.ws.readyState : WebSocket.CLOSED;
        }
    }
}