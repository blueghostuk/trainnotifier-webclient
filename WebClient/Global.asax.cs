using System;
using System.Web.Optimization;
using System.Web.Routing;
using TrainNotifier.WebClient.App_Start;

namespace TrainNotifier.WebClient
{
    public class Global : System.Web.HttpApplication
    {
        protected void Application_Start(object sender, EventArgs e)
        {
            BundleConfig.RegisterBundles(BundleTable.Bundles);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
        }
    }
}