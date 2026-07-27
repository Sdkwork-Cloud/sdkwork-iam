using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SDKWork.Iam.AppSdk.Models
{
    public class WechatMiniProgramSessionCreateCommand
    {
        public string JsCode { get; set; }
        public string? ProviderCode { get; set; }
        public string? SurfaceCode { get; set; }
    }
}
