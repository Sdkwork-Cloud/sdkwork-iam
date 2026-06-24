use sdkwork_router_iam_app_api::app_routes;
use sdkwork_router_iam_backend_api::backend_routes;
use sdkwork_web_contract::HttpRoute as IamHttpRoute;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct IamTauriAdapterManifest {
    pub app_routes: Vec<IamHttpRoute>,
    pub backend_routes: Vec<IamHttpRoute>,
    pub plugin_name: &'static str,
}

pub fn iam_tauri_adapter_manifest() -> IamTauriAdapterManifest {
    IamTauriAdapterManifest {
        app_routes: app_routes(),
        backend_routes: backend_routes(),
        plugin_name: "sdkwork-iam",
    }
}
