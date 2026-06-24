from typing import Any, Dict, List, Optional
from ..http_client import HttpClient
from ..models import AppbaseApiResult

def _append_query_string(path: str, raw_query_string: str) -> str:
    query = raw_query_string.lstrip('?')
    if not query:
        return path
    separator = '&' if '?' in path else '?'
    return f"{path}{separator}{query}"





class SystemApi:
    """system system API client."""

    def __init__(self, client: HttpClient):
        self._client = client
        self.iam = SystemIamApi(client)


class SystemIamApi:
    """system system.iam API client."""

    def __init__(self, client: HttpClient):
        self._client = client
        self.account_binding_policy = SystemIamAccountBindingPolicyApi(client)
        self.runtime = SystemIamRuntimeApi(client)
        self.verification_policy = SystemIamVerificationPolicyApi(client)


class SystemIamAccountBindingPolicyApi:
    """system system.iam.account_binding_policy API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def retrieve(self) -> AppbaseApiResult:
        """Iam account Binding Policy retrieve."""
        return self._client.get(f"/app/v3/api/system/iam/account_binding_policy", skip_auth=True)

class SystemIamRuntimeApi:
    """system system.iam.runtime API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def retrieve(self) -> AppbaseApiResult:
        """Iam runtime retrieve."""
        return self._client.get(f"/app/v3/api/system/iam/runtime", skip_auth=True)

class SystemIamVerificationPolicyApi:
    """system system.iam.verification_policy API client."""

    def __init__(self, client: HttpClient):
        self._client = client


    def retrieve(self) -> AppbaseApiResult:
        """Iam verification Policy retrieve."""
        return self._client.get(f"/app/v3/api/system/iam/verification_policy", skip_auth=True)
