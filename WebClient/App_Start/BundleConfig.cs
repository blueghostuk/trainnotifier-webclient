using System.Web.Optimization;

namespace TrainNotifier.WebClient
{
    public class BundleConfig
    {
        // For more information on Bundling, visit http://go.microsoft.com/fwlink/?LinkId=254725
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/bundles/jquery").Include(
                "~/Scripts/jquery-{version}.js"));

            bundles.Add(new ScriptBundle("~/bundles/knockout").Include(
                "~/Scripts/knockout-{version}.js"));

            bundles.Add(new ScriptBundle("~/bundles/bootstrap").Include(
                "~/Scripts/bootstrap*"));

            bundles.Add(new ScriptBundle("~/bundles/app").Include(
                "~/Scripts/websockets.js",
                "~/Scripts/ajax-lookups.js",
                "~/Scripts/mapping.js",
                "~/Scripts/ViewModels.js"));

            bundles.Add(new StyleBundle("~/Content/css").Include(
                "~/Content/bootstrap.css",
                "~/Content/bootstrap-responsive.min.css",
                "~/Content/style.css"));
        }
    }
}