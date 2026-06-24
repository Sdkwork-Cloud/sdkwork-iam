from .http_client import HttpClient, SdkConfig
from .api.auth import AuthApi
from .api.iam import IamApi
from .api.oauth import OauthApi
from .api.system import SystemApi


class SdkworkAppClient:
    """sdkwork-iam-app-sdk SDK Client."""

    def __init__(self, config: SdkConfig):
        self._client = HttpClient(config)
        self.auth: AuthApi
        self.iam: IamApi
        self.oauth: OauthApi
        self.system: SystemApi

        # Initialize API modules
        self.auth = AuthApi(self._client)
        self.iam = IamApi(self._client)
        self.oauth = OauthApi(self._client)
        self.system = SystemApi(self._client)
    def set_auth_token(self, token: str) -> 'SdkworkAppClient':
        """Set auth token for authentication."""
        self._client.set_auth_token(token)
        return self

    def set_access_token(self, token: str) -> 'SdkworkAppClient':
        """Set access token for authentication."""
        self._client.set_access_token(token)
        return self

    def set_header(self, key: str, value: str) -> 'SdkworkAppClient':
        """Set custom header."""
        self._client.set_header(key, value)
        return self

    @property
    def http(self) -> HttpClient:
        """Get the underlying HTTP client."""
        return self._client


def create_client(config: SdkConfig) -> SdkworkAppClient:
    """Create a new SDK client instance."""
    return SdkworkAppClient(config)
