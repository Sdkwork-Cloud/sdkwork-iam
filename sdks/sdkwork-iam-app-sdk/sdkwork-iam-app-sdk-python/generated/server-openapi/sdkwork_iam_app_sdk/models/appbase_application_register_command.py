from __future__ import annotations
from dataclasses import dataclass
from typing import TYPE_CHECKING, Optional, List, Dict, Any


@dataclass
class AppbaseApplicationRegisterCommand:
    """Super-admin registered application command for startup bootstrap."""
    app_key: str
    name: str
    app_type: str
    version: str
    default_access_permissions: List[str]
    auth_token: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    owner_tenant_id: Optional[str] = None
    display_name: Optional[str] = None
    package_name: Optional[str] = None
    bundle_id: Optional[str] = None
    desktop_app_id: Optional[str] = None
    channel: Optional[str] = None
    manifest_hash: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    packages: Optional[List[Dict[str, Any]]] = None
