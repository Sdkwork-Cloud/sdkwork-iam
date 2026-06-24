from typing import Any, Dict, List, Optional
from ..http_client import HttpClient
from ..models import AppbaseApiResult

def _append_query_string(path: str, raw_query_string: str) -> str:
    query = raw_query_string.lstrip('?')
    if not query:
        return path
    separator = '&' if '?' in path else '?'
    return f"{path}{separator}{query}"


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



class IamApi:
    """iam iam API client."""

    def __init__(self, client: HttpClient):
        self._client = client
        self.department_assignments = IamDepartmentAssignmentsApi(client)
        self.departments = IamDepartmentsApi(client)
        self.organization_memberships = IamOrganizationMembershipsApi(client)
        self.organizations = IamOrganizationsApi(client)
        self.position_assignments = IamPositionAssignmentsApi(client)
        self.positions = IamPositionsApi(client)
        self.role_bindings = IamRoleBindingsApi(client)
        self.users = IamUsersApi(client)


class IamDepartmentAssignmentsApi:
    """iam iam.department_assignments API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Department Assignments list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/app/v3/api/iam/department_assignments", query))

class IamDepartmentsApi:
    """iam iam.departments API client."""

    def __init__(self, client: HttpClient):
        self._client = client
        self.tree = IamDepartmentsTreeApi(client)


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Departments list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/app/v3/api/iam/departments", query))

class IamDepartmentsTreeApi:
    """iam iam.departments.tree API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def retrieve(self) -> AppbaseApiResult:
        """Departments tree retrieve."""
        return self._client.get(f"/app/v3/api/iam/departments/tree")

class IamOrganizationMembershipsApi:
    """iam iam.organization_memberships API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Organization Memberships list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/app/v3/api/iam/organization_memberships", query))

class IamOrganizationsApi:
    """iam iam.organizations API client."""

    def __init__(self, client: HttpClient):
        self._client = client
        self.tree = IamOrganizationsTreeApi(client)


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Organizations list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/app/v3/api/iam/organizations", query))

class IamOrganizationsTreeApi:
    """iam iam.organizations.tree API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def retrieve(self) -> AppbaseApiResult:
        """Organizations tree retrieve."""
        return self._client.get(f"/app/v3/api/iam/organizations/tree")

class IamPositionAssignmentsApi:
    """iam iam.position_assignments API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Position Assignments list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/app/v3/api/iam/position_assignments", query))

class IamPositionsApi:
    """iam iam.positions API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Positions list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/app/v3/api/iam/positions", query))

class IamRoleBindingsApi:
    """iam iam.role_bindings API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Role Bindings list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/app/v3/api/iam/role_bindings", query))

class IamUsersApi:
    """iam iam.users API client."""

    def __init__(self, client: HttpClient):
        self._client = client
        self.current = IamUsersCurrentApi(client)


class IamUsersCurrentApi:
    """iam iam.users.current API client."""

    def __init__(self, client: HttpClient):
        self._client = client
        self.email_bindings = IamUsersCurrentEmailBindingsApi(client)
        self.password = IamUsersCurrentPasswordApi(client)
        self.phone_bindings = IamUsersCurrentPhoneBindingsApi(client)


    def retrieve(self) -> AppbaseApiResult:
        """Users current retrieve."""
        return self._client.get(f"/app/v3/api/iam/users/current")

    def update(self, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Users current update."""
        return self._client.patch(f"/app/v3/api/iam/users/current", json=body)

class IamUsersCurrentEmailBindingsApi:
    """iam iam.users.current.email_bindings API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def delete(self) -> AppbaseApiResult:
        """Users current email Bindings delete."""
        return self._client.delete(f"/app/v3/api/iam/users/current/email_bindings")

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Users current email Bindings create."""
        return self._client.post(f"/app/v3/api/iam/users/current/email_bindings", json=body)

class IamUsersCurrentPasswordApi:
    """iam iam.users.current.password API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def update(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Users current password update."""
        return self._client.post(f"/app/v3/api/iam/users/current/password", json=body)

class IamUsersCurrentPhoneBindingsApi:
    """iam iam.users.current.phone_bindings API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def delete(self) -> AppbaseApiResult:
        """Users current phone Bindings delete."""
        return self._client.delete(f"/app/v3/api/iam/users/current/phone_bindings")

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Users current phone Bindings create."""
        return self._client.post(f"/app/v3/api/iam/users/current/phone_bindings", json=body)
