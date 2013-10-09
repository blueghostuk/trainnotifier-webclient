using System.Collections.Generic;
using System.ServiceModel;
using TrainNotifier.Common.Estimation;
using TrainNotifier.Common.Model;
using TrainNotifier.Common.Model.Schedule;

namespace TrainNotifier.Common.Services
{
    [ServiceContract]
    [ServiceKnownType(typeof(ScheduleTrain))]
    [ServiceKnownType(typeof(ScheduleStop))]
    [ServiceKnownType(typeof(TrainMovement))]
    [ServiceKnownType(typeof(TrainMovementStep))]
    [ServiceKnownType(typeof(CancelledTrainMovementStep))]
    [ServiceKnownType(typeof(TrainChangeOfOrigin))]
    [ServiceKnownType(typeof(TrainReinstatement))]
    [ServiceKnownType(typeof(TrainActivation))]
    [ServiceKnownType(typeof(Step))]
    [ServiceKnownType(typeof(CaTD))]
    [ServiceKnownType(typeof(CbTD))]
    [ServiceKnownType(typeof(CcTD))]
    [ServiceKnownType(typeof(CtTD))]
    public interface IEstimationService
    {
        [OperationContract]
        void CacheTrainDescriberData(IEnumerable<TrainDescriber> trainData);

        [OperationContract]
        void CacheTrainData(IEnumerable<ITrainData> trainData);

        [OperationContract]
        TrainActivation GetTrainStatus(string trainId);
    }
}
