using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SDKWork.Appbase.AppSdk.Models
{
    public class AppbaseApplicationRegisterCommand
    {
        public string? AuthToken { get; set; }
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Password { get; set; }
        public string? OwnerTenantId { get; set; }
        public string AppKey { get; set; }
        public string Name { get; set; }
        public string? DisplayName { get; set; }
        public string AppType { get; set; }
        public string? PackageName { get; set; }
        public string? BundleId { get; set; }
        public string? DesktopAppId { get; set; }
        public string Version { get; set; }
        public string? Channel { get; set; }
        public string? ManifestHash { get; set; }
        public List<string> DefaultAccessPermissions { get; set; }
        public Dictionary<string, object>? Config { get; set; }
        public List<Dictionary<string, object>>? Packages { get; set; }
    }
}
