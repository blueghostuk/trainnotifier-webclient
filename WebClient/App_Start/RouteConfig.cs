using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Routing;

namespace TrainNotifier.WebClient.App_Start
{
    public static class RouteConfig
    {
        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.Add(new Route("trains/{uid}/{year}/{month}/{day}", 
                null,
                new RouteValueDictionary
                {
                    {"uid", "[A-Z0-9 ]{6}"},
                    {"year", "[0-9]{4}"},
                    {"month", "[0-9]{2}"},
                    {"day", "[0-9]{2}"}
                },
                new TrainByUidRouteHandler()));

            routes.Add(new Route("search/from/{crsA}/to/{crsB}/{year}/{month}/{day}/{time}",
                null,
                new RouteValueDictionary
                {
                    {"crsA", "[A-Z]{3}"},
                    {"crsB", "[A-Z]{3}"},
                    {"year", "[0-9]{4}"},
                    {"month", "[0-9]{2}"},
                    {"day", "[0-9]{2}"},
                    {"time", "[0-9]{2}-[0-9]{2}"}
                },
                new SearchRouteHandler(SearchRouteHandler.SearchMethod.Between)));

            routes.Add(new Route("search/from/{crsA}/to/{crsB}/{year}/{month}/{day}",
                null,
                new RouteValueDictionary
                {
                    {"crsA", "[A-Z]{3}"},
                    {"crsB", "[A-Z]{3}"},
                    {"year", "[0-9]{4}"},
                    {"month", "[0-9]{2}"},
                    {"day", "[0-9]{2}"}
                },
                new SearchRouteHandler(SearchRouteHandler.SearchMethod.Between)));

            routes.Add(new Route("search/from/{crsA}/to/{crsB}/",
                null,
                new RouteValueDictionary
                {
                    {"crsA", "[A-Z]{3}"},
                    {"crsB", "[A-Z]{3}"}
                },
                new SearchRouteHandler(SearchRouteHandler.SearchMethod.Between)));

            routes.Add(new Route("search/from/{crsA}/{year}/{month}/{day}/{time}",
                null,
                new RouteValueDictionary
                {
                    {"crsA", "[A-Z]{3}"},
                    {"year", "[0-9]{4}"},
                    {"month", "[0-9]{2}"},
                    {"day", "[0-9]{2}"},
                    {"time", "[0-9]{2}-[0-9]{2}"}
                },
                new SearchRouteHandler(SearchRouteHandler.SearchMethod.From)));

            routes.Add(new Route("search/from/{crsA}/{year}/{month}/{day}",
                null,
                new RouteValueDictionary
                {
                    {"crsA", "[A-Z]{3}"},
                    {"year", "[0-9]{4}"},
                    {"month", "[0-9]{2}"},
                    {"day", "[0-9]{2}"}
                },
                new SearchRouteHandler(SearchRouteHandler.SearchMethod.From)));

            routes.Add(new Route("search/from/{crsA}",
                null,
                new RouteValueDictionary
                {
                    {"crsA", "[A-Z]{3}"}
                },
                new SearchRouteHandler(SearchRouteHandler.SearchMethod.From)));

            routes.Add(new Route("search/to/{crsA}/{year}/{month}/{day}/{time}",
                null,
                new RouteValueDictionary
                {
                    {"crsA", "[A-Z]{3}"},
                    {"year", "[0-9]{4}"},
                    {"month", "[0-9]{2}"},
                    {"day", "[0-9]{2}"},
                    {"time", "[0-9]{2}-[0-9]{2}"}
                },
                new SearchRouteHandler(SearchRouteHandler.SearchMethod.To)));

            routes.Add(new Route("search/to/{crsA}/{year}/{month}/{day}",
                null,
                new RouteValueDictionary
                {
                    {"crsA", "[A-Z]{3}"},
                    {"year", "[0-9]{4}"},
                    {"month", "[0-9]{2}"},
                    {"day", "[0-9]{2}"}
                },
                new SearchRouteHandler(SearchRouteHandler.SearchMethod.To)));

            routes.Add(new Route("search/to/{crsA}",
                null,
                new RouteValueDictionary
                {
                    {"crsA", "[A-Z]{3}"}
                },
                new SearchRouteHandler(SearchRouteHandler.SearchMethod.To)));

            routes.Add(new Route("search/at/{crsA}/{year}/{month}/{day}/{time}",
                null,
                new RouteValueDictionary
                {
                    {"crsA", "[A-Z]{3}"},
                    {"year", "[0-9]{4}"},
                    {"month", "[0-9]{2}"},
                    {"day", "[0-9]{2}"},
                    {"time", "[0-9]{2}-[0-9]{2}"}
                },
                new SearchRouteHandler(SearchRouteHandler.SearchMethod.At)));

            routes.Add(new Route("search/at/{crsA}/{year}/{month}/{day}",
                null,
                new RouteValueDictionary
                {
                    {"crsA", "[A-Z]{3}"},
                    {"year", "[0-9]{4}"},
                    {"month", "[0-9]{2}"},
                    {"day", "[0-9]{2}"}
                },
                new SearchRouteHandler(SearchRouteHandler.SearchMethod.At)));

            routes.Add(new Route("search/at/{crsA}",
                null,
                new RouteValueDictionary
                {
                    {"crsA", "[A-Z]{3}"}
                },
                new SearchRouteHandler(SearchRouteHandler.SearchMethod.At)));
        }
    }

    class TrainByUidRouteHandler : IRouteHandler
    {
        public System.Web.IHttpHandler GetHttpHandler(RequestContext requestContext)
        {
            return new TrainByUidHttpHandler(
                requestContext.RouteData.Values["uid"].ToString(),
                int.Parse(requestContext.RouteData.Values["year"].ToString()),
                int.Parse(requestContext.RouteData.Values["month"].ToString()),
                int.Parse(requestContext.RouteData.Values["day"].ToString()));
        }

        class TrainByUidHttpHandler : IHttpHandler
        {
            private readonly string _trainUid;
            private readonly DateTime _date;

            public TrainByUidHttpHandler(string trainUid, int year, int month, int day)
            {
                _trainUid = trainUid;
                _date = new DateTime(year, month, day);
            }

            public bool IsReusable
            {
                get { return false; }
            }

            public void ProcessRequest(HttpContext context)
            {
                context.Response.RedirectPermanent(string.Format("~/train#getuid/{0}/{1:yyyy-MM-dd}", _trainUid, _date));
            }
        }
    }

    class SearchRouteHandler : IRouteHandler
    {
        private readonly SearchMethod _method;

        public SearchRouteHandler(SearchMethod method)
        {
            _method = method;
        }

        public System.Web.IHttpHandler GetHttpHandler(RequestContext requestContext)
        {
            return new SearchHttpHandler(_method, requestContext.RouteData.Values);
        }

        public enum SearchMethod
        {
            From,
            To,
            At,
            Between
        }

        class SearchHttpHandler : IHttpHandler
        {
            private readonly SearchMethod _method;
            private readonly string _crsA,
                _crsB;
            private readonly DateTime _date;
            private readonly string _time;

            public SearchHttpHandler(SearchMethod method, IDictionary<string, object> values)
            {
                _method = method;
                if (values.ContainsKey("crsA"))
                    _crsA = values["crsA"].ToString();
                if (values.ContainsKey("crsB"))
                    _crsB = values["crsB"].ToString();

                if (values.ContainsKey("year") && values.ContainsKey("month") && values.ContainsKey("day"))
                {
                    _date = new DateTime(
                        int.Parse(values["year"].ToString()),
                        int.Parse(values["month"].ToString()),
                        int.Parse(values["day"].ToString()));
                }
                else
                {
                    _date = DateTime.UtcNow.Date;
                }
                if (values.ContainsKey("time"))
                    _time = "/" + values["time"].ToString();
            }

            public bool IsReusable
            {
                get { return false; }
            }

            public void ProcessRequest(HttpContext context)
            {
                string url = null;
                switch (_method)
                {
                    case SearchMethod.From:
                        url = string.Format("~/search-schedule#listorigin-crs/{0}/{1:yyyy-MM-dd}{2}", _crsA, _date, _time);
                        break;
                    case SearchMethod.To:
                        url = string.Format("~/search-schedule#listdest-crs/{0}/{1:yyyy-MM-dd}{2}", _crsA, _date, _time);
                        break;
                    case SearchMethod.At:
                        url = string.Format("~/search-schedule#liststation-crs/{0}/{1:yyyy-MM-dd}{2}", _crsA, _date, _time);
                        break;
                    case SearchMethod.Between:
                        url = string.Format("~/search-schedule#list-crs/{0}/list-crs/{1}/{2:yyyy-MM-dd}{3}", _crsA, _crsB, _date, _time);
                        break;
                }
                context.Response.RedirectPermanent(url);
            }
        }
    }
}