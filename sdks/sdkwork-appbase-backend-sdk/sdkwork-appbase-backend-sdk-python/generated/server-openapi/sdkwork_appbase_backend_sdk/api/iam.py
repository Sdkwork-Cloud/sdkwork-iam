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



class IamApi:
    """iam iam API client."""

    def __init__(self, client: HttpClient):
        self._client = client
        self.api_keys = IamApiKeysApi(client)
        self.audit_events = IamAuditEventsApi(client)
        self.department_assignments = IamDepartmentAssignmentsApi(client)
        self.departments = IamDepartmentsApi(client)
        self.organization_memberships = IamOrganizationMembershipsApi(client)
        self.organizations = IamOrganizationsApi(client)
        self.permissions = IamPermissionsApi(client)
        self.policies = IamPoliciesApi(client)
        self.position_assignments = IamPositionAssignmentsApi(client)
        self.positions = IamPositionsApi(client)
        self.role_bindings = IamRoleBindingsApi(client)
        self.roles = IamRolesApi(client)
        self.security_events = IamSecurityEventsApi(client)
        self.tenants = IamTenantsApi(client)
        self.users = IamUsersApi(client)


class IamApiKeysApi:
    """iam iam.api_keys API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Api Keys list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/api_keys", query))

    def revoke(self, api_key_id: str, body: Dict[str, Any]) -> AppbaseApiResult:
        """Api Keys revoke."""
        return self._client.post(f"/backend/v3/api/iam/api_keys/{serialize_path_parameter(api_key_id, {'name': 'apiKeyId', 'style': 'simple', 'explode': False})}/revoke", json=body)

class IamAuditEventsApi:
    """iam iam.audit_events API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Audit Events list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/audit_events", query))

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
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/department_assignments", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Department Assignments create."""
        return self._client.post(f"/backend/v3/api/iam/department_assignments", json=body)

    def update(self, assignment_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Department Assignments update."""
        return self._client.patch(f"/backend/v3/api/iam/department_assignments/{serialize_path_parameter(assignment_id, {'name': 'assignmentId', 'style': 'simple', 'explode': False})}", json=body)

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
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/departments", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Departments create."""
        return self._client.post(f"/backend/v3/api/iam/departments", json=body)

    def delete(self, department_id: str) -> AppbaseApiResult:
        """Departments delete."""
        return self._client.delete(f"/backend/v3/api/iam/departments/{serialize_path_parameter(department_id, {'name': 'departmentId', 'style': 'simple', 'explode': False})}")

    def retrieve(self, department_id: str) -> AppbaseApiResult:
        """Departments retrieve."""
        return self._client.get(f"/backend/v3/api/iam/departments/{serialize_path_parameter(department_id, {'name': 'departmentId', 'style': 'simple', 'explode': False})}")

    def update(self, department_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Departments update."""
        return self._client.patch(f"/backend/v3/api/iam/departments/{serialize_path_parameter(department_id, {'name': 'departmentId', 'style': 'simple', 'explode': False})}", json=body)

class IamDepartmentsTreeApi:
    """iam iam.departments.tree API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def retrieve(self) -> AppbaseApiResult:
        """Departments tree retrieve."""
        return self._client.get(f"/backend/v3/api/iam/departments/tree")

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
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/organization_memberships", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Organization Memberships create."""
        return self._client.post(f"/backend/v3/api/iam/organization_memberships", json=body)

    def update(self, membership_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Organization Memberships update."""
        return self._client.patch(f"/backend/v3/api/iam/organization_memberships/{serialize_path_parameter(membership_id, {'name': 'membershipId', 'style': 'simple', 'explode': False})}", json=body)

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
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/organizations", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Organizations create."""
        return self._client.post(f"/backend/v3/api/iam/organizations", json=body)

    def delete(self, organization_id: str) -> AppbaseApiResult:
        """Organizations delete."""
        return self._client.delete(f"/backend/v3/api/iam/organizations/{serialize_path_parameter(organization_id, {'name': 'organizationId', 'style': 'simple', 'explode': False})}")

    def retrieve(self, organization_id: str) -> AppbaseApiResult:
        """Organizations retrieve."""
        return self._client.get(f"/backend/v3/api/iam/organizations/{serialize_path_parameter(organization_id, {'name': 'organizationId', 'style': 'simple', 'explode': False})}")

    def update(self, organization_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Organizations update."""
        return self._client.patch(f"/backend/v3/api/iam/organizations/{serialize_path_parameter(organization_id, {'name': 'organizationId', 'style': 'simple', 'explode': False})}", json=body)

class IamOrganizationsTreeApi:
    """iam iam.organizations.tree API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def retrieve(self) -> AppbaseApiResult:
        """Organizations tree retrieve."""
        return self._client.get(f"/backend/v3/api/iam/organizations/tree")

class IamPermissionsApi:
    """iam iam.permissions API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Permissions list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/permissions", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Permissions create."""
        return self._client.post(f"/backend/v3/api/iam/permissions", json=body)

    def delete(self, permission_id: str) -> AppbaseApiResult:
        """Permissions delete."""
        return self._client.delete(f"/backend/v3/api/iam/permissions/{serialize_path_parameter(permission_id, {'name': 'permissionId', 'style': 'simple', 'explode': False})}")

    def retrieve(self, permission_id: str) -> AppbaseApiResult:
        """Permissions retrieve."""
        return self._client.get(f"/backend/v3/api/iam/permissions/{serialize_path_parameter(permission_id, {'name': 'permissionId', 'style': 'simple', 'explode': False})}")

    def update(self, permission_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Permissions update."""
        return self._client.patch(f"/backend/v3/api/iam/permissions/{serialize_path_parameter(permission_id, {'name': 'permissionId', 'style': 'simple', 'explode': False})}", json=body)

class IamPoliciesApi:
    """iam iam.policies API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Policies list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/policies", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Policies create."""
        return self._client.post(f"/backend/v3/api/iam/policies", json=body)

    def delete(self, policy_id: str) -> AppbaseApiResult:
        """Policies delete."""
        return self._client.delete(f"/backend/v3/api/iam/policies/{serialize_path_parameter(policy_id, {'name': 'policyId', 'style': 'simple', 'explode': False})}")

    def retrieve(self, policy_id: str) -> AppbaseApiResult:
        """Policies retrieve."""
        return self._client.get(f"/backend/v3/api/iam/policies/{serialize_path_parameter(policy_id, {'name': 'policyId', 'style': 'simple', 'explode': False})}")

    def update(self, policy_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Policies update."""
        return self._client.patch(f"/backend/v3/api/iam/policies/{serialize_path_parameter(policy_id, {'name': 'policyId', 'style': 'simple', 'explode': False})}", json=body)

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
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/position_assignments", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Position Assignments create."""
        return self._client.post(f"/backend/v3/api/iam/position_assignments", json=body)

    def update(self, assignment_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Position Assignments update."""
        return self._client.patch(f"/backend/v3/api/iam/position_assignments/{serialize_path_parameter(assignment_id, {'name': 'assignmentId', 'style': 'simple', 'explode': False})}", json=body)

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
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/positions", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Positions create."""
        return self._client.post(f"/backend/v3/api/iam/positions", json=body)

    def delete(self, position_id: str) -> AppbaseApiResult:
        """Positions delete."""
        return self._client.delete(f"/backend/v3/api/iam/positions/{serialize_path_parameter(position_id, {'name': 'positionId', 'style': 'simple', 'explode': False})}")

    def update(self, position_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Positions update."""
        return self._client.patch(f"/backend/v3/api/iam/positions/{serialize_path_parameter(position_id, {'name': 'positionId', 'style': 'simple', 'explode': False})}", json=body)

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
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/role_bindings", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Role Bindings create."""
        return self._client.post(f"/backend/v3/api/iam/role_bindings", json=body)

    def delete(self, role_binding_id: str) -> AppbaseApiResult:
        """Role Bindings delete."""
        return self._client.delete(f"/backend/v3/api/iam/role_bindings/{serialize_path_parameter(role_binding_id, {'name': 'roleBindingId', 'style': 'simple', 'explode': False})}")

class IamRolesApi:
    """iam iam.roles API client."""

    def __init__(self, client: HttpClient):
        self._client = client
        self.permissions = IamRolesPermissionsApi(client)


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Roles list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/roles", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Roles create."""
        return self._client.post(f"/backend/v3/api/iam/roles", json=body)

    def delete(self, role_id: str) -> AppbaseApiResult:
        """Roles delete."""
        return self._client.delete(f"/backend/v3/api/iam/roles/{serialize_path_parameter(role_id, {'name': 'roleId', 'style': 'simple', 'explode': False})}")

    def retrieve(self, role_id: str) -> AppbaseApiResult:
        """Roles retrieve."""
        return self._client.get(f"/backend/v3/api/iam/roles/{serialize_path_parameter(role_id, {'name': 'roleId', 'style': 'simple', 'explode': False})}")

    def update(self, role_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Roles update."""
        return self._client.patch(f"/backend/v3/api/iam/roles/{serialize_path_parameter(role_id, {'name': 'roleId', 'style': 'simple', 'explode': False})}", json=body)

class IamRolesPermissionsApi:
    """iam iam.roles.permissions API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, role_id: str, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Roles permissions list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/roles/{serialize_path_parameter(role_id, {'name': 'roleId', 'style': 'simple', 'explode': False})}/permissions", query))

    def create(self, role_id: str, body: Dict[str, Any]) -> AppbaseApiResult:
        """Roles permissions create."""
        return self._client.post(f"/backend/v3/api/iam/roles/{serialize_path_parameter(role_id, {'name': 'roleId', 'style': 'simple', 'explode': False})}/permissions", json=body)

    def delete(self, role_id: str, permission_id: str) -> AppbaseApiResult:
        """Roles permissions delete."""
        return self._client.delete(f"/backend/v3/api/iam/roles/{serialize_path_parameter(role_id, {'name': 'roleId', 'style': 'simple', 'explode': False})}/permissions/{serialize_path_parameter(permission_id, {'name': 'permissionId', 'style': 'simple', 'explode': False})}")

class IamSecurityEventsApi:
    """iam iam.security_events API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Security Events list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/security_events", query))

class IamTenantsApi:
    """iam iam.tenants API client."""

    def __init__(self, client: HttpClient):
        self._client = client
        self.members = IamTenantsMembersApi(client)


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Tenants list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/tenants", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Tenants create."""
        return self._client.post(f"/backend/v3/api/iam/tenants", json=body)

    def delete(self, tenant_id: str) -> AppbaseApiResult:
        """Tenants delete."""
        return self._client.delete(f"/backend/v3/api/iam/tenants/{serialize_path_parameter(tenant_id, {'name': 'tenantId', 'style': 'simple', 'explode': False})}")

    def retrieve(self, tenant_id: str) -> AppbaseApiResult:
        """Tenants retrieve."""
        return self._client.get(f"/backend/v3/api/iam/tenants/{serialize_path_parameter(tenant_id, {'name': 'tenantId', 'style': 'simple', 'explode': False})}")

    def update(self, tenant_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Tenants update."""
        return self._client.patch(f"/backend/v3/api/iam/tenants/{serialize_path_parameter(tenant_id, {'name': 'tenantId', 'style': 'simple', 'explode': False})}", json=body)

class IamTenantsMembersApi:
    """iam iam.tenants.members API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, tenant_id: str, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Tenants members list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/tenants/{serialize_path_parameter(tenant_id, {'name': 'tenantId', 'style': 'simple', 'explode': False})}/members", query))

    def create(self, tenant_id: str, body: Dict[str, Any]) -> AppbaseApiResult:
        """Tenants members create."""
        return self._client.post(f"/backend/v3/api/iam/tenants/{serialize_path_parameter(tenant_id, {'name': 'tenantId', 'style': 'simple', 'explode': False})}/members", json=body)

    def delete(self, tenant_id: str, user_id: str) -> AppbaseApiResult:
        """Tenants members delete."""
        return self._client.delete(f"/backend/v3/api/iam/tenants/{serialize_path_parameter(tenant_id, {'name': 'tenantId', 'style': 'simple', 'explode': False})}/members/{serialize_path_parameter(user_id, {'name': 'userId', 'style': 'simple', 'explode': False})}")

    def update(self, tenant_id: str, user_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Tenants members update."""
        return self._client.patch(f"/backend/v3/api/iam/tenants/{serialize_path_parameter(tenant_id, {'name': 'tenantId', 'style': 'simple', 'explode': False})}/members/{serialize_path_parameter(user_id, {'name': 'userId', 'style': 'simple', 'explode': False})}", json=body)

class IamUsersApi:
    """iam iam.users API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def list(self, page: Optional[int] = None, page_size: Optional[int] = None, cursor: Optional[str] = None, sort: Optional[str] = None, q: Optional[str] = None) -> AppbaseApiResult:
        """Users list."""
        query = build_query_string([
            {'name': 'page', 'value': page, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'page_size', 'value': page_size, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'cursor', 'value': cursor, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'sort', 'value': sort, 'style': 'form', 'explode': True, 'allow_reserved': False},
            {'name': 'q', 'value': q, 'style': 'form', 'explode': True, 'allow_reserved': False},
        ])
        return self._client.get(_append_query_string(f"/backend/v3/api/iam/users", query))

    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Users create."""
        return self._client.post(f"/backend/v3/api/iam/users", json=body)

    def delete(self, user_id: str) -> AppbaseApiResult:
        """Users delete."""
        return self._client.delete(f"/backend/v3/api/iam/users/{serialize_path_parameter(user_id, {'name': 'userId', 'style': 'simple', 'explode': False})}")

    def retrieve(self, user_id: str) -> AppbaseApiResult:
        """Users retrieve."""
        return self._client.get(f"/backend/v3/api/iam/users/{serialize_path_parameter(user_id, {'name': 'userId', 'style': 'simple', 'explode': False})}")

    def update(self, user_id: str, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Users update."""
        return self._client.patch(f"/backend/v3/api/iam/users/{serialize_path_parameter(user_id, {'name': 'userId', 'style': 'simple', 'explode': False})}", json=body)
