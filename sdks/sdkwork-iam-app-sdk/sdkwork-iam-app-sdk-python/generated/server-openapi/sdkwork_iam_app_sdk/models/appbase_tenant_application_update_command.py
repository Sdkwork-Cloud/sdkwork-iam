from __future__ import annotations
from dataclasses import dataclass
from typing import TYPE_CHECKING, Optional, List, Dict, Any


@dataclass
class AppbaseTenantApplicationUpdateCommand:
    """Update tenant application access and runtime configuration."""
    auth_token: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    primary_domain: Optional[str] = None
    domain_config: Optional[Dict[str, Any]] = None
    access_permissions: Optional[List[str]] = None
    runtime_config: Optional[Dict[str, Any]] = None
