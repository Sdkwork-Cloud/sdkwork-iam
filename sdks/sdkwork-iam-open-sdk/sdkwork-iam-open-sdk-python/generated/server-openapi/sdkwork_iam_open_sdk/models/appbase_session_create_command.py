from __future__ import annotations
from dataclasses import dataclass
from typing import TYPE_CHECKING, Optional, List, Dict, Any


@dataclass
class AppbaseSessionCreateCommand:
    """Session creation command for credential login and external user-center session exchange."""
    email: Optional[str] = None
    username: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    external_token: Optional[str] = None
    provider_key: Optional[str] = None
    tenant_id: Optional[str] = None
    organization_id: Optional[str] = None
