using System.Web.Optimization;

namespace TrainNotifier.WebClient
{
    public static class BundleConfig
    {
        // For more information on Bundling, visit http://go.microsoft.com/fwlink/?LinkId=254725
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/bundles/jquery").Include(
                "~/Scripts/jquery-{version}.js",
                "~/Scripts/jquery.color-{version}.js",
                "~/Scripts/jquery.ba-hashchange.js"));

            bundles.Add(new ScriptBundle("~/bundles/knockout").Include(
                "~/Scripts/knockout-{version}.js",
                "~/Scripts/knockout.mapping-latest.js"));

            bundles.Add(new ScriptBundle("~/bundles/bootstrap").Include(
                "~/Scripts/bootstrap*"));

            bundles.Add(new ScriptBundle("~/bundles/moment").Include(
                "~/Scripts/moment.js",
                "~/Scripts/moment-datepicker.js"));

            bundles.Add(new ScriptBundle("~/bundles/app").Include(
                "~/Scripts/websockets.js",
                "~/Scripts/ajax-lookups.js",
                "~/Scripts/mapping.js",
                "~/Scripts/ViewModels.js"));

            bundles.Add(new ScriptBundle("~/bundles/default").Include(
                "~/Scripts/default.js"));

            bundles.Add(new ScriptBundle("~/bundles/live").Include(
                "~/Scripts/live.js"));

            bundles.Add(new ScriptBundle("~/bundles/train").Include(
                "~/Scripts/train.js"));

            bundles.Add(new ScriptBundle("~/bundles/search-schedule").Include(
                "~/Scripts/search-schedule.js"));

            bundles.Add(new StyleBundle("~/Content/css").Include(
                "~/Content/bootstrap.css",
                "~/Content/bootstrap-responsive.css",
                "~/Content/spacelab.css",
                "~/Content/style.css"));
        }
    }
}