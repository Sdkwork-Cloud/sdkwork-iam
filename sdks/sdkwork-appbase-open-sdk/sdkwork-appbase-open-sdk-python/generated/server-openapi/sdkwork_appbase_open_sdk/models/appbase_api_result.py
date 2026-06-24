from __future__ import annotations
from dataclasses import dataclass
from typing import TYPE_CHECKING, Optional, List, Dict, Any


@dataclass
class AppbaseApiResult:
    code: str
    message: str
    request_id: str
    data: Dict[str, Any]
