using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SDKWork.Iam.AppSdk.Models
{
    public class FieldError
    {
        public string Field { get; set; }
        public string Message { get; set; }
        public int? Code { get; set; }
        public string? I18nKey { get; set; }
        public Dictionary<string, string>? Params { get; set; }
    }
}
