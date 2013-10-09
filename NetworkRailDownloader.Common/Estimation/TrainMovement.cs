using System;
using System.Collections.Generic;
using TrainNotifier.Common.Model;
using TrainNotifier.Common.Model.Schedule;

namespace TrainNotifier.Common.Estimation
{
    public sealed class TrainActivation
    {
        private readonly ICollection<Step> _steps = new List<Step>();

        public string TrainId { get; set; }
        public string TrainUid { get; set; }
        public string Headcode { get; set; }
        public TrainState State { get; private set; }
        public IEnumerable<Step> Movements { get { return _steps; } }
        public DateTime Activated { get; set; }
        public bool SelfActivated { get; set; }

        public void AddStep(TrainMovementStep movement)
        {
            AddStep(new Step(movement));
        }
        private void AddStep(Step movement)
        {
            _steps.Add(movement);
        }

        public TrainActivation(TrainMovement movement)
        {
            TrainId = movement.TrainId;
            TrainUid = movement.TrainUid;
            Headcode = movement.HeadCode;
            State = TrainState.Activated;
            Activated = movement.Activated.GetValueOrDefault(DateTime.UtcNow);
            SelfActivated = false;
        }

        public TrainActivation(TrainMovementStep step)
        {
            TrainId = step.TrainId;
            //TrainUid = step.
            TrainIdTranslator trans = new TrainIdTranslator();
            trans.ParseString(step.TrainId);
            Headcode = trans.Headcode;
            State = TrainState.Activated;
            Activated = step.ActualTimeStamp;
            SelfActivated = true;
            AddStep(step);
        }

    }

    public sealed class Step
    {
        public string Stanox { get; set; }
        public TrainMovementEventType MovementType { get; set; }
        public DateTime? PlannedTimestamp { get; set; }
        public DateTime ActualTimestamp { get; set; }
        public TrainMovementVariationStatus VariationStatus { get; set; }

        public Step(TrainMovementStep step)
        {
            Stanox = step.Stanox;
            MovementType = TrainMovementEventTypeField.ParseDataString(step.EventType);
            PlannedTimestamp = step.PlannedTime;
            ActualTimestamp = step.ActualTimeStamp;
            VariationStatus = TrainMovementVariationStatusField.ParseDataString(step.VariationStatus);
        }
    }


}
