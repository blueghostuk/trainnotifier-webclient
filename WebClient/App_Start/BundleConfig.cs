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
                "~/Scripts/app/global.js",
                "~/Scripts/app/webApi.js",
                "~/Scripts/app/globalSearch.js",
                "~/Scripts/app/websockets.js",
                "~/Scripts/app/ViewModels.js"));

            bundles.Add(new ScriptBundle("~/bundles/index").Include(
                "~/Scripts/app/index.js"));

            bundles.Add(new ScriptBundle("~/bundles/live").Include(
                "~/Scripts/app/live.js"));

            bundles.Add(new ScriptBundle("~/bundles/ppm").Include(
                "~/Scripts/app/ppm.js"));

            bundles.Add(new ScriptBundle("~/bundles/train").Include(
                "~/Scripts/app/train.js"));

            bundles.Add(new ScriptBundle("~/bundles/search-schedule").Include(
                "~/Scripts/app/search-schedule.js"));

            bundles.Add(new StyleBundle("~/Content/css").Include(
                "~/Content/spacelab.css",
                "~/Content/bootstrap-responsive.css",
                "~/Content/moment-datepicker/datepicker.css",
                "~/Content/style.css"));
        }
    }
}