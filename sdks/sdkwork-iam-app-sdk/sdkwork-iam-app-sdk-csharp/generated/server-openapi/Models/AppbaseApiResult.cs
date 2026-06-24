using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SDKWork.Iam.AppSdk.Models
{
    public class AppbaseApiResult
    {
        public string Code { get; set; }
        public string Message { get; set; }
        public string RequestId { get; set; }
        public Dictionary<string, object> Data { get; set; }
    }
}
