using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SDKWork.Appbase.AppSdk.Models
{
    public class FieldError
    {
        public string Field { get; set; }
        public string Message { get; set; }
        public string? Code { get; set; }
    }
}
