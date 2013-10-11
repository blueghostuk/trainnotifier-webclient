using System;
using System.Configuration;
using System.Linq;
using System.Web;
using TrainNotifier.Common.Model.Api;
using TrainNotifier.Common.Model.Schedule;
using TrainNotifier.WebClient.App_Code;

namespace TrainNotifier.WebClient.Handlers
{
    public class FromHandler
    {
        private readonly string _linkUrlFormat = ConfigurationManager.AppSettings["linkUrlFormat"];
        private readonly string _apiUrl = ConfigurationManager.AppSettings["apiUrl"];

        private readonly HttpResponseBase _response;
        private readonly WebApiService _webApiService;

        public FromHandler(HttpResponseBase response)
        {
            _response = response;
            _webApiService = new WebApiService(string.Concat("http://", _apiUrl));
        }

        public static bool IsFromRequest(Uri uri)
        {
            return uri.Query.Replace(HandlerHelper.QueryFragment, string.Empty).Split('/').First().Contains("from");
        }

        public void ProcessRequest(Uri url)
        {
            string atCrsCode = url.Query.Replace(HandlerHelper.QueryFragment, string.Empty).Split('/').ElementAt(1);

            StationTiploc station = _webApiService.GetStation(atCrsCode);

            _response.Write("<!DOCTYPE html><html><head>");

            DateTime today = DateTime.Now;
            DateTime startTime = today.AddHours(-1);
            DateTime endTime = today.AddHours(1);
            _response.Write(string.Format("<title>Trains from {0} on {1:dd/MM/yyyy} between {2:HH:mm} and {3:HH:mm}</title>",
                station.Description, today, startTime, endTime));
            _response.Write(string.Format("<meta name=\"description\" content=\"Trains from {0} on {1:dd/MM/yyyy} between {2:HH:mm} and {3:HH:mm}\">",
                station.Description, today, startTime, endTime));

            _response.Write("</head><body>");

            _response.Write(string.Format("<h1>Trains from {0}</h1>", station.Description));
            _response.Write(string.Format("<h2>On {0:dd/MM/yyyy} between {1:HH:mm} and {2:HH:mm}</h2>", today, startTime, endTime));
            _response.Write("<hr />");

            TrainMovementResults results = _webApiService.StartingAtStation(atCrsCode, startTime, endTime);

            _response.Write("<p>");
            foreach (var movement in results.Movements)
            {
                if (movement.Schedule == null || !movement.Schedule.Stops.Any())
                    continue;
                var schedule = movement.Schedule;
                var stops = schedule.Stops.OrderBy(s => s.StopNumber);
                string link = string.Format(_linkUrlFormat, schedule.TrainUid, today);
                _response.Write(string.Format("<a href=\"{0}\">{1}</a> {2} Departure from {3} to {4}<br />",
                    link,
                    schedule.Headcode ?? schedule.TrainUid,
                    schedule.DepartureTime,
                    _webApiService.GetTiplocCode(results.Tiplocs, stops.First().TiplocStanoxCode).StationName,
                    _webApiService.GetTiplocCode(results.Tiplocs, stops.Last().TiplocStanoxCode).StationName));
            }
            _response.Write("</p>");
            _response.Write("</body></html>");
        }
    }
}