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
                "~/Scripts/jquery.cookie.js",
                "~/Scripts/jquery.ba-hashchange.js"));

            bundles.Add(new ScriptBundle("~/bundles/knockout").Include(
                "~/Scripts/knockout-{version}.js"));

            bundles.Add(new ScriptBundle("~/bundles/bootstrap").Include(
                "~/Scripts/hogan*",
                "~/Scripts/bootstrap*",
                "~/Scripts/typeahead*"));

            bundles.Add(new ScriptBundle("~/bundles/moment").Include(
                "~/Scripts/moment.js"));

            bundles.Add(new ScriptBundle("~/bundles/app").Include(
                "~/Scripts/app/global.js",
                "~/Scripts/app/webApi.js",
                "~/Scripts/app/globalSearch.js",
                "~/Scripts/app/websockets.js"));

            bundles.Add(new ScriptBundle("~/bundles/js/index").Include(
                "~/Scripts/app/index.js"));

            bundles.Add(new ScriptBundle("~/bundles/js/live").Include(
                "~/Scripts/app/live.js"));
            bundles.Add(new StyleBundle("~/bundles/css/live").Include(
                "~/Content/app/live.css"));

            bundles.Add(new ScriptBundle("~/bundles/js/ppm").Include(
                "~/Scripts/app/ppmModels.js",
                "~/Scripts/app/ppm.js"));
            bundles.Add(new StyleBundle("~/bundles/css/ppm").Include(
                "~/Content/app/ppm.css"));

            bundles.Add(new ScriptBundle("~/bundles/js/train").Include(
                "~/Scripts/app/trainModels.js",
                "~/Scripts/app/train.js"));
            bundles.Add(new StyleBundle("~/bundles/css/train").Include(
                "~/Content/app/train.css"));

            bundles.Add(new ScriptBundle("~/bundles/js/route").Include(
                "~/Scripts/app/trainModels.js",
                "~/Scripts/app/searchModels.js",
                "~/Scripts/app/routeModels.js",
                "~/Scripts/app/route.js"));
            bundles.Add(new StyleBundle("~/bundles/css/route").Include(
                "~/Content/app/route.css"));

            bundles.Add(new ScriptBundle("~/bundles/js/station").Include(
                "~/Scripts/app/station.js"));
            bundles.Add(new StyleBundle("~/bundles/css/station").Include(
                "~/Content/app/station.css"));

            bundles.Add(new ScriptBundle("~/bundles/js/search-schedule").Include(
                "~/Scripts/app/trainModels.js",
                "~/Scripts/app/searchModels.js",
                "~/Scripts/app/search-schedule.js"));
            bundles.Add(new StyleBundle("~/bundles/css/search-schedule").Include(
                "~/Content/app/search-schedule.css"));

            bundles.Add(new StyleBundle("~/Content/css").Include(
                // minification fucks this up so include seperately in _Layout.cshtml
                //"~/Content/bootstrap/spacelab.css",
                "~/Content/bootstrap/overrides.css",
                "~/Content/bootstrap/typeahead-fix.css",
                "~/Content/bootstrap-datepicker.css",
                "~/Content/app/styles.css",
                "~/Content/app/tocs.css"));
        }
    }
}