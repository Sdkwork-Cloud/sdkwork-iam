using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SDKWork.Iam.AppSdk.Models
{
    public class AppbaseSessionCreateCommand
    {
        public string? Email { get; set; }
        public string? Username { get; set; }
        public string? Phone { get; set; }
        public string? Password { get; set; }
        public string? ExternalToken { get; set; }
        public string? ProviderKey { get; set; }
        public string? TenantId { get; set; }
        public string? OrganizationId { get; set; }
    }
}
