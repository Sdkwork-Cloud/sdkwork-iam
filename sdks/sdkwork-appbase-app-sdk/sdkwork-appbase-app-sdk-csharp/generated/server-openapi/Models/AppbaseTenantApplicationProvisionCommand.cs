using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SDKWork.Appbase.AppSdk.Models
{
    public class AppbaseTenantApplicationProvisionCommand
    {
        public string? AuthToken { get; set; }
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Password { get; set; }
        public string TenantId { get; set; }
        public string OrganizationId { get; set; }
        public string? TemplateId { get; set; }
        public string? AppKey { get; set; }
        public string InstanceKey { get; set; }
        public string DisplayName { get; set; }
        public string Environment { get; set; }
        public string? PrimaryDomain { get; set; }
        public List<string>? AccessPermissions { get; set; }
        public Dictionary<string, object>? RuntimeConfig { get; set; }
    }
}
