using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using TrainNotifier.Common.Model.Api;
using TrainNotifier.Common.Model.Schedule;

namespace TrainNotifier.Common.Web
{
    /// <summary>
    /// Calls the web api endpoint to get data.
    /// Used for google indexed pages
    /// </summary>
    public class WebApiService
    {
        private readonly string _baseUrl;
        private readonly string _apiName;

        public WebApiService(string baseUrl, string apiName)
        {
            _baseUrl = baseUrl;
            _apiName = apiName;
        }

        private Task<string> GetRequest(string url)
        {
            HttpWebRequest request = HttpWebRequest.CreateHttp(string.Concat(_baseUrl, url));
            Task<WebResponse> task = Task.Factory.FromAsync(
                request.BeginGetResponse,
                asyncResult => request.EndGetResponse(asyncResult),
                null);
            return task.ContinueWith(t => ReadStreamFromResponse(t.Result));
        }

        private static string ReadStreamFromResponse(WebResponse response)
        {
            using (var responseStream = response.GetResponseStream())
            using (var reader = new StreamReader(responseStream))
            {
                var content = reader.ReadToEnd();
                return content;
            }
        }
        public async Task<IEnumerable<StationTiploc>> GetStations()
        {
            return JsonConvert.DeserializeObject<IEnumerable<StationTiploc>>(
                await GetRequest(string.Format("/Station/?apiName={0}", 
                _apiName)));
        }

        public async Task<StationTiploc> GetStation(string crsCode)
        {
            return JsonConvert.DeserializeObject<StationTiploc>(
                await GetRequest(string.Format("/Stanox/?GetByCRS&crsCode={0}&apiName={1}", 
                crsCode, _apiName)));
        }

        public async Task<TrainMovementResults> CallingAtStation(string crsCode, DateTime startDate, DateTime endDate)
        {
            return JsonConvert.DeserializeObject<TrainMovementResults>(
                await GetRequest(string.Format("/TrainMovement/CallingAt/Station/{0}?startDate={1}&endDate={2}&apiName={3}", 
                crsCode, startDate, endDate, _apiName)));
        }

        public async Task<TrainMovementResults> StartingAtStation(string crsCode, DateTime startDate, DateTime endDate)
        {
            return JsonConvert.DeserializeObject<TrainMovementResults>(
                await GetRequest(string.Format("/TrainMovement/StartingAt/Station/{0}?startDate={1}&endDate={2}&apiName={3}",
                crsCode, startDate, endDate, _apiName)));
        }

        public async Task<TrainMovementResults> TerminatingAtStation(string crsCode, DateTime startDate, DateTime endDate)
        {
            return JsonConvert.DeserializeObject<TrainMovementResults>(
                await GetRequest(string.Format("/TrainMovement/TerminatingAt/Station/{0}?startDate={1}&endDate={2}&apiName={3}",
                crsCode, startDate, endDate, _apiName)));
        }

        public async Task<SingleTrainMovementResult> GetTrainMovement(string uid, DateTime date)
        {
            return JsonConvert.DeserializeObject<SingleTrainMovementResult>(
                await GetRequest(string.Format("/TrainMovement/Uid/{0}/{1:yyyy-MM-dd}?apiName={2}",
                uid, date, _apiName)));
        }

        public static StationTiploc GetTiplocCode(IEnumerable<StationTiploc> tiplocs, string tiplocStanoxCode)
        {
            return tiplocs.FirstOrDefault(t => t.Stanox.Equals(tiplocStanoxCode, StringComparison.CurrentCultureIgnoreCase));
        }
    }
}