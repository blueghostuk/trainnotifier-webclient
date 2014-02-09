using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using TrainNotifier.Common.Model.Schedule;
using TrainNotifier.Common.Web;

namespace WindowsApp.Data
{
    public sealed class TrainApiDataSource
    {
        private static readonly TrainApiDataSource _dataSource = new TrainApiDataSource();
        private static readonly WebApiService _webApiService = new WebApiService(
            "http://api.trainnotifier.co.uk", "windowsApp");

        private ObservableCollection<StationTiploc> _stations = new ObservableCollection<StationTiploc>();
        public ObservableCollection<StationTiploc> Stations
        {
            get { return this._stations; }
        }

        public static async Task<IEnumerable<StationTiploc>> GetStationsAsync()
        {
            await _dataSource.GeStationsDataAsync();

            return _dataSource.Stations;
        }

        private async Task GeStationsDataAsync()
        {
            if (this._stations.Count != 0)
                return;

            IEnumerable<StationTiploc> stations = await _webApiService.GetStations();

            foreach (var station in stations)
            {
                _dataSource._stations.Add(station);
            }
        }
    }
}