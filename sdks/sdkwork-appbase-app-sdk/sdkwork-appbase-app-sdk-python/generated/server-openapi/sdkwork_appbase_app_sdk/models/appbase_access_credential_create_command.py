from __future__ import annotations
from dataclasses import dataclass
from typing import TYPE_CHECKING, Optional, List, Dict, Any


@dataclass
class AppbaseAccessCredentialCreateCommand:
    """Issue a delegated access credential for an enabled tenant application."""
    tenant_id: str
    organization_id: str
    auth_token: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    tenant_application_id: Optional[str] = None
    app_id: Optional[str] = None
    instance_key: Optional[str] = None
