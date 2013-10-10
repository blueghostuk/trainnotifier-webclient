using System;

namespace TrainNotifier.WebClient.Handlers
{
    public static class HandlerHelper
    {

        public const string QueryFragment = "?_escaped_fragment_=";

        public static bool IsGoogleRequest(Uri uri)
        {
            return uri.Query.Contains(QueryFragment);
        }
    }
}