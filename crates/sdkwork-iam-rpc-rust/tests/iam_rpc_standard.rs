use sdkwork_iam_rpc::{all_iam_rpc_service_manifests, iam_app_rpc_service_manifests};
use sdkwork_router_iam_app_api::app_routes;
use sdkwork_router_iam_backend_api::backend_routes;
use sdkwork_rpc_core::validate_manifest;

#[test]
fn iam_rpc_manifests_use_standard_packages_and_validate() {
    let manifests = all_iam_rpc_service_manifests();

    assert!(manifests
        .iter()
        .any(|manifest| manifest.package_name == "sdkwork.iam.app.v3"));
    assert!(manifests
        .iter()
        .any(|manifest| manifest.package_name == "sdkwork.iam.backend.v3"));

    for manifest in &manifests {
        assert!(validate_manifest(manifest).is_ok(), "{manifest:?}");
    }
}

#[test]
fn iam_app_rpc_owns_session_and_current_user_operations() {
    let operation_ids: Vec<&str> = iam_app_rpc_service_manifests()
        .into_iter()
        .flat_map(|manifest| {
            manifest
                .methods
                .into_iter()
                .map(|method| method.operation_id)
                .collect::<Vec<_>>()
        })
        .collect();

    assert!(operation_ids.contains(&"sessions.create"));
    assert!(operation_ids.contains(&"sessions.current.retrieve"));
    assert!(operation_ids.contains(&"sessions.current.update"));
    assert!(operation_ids.contains(&"sessions.current.delete"));
    assert!(operation_ids.contains(&"sessions.refresh"));
    assert!(operation_ids.contains(&"users.current.retrieve"));
}

#[test]
fn iam_backend_rpc_does_not_expose_login_or_session_creation() {
    let backend_operations: Vec<&str> = all_iam_rpc_service_manifests()
        .into_iter()
        .filter(|manifest| manifest.surface == "backend")
        .flat_map(|manifest| {
            manifest
                .methods
                .into_iter()
                .map(|method| method.operation_id)
                .collect::<Vec<_>>()
        })
        .collect();

    assert!(!backend_operations.contains(&"sessions.create"));
    assert!(!backend_operations
        .iter()
        .any(|operation_id| operation_id.starts_with("sessions.")));
}

#[test]
fn iam_rpc_operation_ids_are_backed_by_existing_http_route_contracts() {
    let http_operation_ids: Vec<&str> = app_routes()
        .into_iter()
        .chain(backend_routes())
        .map(|route| route.operation_id)
        .collect();

    for operation_id in all_iam_rpc_service_manifests()
        .into_iter()
        .flat_map(|manifest| {
            manifest
                .methods
                .into_iter()
                .map(|method| method.operation_id)
                .collect::<Vec<_>>()
        })
    {
        assert!(
            http_operation_ids.contains(&operation_id),
            "missing HTTP parity for {operation_id}"
        );
    }
}
