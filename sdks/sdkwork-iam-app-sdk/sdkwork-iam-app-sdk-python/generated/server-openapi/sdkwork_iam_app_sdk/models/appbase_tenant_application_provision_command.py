from __future__ import annotations
from dataclasses import dataclass
from typing import TYPE_CHECKING, Optional, List, Dict, Any


@dataclass
class AppbaseTenantApplicationProvisionCommand:
    """Provision a tenant application from a registered application template."""
    tenant_id: str
    organization_id: str
    instance_key: str
    display_name: str
    environment: str
    auth_token: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    template_id: Optional[str] = None
    app_key: Optional[str] = None
    primary_domain: Optional[str] = None
    access_permissions: Optional[List[str]] = None
    runtime_config: Optional[Dict[str, Any]] = None
