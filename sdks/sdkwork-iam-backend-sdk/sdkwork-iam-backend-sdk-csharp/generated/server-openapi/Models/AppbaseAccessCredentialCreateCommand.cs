using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SDKWork.Iam.BackendSdk.Models
{
    public class AppbaseAccessCredentialCreateCommand
    {
        public string? AuthToken { get; set; }
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Password { get; set; }
        public string TenantId { get; set; }
        public string OrganizationId { get; set; }
        public string? TenantApplicationId { get; set; }
        public string? AppId { get; set; }
        public string? InstanceKey { get; set; }
    }
}
