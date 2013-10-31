using System.ServiceModel;
using TrainNotifier.Common.Model.Schedule;

namespace TrainNotifier.Common.Model
{
    public interface ITrainData
    {
        string TrainId { get; set; }
    }
}
