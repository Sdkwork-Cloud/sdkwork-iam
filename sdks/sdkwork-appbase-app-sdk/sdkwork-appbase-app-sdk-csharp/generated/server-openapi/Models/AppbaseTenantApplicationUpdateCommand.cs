using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SDKWork.Appbase.AppSdk.Models
{
    public class AppbaseTenantApplicationUpdateCommand
    {
        public string? AuthToken { get; set; }
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Password { get; set; }
        public string? PrimaryDomain { get; set; }
        public Dictionary<string, object>? DomainConfig { get; set; }
        public List<string>? AccessPermissions { get; set; }
        public Dictionary<string, object>? RuntimeConfig { get; set; }
    }
}
