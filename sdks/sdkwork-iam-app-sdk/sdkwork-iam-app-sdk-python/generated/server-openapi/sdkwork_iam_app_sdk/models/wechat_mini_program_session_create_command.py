from __future__ import annotations
from dataclasses import dataclass
from typing import TYPE_CHECKING, Optional, List, Dict, Any


@dataclass
class WechatMiniProgramSessionCreateCommand:
    """One-time WeChat Mini Program login-code exchange command."""
    js_code: str
    provider_code: Optional[str] = None
    surface_code: Optional[str] = None
