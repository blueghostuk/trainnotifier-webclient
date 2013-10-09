using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using TrainNotifier.Common.Model.Api;
using TrainNotifier.Common.Model.Schedule;

namespace TrainNotifier.WebClient.App_Code
{
    /// <summary>
    /// Calls the web api endpoint to get data.
    /// Used for google indexed pages
    /// </summary>
    public class WebApiService
    {
        private readonly string _baseUrl;

        public WebApiService(string baseUrl)
        {
            _baseUrl = baseUrl;
        }

        private string GetRequest(string url)
        {
            HttpWebRequest request = HttpWebRequest.CreateHttp(string.Concat(_baseUrl, url));
            using (var response = request.GetResponse())
            using (Stream receiveStream = response.GetResponseStream())
            using (StreamReader readStream = new StreamReader(receiveStream, Encoding.UTF8))
                return readStream.ReadToEnd();
        }

        public StationTiploc GetStation(string crsCode)
        {
            return JsonConvert.DeserializeObject<StationTiploc>(GetRequest(string.Format("/Stanox/?GetByCRS&crsCode={0}", crsCode)));
        }

        public TrainMovementResults CallingAtStation(string crsCode, DateTime startDate, DateTime endDate)
        {
            return JsonConvert.DeserializeObject<TrainMovementResults>(GetRequest(string.Format("/TrainMovement/CallingAt/Station/{0}?startDate={1}&endDate={2}", 
                crsCode, startDate, endDate)));
        }

        public StationTiploc GetTiplocCode(IEnumerable<StationTiploc> tiplocs, string tiplocStanoxCode)
        {
            return tiplocs.FirstOrDefault(t => t.Stanox == tiplocStanoxCode);
        }
    }
}