using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;
using TrainNotifier.Common.Model.Api;
using TrainNotifier.WebClient.App_Code;

namespace TrainNotifier.WebClient.Handlers
{
    public class TrainHandler
    {
        private readonly string _linkUrlFormat = ConfigurationManager.AppSettings["linkUrlFormat"];
        private readonly string _apiUrl = ConfigurationManager.AppSettings["apiUrl"];

        private readonly HttpResponseBase _response;
        private readonly WebApiService _webApiService;

        public TrainHandler(HttpResponseBase response)
        {
            _response = response;
            _webApiService = new WebApiService(string.Concat("http://", _apiUrl));
        }

        public static bool IsTrainRequest(Uri uri)
        {
            return uri.Query.Replace(HandlerHelper.QueryFragment, string.Empty).Split('/').First().Contains("get");
        }

        public void ProcessRequest(Uri url)
        {
            var parts = url.Query.Replace(HandlerHelper.QueryFragment, string.Empty).Split('/');
            string trainUid = parts.ElementAt(1);
            DateTime date = DateTime.Parse(parts.ElementAt(2));

            SingleTrainMovementResult result = _webApiService.GetTrainMovement(trainUid, date);

            if (result == null || result.Movement == null)
                return;

            var schedule = result.Movement.Schedule;
            var stops = result.Movement.Schedule.Stops.OrderBy(s => s.StopNumber);
            if (!stops.Any())
                return;

            _response.Write("<!DOCTYPE html><html><head>");

            string message = string.Format("{0} from {1} to {2} on {3}",
                schedule.TrainUid,
                _webApiService.GetTiplocCode(result.Tiplocs, stops.First().TiplocStanoxCode).StationName,
                _webApiService.GetTiplocCode(result.Tiplocs, stops.Last().TiplocStanoxCode).StationName,
                date);

            _response.Write(string.Format("<title>{0}</title>", message));

            _response.Write(string.Format("<meta name=\"description\" content=\"{0}\">",message));

            _response.Write("</head><body>");
            
            _response.Write(string.Format("<h1>{0}</h1>",message));
            _response.Write("<hr />");

            _response.Write("<p>");

            foreach (var stop in stops)
            {
                _response.Write(string.Format("Calling at {0} at {1}<br />",
                    _webApiService.GetTiplocCode(result.Tiplocs, stop.TiplocStanoxCode).StationName,
                    stop.PublicDeparture ?? stop.Departure ?? stop.Pass ?? stop.PublicArrival ?? stop.Arrival));
            }
            _response.Write("</p>");
            _response.Write("</body></html>");
        }
    }
}