namespace SDKWork.Appbase.AppSdk.Api
{
    /// <summary>
    /// API modules for sdkwork-appbase-app-sdk
    /// </summary>
    public static class Api
    {
        public static AuthApi? Auth { get; set; }
        public static IamApi? Iam { get; set; }
        public static OauthApi? Oauth { get; set; }
        public static SystemApi? System { get; set; }
    }
}
