using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Web;

namespace TrainNotifier.WebClient
{
    public static class VersionInfo
    {
        public static readonly DateTime CreationTime
            = File.GetCreationTime(Assembly.GetExecutingAssembly().Location);
    }
}