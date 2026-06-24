from typing import Any, Dict, List, Optional
from ..http_client import HttpClient
from ..models import AppbaseApiResult

def _append_query_string(path: str, raw_query_string: str) -> str:
    query = raw_query_string.lstrip('?')
    if not query:
        return path
    separator = '&' if '?' in path else '?'
    return f"{path}{separator}{query}"

def serialize_path_parameter(value: Any, spec: Dict[str, Any]) -> str:
    if value is None:
        return ''

    style = str(spec.get('style') or 'simple')
    name = str(spec.get('name') or '')
    explode = bool(spec.get('explode'))
    if isinstance(value, (list, tuple)):
        return serialize_path_array(name, value, style, explode)
    if isinstance(value, dict):
        return serialize_path_object(name, value, style, explode)
    return path_prefix(name, style) + encode_path_value(serialize_path_primitive(value))


def serialize_path_array(name: str, values: Any, style: str, explode: bool) -> str:
    serialized = [encode_path_value(serialize_path_primitive(item)) for item in values if item is not None]
    if not serialized:
        return path_prefix(name, style)
    if style == 'matrix':
        return ''.join(f";{name}={item}" for item in serialized) if explode else f";{name}={','.join(serialized)}"
    return path_prefix(name, style) + ('.' if explode else ',').join(serialized)


def serialize_path_object(name: str, value: Dict[str, Any], style: str, explode: bool) -> str:
    entries = [(key, entry_value) for key, entry_value in value.items() if entry_value is not None]
    if not entries:
        return path_prefix(name, style)
    if style == 'matrix':
        if explode:
            return ''.join(f";{encode_path_value(str(key))}={encode_path_value(serialize_path_primitive(entry_value))}" for key, entry_value in entries)
        serialized = ','.join(item for key, entry_value in entries for item in (encode_path_value(str(key)), encode_path_value(serialize_path_primitive(entry_value))))
        return f";{name}={serialized}"
    if explode:
        separator = '.' if style == 'label' else ','
        serialized = separator.join(f"{encode_path_value(str(key))}={encode_path_value(serialize_path_primitive(entry_value))}" for key, entry_value in entries)
    else:
        serialized = ','.join(item for key, entry_value in entries for item in (encode_path_value(str(key)), encode_path_value(serialize_path_primitive(entry_value))))
    return path_prefix(name, style) + serialized


def path_prefix(name: str, style: str) -> str:
    if style == 'label':
        return '.'
    if style == 'matrix':
        return f";{name}"
    return ''


def encode_path_value(value: str) -> str:
    from urllib.parse import quote

    return quote(value, safe='')


def serialize_path_primitive(value: Any) -> str:
    if isinstance(value, dict):
        import json

        return json.dumps(value, separators=(',', ':'))
    return str(value)


def build_query_string(parameters: List[Dict[str, Any]]) -> str:
    pairs: List[str] = []
    for parameter in parameters:
        append_serialized_parameter(pairs, parameter)
    return '&'.join(pairs)


def append_serialized_parameter(pairs: List[str], parameter: Dict[str, Any]) -> None:
    value = parameter.get('value')
    if value is None:
        return

    name = str(parameter.get('name') or '')
    allow_reserved = bool(parameter.get('allow_reserved'))
    content_type = parameter.get('content_type')
    if content_type:
        import json

        pairs.append(f"{encode_query_component(name)}={encode_query_value(json.dumps(value, separators=(',', ':')), allow_reserved)}")
        return

    style = str(parameter.get('style') or 'form')
    explode = bool(parameter.get('explode'))
    if style == 'deepObject':
        append_deep_object_parameter(pairs, name, value, allow_reserved)
        return
    if isinstance(value, (list, tuple)):
        append_array_parameter(pairs, name, value, style, explode, allow_reserved)
        return
    if isinstance(value, dict):
        append_object_parameter(pairs, name, value, style, explode, allow_reserved)
        return

    pairs.append(f"{encode_query_component(name)}={encode_query_value(serialize_primitive(value), allow_reserved)}")


def append_array_parameter(
    pairs: List[str],
    name: str,
    value: Any,
    style: str,
    explode: bool,
    allow_reserved: bool,
) -> None:
    values = [serialize_primitive(item) for item in value if item is not None]
    if not values:
        return

    if style == 'form' and explode:
        for item in values:
            pairs.append(f"{encode_query_component(name)}={encode_query_value(item, allow_reserved)}")
        return

    pairs.append(f"{encode_query_component(name)}={encode_query_value(','.join(values), allow_reserved)}")


def append_object_parameter(
    pairs: List[str],
    name: str,
    value: Dict[str, Any],
    style: str,
    explode: bool,
    allow_reserved: bool,
) -> None:
    entries = [(key, entry_value) for key, entry_value in value.items() if entry_value is not None]
    if not entries:
        return

    if style == 'form' and explode:
        for key, entry_value in entries:
            pairs.append(f"{encode_query_component(str(key))}={encode_query_value(serialize_primitive(entry_value), allow_reserved)}")
        return

    serialized = ','.join(
        item
        for key, entry_value in entries
        for item in (str(key), serialize_primitive(entry_value))
    )
    pairs.append(f"{encode_query_component(name)}={encode_query_value(serialized, allow_reserved)}")


def append_deep_object_parameter(pairs: List[str], name: str, value: Any, allow_reserved: bool) -> None:
    if not isinstance(value, dict):
        pairs.append(f"{encode_query_component(name)}={encode_query_value(serialize_primitive(value), allow_reserved)}")
        return

    for key, entry_value in value.items():
        if entry_value is None:
            continue
        pairs.append(f"{encode_query_component(f'{name}[{key}]')}={encode_query_value(serialize_primitive(entry_value), allow_reserved)}")


def serialize_primitive(value: Any) -> str:
    if isinstance(value, dict):
        import json

        return json.dumps(value, separators=(',', ':'))
    return str(value)


def encode_query_component(value: str) -> str:
    from urllib.parse import quote

    return quote(value, safe='')


def encode_query_value(value: str, allow_reserved: bool) -> str:
    from urllib.parse import quote

    return quote(value, safe=':/?#[]@!$&\'()*+,;=' if allow_reserved else '')



class IamOauthApi:
    """iam_oauth iam_oauth API client."""

    def __init__(self, client: HttpClient):
        self._client = client
        self.iam = IamOauthIamApi(client)


class IamOauthIamApi:
    """iam_oauth iam_oauth.iam API client."""

    def __init__(self, client: HttpClient):
        self._client = client
        self.oauth = IamOauthIamOauthApi(client)


class IamOauthIamOauthApi:
    """iam_oauth iam_oauth.iam.oauth API client."""

    def __init__(self, client: HttpClient):
        self._client = client
        self.account_links = IamOauthIamOauthAccountLinksApi(client)
        self.callback_events = IamOauthIamOauthCallbackEventsApi(client)
        self.claim_mappings = IamOauthIamOauthClaimMappingsApi(client)
        self.clients = IamOauthIamOauthClientsApi(client)
        self.diagnostic_runs = IamOauthIamOauthDiagnosticRunsApi(client)
        self.flow_configs = IamOauthIamOauthFlowConfigsApi(client)
        self.grants = IamOauthIamOauthGrantsApi(client)
        self.integrations = IamOauthIamOauthIntegrationsApi(client)
        self.operational_resources = IamOauthIamOauthOperationalResourcesApi(client)
        self.operator_platforms = IamOauthIamOauthOperatorPlatformsApi(client)
        self.policies = IamOauthIamOauthPoliciesApi(client)
        self.provider_catalog = IamOauthIamOauthProviderCatalogApi(client)
        self.resource_accounts = IamOauthIamOauthResourceAccountsApi(client)
        self.resource_authorizations = IamOauthIamOauthResourceAuthorizationsApi(client)
        self.scope_profiles = IamOauthIamOauthScopeProfilesApi(client)
        self.secrets = IamOauthIamOauthSecretsApi(client)
        self.surfaces = IamOauthIamOauthSurfacesApi(client)
        self.tenant_bindings = IamOauthIamOauthTenantBindingsApi(client)
        self.webhook_configs = IamOauthIamOauthWebhookConfigsApi(client)


class IamOauthIamOauthAccountLinksApi:
    """iam_oauth iam_oauth.iam.oauth.account_links API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Iam oauth account Links list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/oauth/account_links", query))

    def update(self, account_link_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Iam oauth account Links update."""
        return self._client.patch(f"/backend/v3/api/iam/oauth/account_links/{serialize_path_parameter(account_link_id, {'name': 'accountLinkId', 'style': 'simple', 'explode': False})}", json=body)

class IamOauthIamOauthCallbackEventsApi:
    """iam_oauth iam_oauth.iam.oauth.callback_events API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Iam oauth callback Events list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/oauth/callback_events", query))

class IamOauthIamOauthClaimMappingsApi:
    """iam_oauth iam_oauth.iam.oauth.claim_mappings API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Iam oauth claim Mappings list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/oauth/claim_mappings", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Iam oauth claim Mappings create."""
        return self._client.post(f"/backend/v3/api/iam/oauth/claim_mappings", json=body)

    def update(self, mapping_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Iam oauth claim Mappings update."""
        return self._client.patch(f"/backend/v3/api/iam/oauth/claim_mappings/{serialize_path_parameter(mapping_id, {'name': 'mappingId', 'style': 'simple', 'explode': False})}", json=body)

class IamOauthIamOauthClientsApi:
    """iam_oauth iam_oauth.iam.oauth.clients API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Iam oauth clients list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/oauth/clients", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Iam oauth clients create."""
        return self._client.post(f"/backend/v3/api/iam/oauth/clients", json=body)

    def delete(self, oauth_client_id: str) -> AppbaseApiResult:
        """Iam oauth clients delete."""
        return self._client.delete(f"/backend/v3/api/iam/oauth/clients/{serialize_path_parameter(oauth_client_id, {'name': 'oauthClientId', 'style': 'simple', 'explode': False})}")

    def retrieve(self, oauth_client_id: str) -> AppbaseApiResult:
        """Iam oauth clients retrieve."""
        return self._client.get(f"/backend/v3/api/iam/oauth/clients/{serialize_path_parameter(oauth_client_id, {'name': 'oauthClientId', 'style': 'simple', 'explode': False})}")

    def update(self, oauth_client_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Iam oauth clients update."""
        return self._client.patch(f"/backend/v3/api/iam/oauth/clients/{serialize_path_parameter(oauth_client_id, {'name': 'oauthClientId', 'style': 'simple', 'explode': False})}", json=body)

class IamOauthIamOauthDiagnosticRunsApi:
    """iam_oauth iam_oauth.iam.oauth.diagnostic_runs API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Iam oauth diagnostic Runs list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/oauth/diagnostic_runs", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Iam oauth diagnostic Runs create."""
        return self._client.post(f"/backend/v3/api/iam/oauth/diagnostic_runs", json=body)

    def retrieve(self, diagnostic_run_id: str) -> AppbaseApiResult:
        """Iam oauth diagnostic Runs retrieve."""
        return self._client.get(f"/backend/v3/api/iam/oauth/diagnostic_runs/{serialize_path_parameter(diagnostic_run_id, {'name': 'diagnosticRunId', 'style': 'simple', 'explode': False})}")

class IamOauthIamOauthFlowConfigsApi:
    """iam_oauth iam_oauth.iam.oauth.flow_configs API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Iam oauth flow Configs list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/oauth/flow_configs", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Iam oauth flow Configs create."""
        return self._client.post(f"/backend/v3/api/iam/oauth/flow_configs", json=body)

    def update(self, flow_config_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Iam oauth flow Configs update."""
        return self._client.patch(f"/backend/v3/api/iam/oauth/flow_configs/{serialize_path_parameter(flow_config_id, {'name': 'flowConfigId', 'style': 'simple', 'explode': False})}", json=body)

class IamOauthIamOauthGrantsApi:
    """iam_oauth iam_oauth.iam.oauth.grants API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Iam oauth grants list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/oauth/grants", query))

    def delete(self, grant_id: str) -> AppbaseApiResult:
        """Iam oauth grants delete."""
        return self._client.delete(f"/backend/v3/api/iam/oauth/grants/{serialize_path_parameter(grant_id, {'name': 'grantId', 'style': 'simple', 'explode': False})}")

class IamOauthIamOauthIntegrationsApi:
    """iam_oauth iam_oauth.iam.oauth.integrations API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Iam oauth integrations list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/oauth/integrations", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Iam oauth integrations create."""
        return self._client.post(f"/backend/v3/api/iam/oauth/integrations", json=body)

    def delete(self, integration_id: str) -> AppbaseApiResult:
        """Iam oauth integrations delete."""
        return self._client.delete(f"/backend/v3/api/iam/oauth/integrations/{serialize_path_parameter(integration_id, {'name': 'integrationId', 'style': 'simple', 'explode': False})}")

    def retrieve(self, integration_id: str) -> AppbaseApiResult:
        """Iam oauth integrations retrieve."""
        return self._client.get(f"/backend/v3/api/iam/oauth/integrations/{serialize_path_parameter(integration_id, {'name': 'integrationId', 'style': 'simple', 'explode': False})}")

    def update(self, integration_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Iam oauth integrations update."""
        return self._client.patch(f"/backend/v3/api/iam/oauth/integrations/{serialize_path_parameter(integration_id, {'name': 'integrationId', 'style': 'simple', 'explode': False})}", json=body)

class IamOauthIamOauthOperationalResourcesApi:
    """iam_oauth iam_oauth.iam.oauth.operational_resources API client."""

    def __init__(self, client: HttpClient):
        self._client = client
        self.publishes = IamOauthIamOauthOperationalResourcesPublishesApi(client)


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Iam oauth operational Resources list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/oauth/operational_resources", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Iam oauth operational Resources create."""
        return self._client.post(f"/backend/v3/api/iam/oauth/operational_resources", json=body)

    def delete(self, resource_id: str) -> AppbaseApiResult:
        """Iam oauth operational Resources delete."""
        return self._client.delete(f"/backend/v3/api/iam/oauth/operational_resources/{serialize_path_parameter(resource_id, {'name': 'resourceId', 'style': 'simple', 'explode': False})}")

    def update(self, resource_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Iam oauth operational Resources update."""
        return self._client.patch(f"/backend/v3/api/iam/oauth/operational_resources/{serialize_path_parameter(resource_id, {'name': 'resourceId', 'style': 'simple', 'explode': False})}", json=body)

class IamOauthIamOauthOperationalResourcesPublishesApi:
    """iam_oauth iam_oauth.iam.oauth.operational_resources.publishes API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def create(self, resource_id: str, body: Dict[str, Any]) -> AppbaseApiResult:
        """Iam oauth operational Resources publishes create."""
        return self._client.post(f"/backend/v3/api/iam/oauth/operational_resources/{serialize_path_parameter(resource_id, {'name': 'resourceId', 'style': 'simple', 'explode': False})}/publishes", json=body)

class IamOauthIamOauthOperatorPlatformsApi:
    """iam_oauth iam_oauth.iam.oauth.operator_platforms API client."""

    def __init__(self, client: HttpClient):
        self._client = client
        self.pre_authorizations = IamOauthIamOauthOperatorPlatformsPreAuthorizationsApi(client)


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Iam oauth operator Platforms list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/oauth/operator_platforms", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Iam oauth operator Platforms create."""
        return self._client.post(f"/backend/v3/api/iam/oauth/operator_platforms", json=body)

    def update(self, operator_platform_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Iam oauth operator Platforms update."""
        return self._client.patch(f"/backend/v3/api/iam/oauth/operator_platforms/{serialize_path_parameter(operator_platform_id, {'name': 'operatorPlatformId', 'style': 'simple', 'explode': False})}", json=body)

class IamOauthIamOauthOperatorPlatformsPreAuthorizationsApi:
    """iam_oauth iam_oauth.iam.oauth.operator_platforms.pre_authorizations API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def create(self, operator_platform_id: str, body: Dict[str, Any]) -> AppbaseApiResult:
        """Iam oauth operator Platforms pre Authorizations create."""
        return self._client.post(f"/backend/v3/api/iam/oauth/operator_platforms/{serialize_path_parameter(operator_platform_id, {'name': 'operatorPlatformId', 'style': 'simple', 'explode': False})}/pre_authorizations", json=body)

class IamOauthIamOauthPoliciesApi:
    """iam_oauth iam_oauth.iam.oauth.policies API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Iam oauth policies list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/oauth/policies", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Iam oauth policies create."""
        return self._client.post(f"/backend/v3/api/iam/oauth/policies", json=body)

    def update(self, policy_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Iam oauth policies update."""
        return self._client.patch(f"/backend/v3/api/iam/oauth/policies/{serialize_path_parameter(policy_id, {'name': 'policyId', 'style': 'simple', 'explode': False})}", json=body)

class IamOauthIamOauthProviderCatalogApi:
    """iam_oauth iam_oauth.iam.oauth.provider_catalog API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Iam oauth provider Catalog list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/oauth/provider_catalog", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Iam oauth provider Catalog create."""
        return self._client.post(f"/backend/v3/api/iam/oauth/provider_catalog", json=body)

    def retrieve(self, provider_catalog_id: str) -> AppbaseApiResult:
        """Iam oauth provider Catalog retrieve."""
        return self._client.get(f"/backend/v3/api/iam/oauth/provider_catalog/{serialize_path_parameter(provider_catalog_id, {'name': 'providerCatalogId', 'style': 'simple', 'explode': False})}")

    def update(self, provider_catalog_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Iam oauth provider Catalog update."""
        return self._client.patch(f"/backend/v3/api/iam/oauth/provider_catalog/{serialize_path_parameter(provider_catalog_id, {'name': 'providerCatalogId', 'style': 'simple', 'explode': False})}", json=body)

class IamOauthIamOauthResourceAccountsApi:
    """iam_oauth iam_oauth.iam.oauth.resource_accounts API client."""

    def __init__(self, client: HttpClient):
        self._client = client
        self.authorization_refreshes = IamOauthIamOauthResourceAccountsAuthorizationRefreshesApi(client)
        self.mini_program_login_checks = IamOauthIamOauthResourceAccountsMiniProgramLoginChecksApi(client)
        self.verifications = IamOauthIamOauthResourceAccountsVerificationsApi(client)


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Iam oauth resource Accounts list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/oauth/resource_accounts", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Iam oauth resource Accounts create."""
        return self._client.post(f"/backend/v3/api/iam/oauth/resource_accounts", json=body)

    def update(self, resource_account_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Iam oauth resource Accounts update."""
        return self._client.patch(f"/backend/v3/api/iam/oauth/resource_accounts/{serialize_path_parameter(resource_account_id, {'name': 'resourceAccountId', 'style': 'simple', 'explode': False})}", json=body)

class IamOauthIamOauthResourceAccountsAuthorizationRefreshesApi:
    """iam_oauth iam_oauth.iam.oauth.resource_accounts.authorization_refreshes API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def create(self, resource_account_id: str, body: Dict[str, Any]) -> AppbaseApiResult:
        """Iam oauth resource Accounts authorization Refreshes create."""
        return self._client.post(f"/backend/v3/api/iam/oauth/resource_accounts/{serialize_path_parameter(resource_account_id, {'name': 'resourceAccountId', 'style': 'simple', 'explode': False})}/authorization_refreshes", json=body)

class IamOauthIamOauthResourceAccountsMiniProgramLoginChecksApi:
    """iam_oauth iam_oauth.iam.oauth.resource_accounts.mini_program_login_checks API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def create(self, resource_account_id: str, body: Dict[str, Any]) -> AppbaseApiResult:
        """Iam oauth resource Accounts mini Program Login Checks create."""
        return self._client.post(f"/backend/v3/api/iam/oauth/resource_accounts/{serialize_path_parameter(resource_account_id, {'name': 'resourceAccountId', 'style': 'simple', 'explode': False})}/mini_program_login_checks", json=body)

class IamOauthIamOauthResourceAccountsVerificationsApi:
    """iam_oauth iam_oauth.iam.oauth.resource_accounts.verifications API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def create(self, resource_account_id: str, body: Dict[str, Any]) -> AppbaseApiResult:
        """Iam oauth resource Accounts verifications create."""
        return self._client.post(f"/backend/v3/api/iam/oauth/resource_accounts/{serialize_path_parameter(resource_account_id, {'name': 'resourceAccountId', 'style': 'simple', 'explode': False})}/verifications", json=body)

class IamOauthIamOauthResourceAuthorizationsApi:
    """iam_oauth iam_oauth.iam.oauth.resource_authorizations API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Iam oauth resource Authorizations list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/oauth/resource_authorizations", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Iam oauth resource Authorizations create."""
        return self._client.post(f"/backend/v3/api/iam/oauth/resource_authorizations", json=body)

    def update(self, authorization_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Iam oauth resource Authorizations update."""
        return self._client.patch(f"/backend/v3/api/iam/oauth/resource_authorizations/{serialize_path_parameter(authorization_id, {'name': 'authorizationId', 'style': 'simple', 'explode': False})}", json=body)

class IamOauthIamOauthScopeProfilesApi:
    """iam_oauth iam_oauth.iam.oauth.scope_profiles API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Iam oauth scope Profiles list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/oauth/scope_profiles", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Iam oauth scope Profiles create."""
        return self._client.post(f"/backend/v3/api/iam/oauth/scope_profiles", json=body)

    def update(self, scope_profile_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Iam oauth scope Profiles update."""
        return self._client.patch(f"/backend/v3/api/iam/oauth/scope_profiles/{serialize_path_parameter(scope_profile_id, {'name': 'scopeProfileId', 'style': 'simple', 'explode': False})}", json=body)

class IamOauthIamOauthSecretsApi:
    """iam_oauth iam_oauth.iam.oauth.secrets API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Iam oauth secrets list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/oauth/secrets", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Iam oauth secrets create."""
        return self._client.post(f"/backend/v3/api/iam/oauth/secrets", json=body)

    def delete(self, secret_id: str) -> AppbaseApiResult:
        """Iam oauth secrets delete."""
        return self._client.delete(f"/backend/v3/api/iam/oauth/secrets/{serialize_path_parameter(secret_id, {'name': 'secretId', 'style': 'simple', 'explode': False})}")

class IamOauthIamOauthSurfacesApi:
    """iam_oauth iam_oauth.iam.oauth.surfaces API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Iam oauth surfaces list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/oauth/surfaces", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Iam oauth surfaces create."""
        return self._client.post(f"/backend/v3/api/iam/oauth/surfaces", json=body)

    def delete(self, surface_id: str) -> AppbaseApiResult:
        """Iam oauth surfaces delete."""
        return self._client.delete(f"/backend/v3/api/iam/oauth/surfaces/{serialize_path_parameter(surface_id, {'name': 'surfaceId', 'style': 'simple', 'explode': False})}")

    def update(self, surface_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Iam oauth surfaces update."""
        return self._client.patch(f"/backend/v3/api/iam/oauth/surfaces/{serialize_path_parameter(surface_id, {'name': 'surfaceId', 'style': 'simple', 'explode': False})}", json=body)

class IamOauthIamOauthTenantBindingsApi:
    """iam_oauth iam_oauth.iam.oauth.tenant_bindings API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Iam oauth tenant Bindings list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/oauth/tenant_bindings", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Iam oauth tenant Bindings create."""
        return self._client.post(f"/backend/v3/api/iam/oauth/tenant_bindings", json=body)

    def update(self, binding_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Iam oauth tenant Bindings update."""
        return self._client.patch(f"/backend/v3/api/iam/oauth/tenant_bindings/{serialize_path_parameter(binding_id, {'name': 'bindingId', 'style': 'simple', 'explode': False})}", json=body)

class IamOauthIamOauthWebhookConfigsApi:
    """iam_oauth iam_oauth.iam.oauth.webhook_configs API client."""

    def __init__(self, client: HttpClient):
        self._client = client
        self.verifications = IamOauthIamOauthWebhookConfigsVerificationsApi(client)


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Iam oauth webhook Configs list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/oauth/webhook_configs", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Iam oauth webhook Configs create."""
        return self._client.post(f"/backend/v3/api/iam/oauth/webhook_configs", json=body)

    def update(self, webhook_config_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Iam oauth webhook Configs update."""
        return self._client.patch(f"/backend/v3/api/iam/oauth/webhook_configs/{serialize_path_parameter(webhook_config_id, {'name': 'webhookConfigId', 'style': 'simple', 'explode': False})}", json=body)

class IamOauthIamOauthWebhookConfigsVerificationsApi:
    """iam_oauth iam_oauth.iam.oauth.webhook_configs.verifications API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def create(self, webhook_config_id: str, body: Dict[str, Any]) -> AppbaseApiResult:
        """Iam oauth webhook Configs verifications create."""
        return self._client.post(f"/backend/v3/api/iam/oauth/webhook_configs/{serialize_path_parameter(webhook_config_id, {'name': 'webhookConfigId', 'style': 'simple', 'explode': False})}/verifications", json=body)
