using System;
using System.Web.Optimization;

namespace TrainNotifier.WebClient
{
    public class Global : System.Web.HttpApplication
    {
        protected void Application_Start(object sender, EventArgs e)
        {
            BundleConfig.RegisterBundles(BundleTable.Bundles);
        }
    }
}