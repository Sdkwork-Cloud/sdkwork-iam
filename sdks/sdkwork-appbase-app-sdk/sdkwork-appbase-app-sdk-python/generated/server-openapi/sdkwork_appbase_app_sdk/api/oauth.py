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



class OauthApi:
    """oauth oauth API client."""

    def __init__(self, client: HttpClient):
        self._client = client
        self.account_links = OauthAccountLinksApi(client)
        self.authorization_urls = OauthAuthorizationUrlsApi(client)
        self.callbacks = OauthCallbacksApi(client)
        self.device_authorizations = OauthDeviceAuthorizationsApi(client)
        self.grants = OauthGrantsApi(client)
        self.mini_program_sessions = OauthMiniProgramSessionsApi(client)
        self.providers = OauthProvidersApi(client)
        self.sessions = OauthSessionsApi(client)


class OauthAccountLinksApi:
    """oauth oauth.account_links API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Oauth account Links list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/app/v3/api/oauth/account_links", query))

    def delete(self, account_link_id: str) -> AppbaseApiResult:
        """Oauth account Links delete."""
        return self._client.delete(f"/app/v3/api/oauth/account_links/{serialize_path_parameter(account_link_id, {'name': 'accountLinkId', 'style': 'simple', 'explode': False})}")

class OauthAuthorizationUrlsApi:
    """oauth oauth.authorization_urls API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Oauth authorization Urls create."""
        return self._client.post(f"/app/v3/api/oauth/authorization_urls", json=body, skip_auth=True)

class OauthCallbacksApi:
    """oauth oauth.callbacks API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def retrieve(self, provider_code: str) -> AppbaseApiResult:
        """Oauth callbacks handle Get."""
        return self._client.get(f"/app/v3/api/oauth/callbacks/{serialize_path_parameter(provider_code, {'name': 'providerCode', 'style': 'simple', 'explode': False})}")

    def update(self, provider_code: str, body: Dict[str, Any]) -> AppbaseApiResult:
        """Oauth callbacks handle Post."""
        return self._client.post(f"/app/v3/api/oauth/callbacks/{serialize_path_parameter(provider_code, {'name': 'providerCode', 'style': 'simple', 'explode': False})}", json=body)

class OauthDeviceAuthorizationsApi:
    """oauth oauth.device_authorizations API client."""

    def __init__(self, client: HttpClient):
        self._client = client
        self.password_completions = OauthDeviceAuthorizationsPasswordCompletionsApi(client)
        self.scans = OauthDeviceAuthorizationsScansApi(client)
        self.session_exchanges = OauthDeviceAuthorizationsSessionExchangesApi(client)


    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Oauth device Authorizations create."""
        return self._client.post(f"/app/v3/api/oauth/device_authorizations", json=body, skip_auth=True)

    def retrieve(self, device_authorization_id: str) -> AppbaseApiResult:
        """Oauth device Authorizations retrieve."""
        return self._client.get(f"/app/v3/api/oauth/device_authorizations/{serialize_path_parameter(device_authorization_id, {'name': 'deviceAuthorizationId', 'style': 'simple', 'explode': False})}", skip_auth=True)

class OauthDeviceAuthorizationsPasswordCompletionsApi:
    """oauth oauth.device_authorizations.password_completions API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def create(self, device_authorization_id: str, body: Dict[str, Any]) -> AppbaseApiResult:
        """Oauth device Authorizations password Completions create."""
        return self._client.post(f"/app/v3/api/oauth/device_authorizations/{serialize_path_parameter(device_authorization_id, {'name': 'deviceAuthorizationId', 'style': 'simple', 'explode': False})}/password_completions", json=body, skip_auth=True)

class OauthDeviceAuthorizationsScansApi:
    """oauth oauth.device_authorizations.scans API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def create(self, device_authorization_id: str, body: Dict[str, Any]) -> AppbaseApiResult:
        """Oauth device Authorizations scans create."""
        return self._client.post(f"/app/v3/api/oauth/device_authorizations/{serialize_path_parameter(device_authorization_id, {'name': 'deviceAuthorizationId', 'style': 'simple', 'explode': False})}/scans", json=body, skip_auth=True)

class OauthDeviceAuthorizationsSessionExchangesApi:
    """oauth oauth.device_authorizations.session_exchanges API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def create(self, device_authorization_id: str, body: Dict[str, Any]) -> AppbaseApiResult:
        """Oauth device Authorizations session Exchanges create."""
        return self._client.post(f"/app/v3/api/oauth/device_authorizations/{serialize_path_parameter(device_authorization_id, {'name': 'deviceAuthorizationId', 'style': 'simple', 'explode': False})}/session_exchanges", json=body)

class OauthGrantsApi:
    """oauth oauth.grants API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Oauth grants list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/app/v3/api/oauth/grants", query))

    def delete(self, grant_id: str) -> AppbaseApiResult:
        """Oauth grants delete."""
        return self._client.delete(f"/app/v3/api/oauth/grants/{serialize_path_parameter(grant_id, {'name': 'grantId', 'style': 'simple', 'explode': False})}")

class OauthMiniProgramSessionsApi:
    """oauth oauth.mini_program_sessions API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Oauth mini Program Sessions create."""
        return self._client.post(f"/app/v3/api/oauth/mini_program_sessions", json=body)

class OauthProvidersApi:
    """oauth oauth.providers API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Oauth providers list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/app/v3/api/oauth/providers", query))

class OauthSessionsApi:
    """oauth oauth.sessions API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Oauth sessions create."""
        return self._client.post(f"/app/v3/api/oauth/sessions", json=body, skip_auth=True)
