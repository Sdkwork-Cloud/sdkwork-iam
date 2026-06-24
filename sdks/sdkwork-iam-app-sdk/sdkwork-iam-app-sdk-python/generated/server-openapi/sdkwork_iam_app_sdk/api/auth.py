from typing import Any, Dict, List, Optional
from ..http_client import HttpClient
from ..models import AppbaseApiResult, AppbaseSessionCreateCommand

def _append_query_string(path: str, raw_query_string: str) -> str:
    query = raw_query_string.lstrip('?')
    if not query:
        return path
    separator = '&' if '?' in path else '?'
    return f"{path}{separator}{query}"





class AuthApi:
    """auth auth API client."""

    def __init__(self, client: HttpClient):
        self._client = client
        self.password_reset_requests = AuthPasswordResetRequestsApi(client)
        self.password_resets = AuthPasswordResetsApi(client)
        self.registrations = AuthRegistrationsApi(client)
        self.sessions = AuthSessionsApi(client)


class AuthPasswordResetRequestsApi:
    """auth auth.password_reset_requests API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Password Reset Requests create."""
        return self._client.post(f"/app/v3/api/auth/password_reset_requests", json=body, skip_auth=True)

class AuthPasswordResetsApi:
    """auth auth.password_resets API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Password Resets create."""
        return self._client.post(f"/app/v3/api/auth/password_resets", json=body, skip_auth=True)

class AuthRegistrationsApi:
    """auth auth.registrations API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Registrations create."""
        return self._client.post(f"/app/v3/api/auth/registrations", json=body, skip_auth=True)

class AuthSessionsApi:
    """auth auth.sessions API client."""

    def __init__(self, client: HttpClient):
        self._client = client
        self.current = AuthSessionsCurrentApi(client)
        self.login_context_selection = AuthSessionsLoginContextSelectionApi(client)
        self.organization_selection = AuthSessionsOrganizationSelectionApi(client)


    def create(self, body: AppbaseSessionCreateCommand) -> AppbaseApiResult:
        """Sessions create."""
        return self._client.post(f"/app/v3/api/auth/sessions", json=body, skip_auth=True)

    def refresh(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Sessions refresh."""
        return self._client.post(f"/app/v3/api/auth/sessions/refresh", json=body, skip_auth=True)

class AuthSessionsCurrentApi:
    """auth auth.sessions.current API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def delete(self) -> AppbaseApiResult:
        """Sessions current delete."""
        return self._client.delete(f"/app/v3/api/auth/sessions/current")

    def retrieve(self) -> AppbaseApiResult:
        """Sessions current retrieve."""
        return self._client.get(f"/app/v3/api/auth/sessions/current")

    def update(self, body: Optional[Dict[str, Any]] = None) -> AppbaseApiResult:
        """Sessions current update."""
        return self._client.patch(f"/app/v3/api/auth/sessions/current", json=body)

class AuthSessionsLoginContextSelectionApi:
    """auth auth.sessions.login_context_selection API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Sessions login Context Selection create."""
        return self._client.post(f"/app/v3/api/auth/sessions/login_context_selection", json=body, skip_auth=True)

class AuthSessionsOrganizationSelectionApi:
    """auth auth.sessions.organization_selection API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def create(self, body: Dict[str, Any]) -> AppbaseApiResult:
        """Sessions organization Selection create."""
        return self._client.post(f"/app/v3/api/auth/sessions/organization_selection", json=body, skip_auth=True)
