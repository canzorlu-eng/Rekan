import uuid
from datetime import datetime, timezone
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _uid() -> str:
    return str(uuid.uuid4())


class LocalizedText(BaseModel):
    id: str = ""
    en: str = ""


class Step(BaseModel):
    order: int
    title: LocalizedText
    instruction: LocalizedText
    check: LocalizedText
    pictogram: str = "check"
    image_url: Optional[str] = None
    sign_video_url: Optional[str] = None
    safety: bool = False
    simplified: Optional[LocalizedText] = None


class TaskCard(BaseModel):
    id: str = Field(default_factory=_uid)
    business_id: str
    title: LocalizedText
    category: str = ""
    estimated_minutes: int = 5
    steps: List[Step] = []
    status: Literal["draft", "published"] = "draft"
    join_code: str = ""
    created_at: str = Field(default_factory=_now)
    updated_at: str = Field(default_factory=_now)


class Business(BaseModel):
    id: str = Field(default_factory=_uid)
    name: str
    sector: str = ""
    city: str = ""
    logo_seed: str = ""


class Run(BaseModel):
    id: str = Field(default_factory=_uid)
    worker_id: str
    task_card_id: str
    started_at: str = Field(default_factory=_now)
    finished_at: Optional[str] = None
    step_durations: List[float] = []


class StuckEvent(BaseModel):
    id: str = Field(default_factory=_uid)
    run_id: str
    task_card_id: str
    step_order: int
    kind: Literal["simpler", "picture", "ask"]
    created_at: str = Field(default_factory=_now)


class Suggestion(BaseModel):
    id: str = Field(default_factory=_uid)
    task_card_id: str
    step_order: int
    text: LocalizedText
    generated_at: str = Field(default_factory=_now)


# ---- request payloads ----
class BusinessCreate(BaseModel):
    name: str
    sector: str = ""
    city: str = ""


class TaskCardCreate(BaseModel):
    business_id: str
    title: LocalizedText
    category: str = ""
    estimated_minutes: int = 5
    steps: List[Step] = []


class TaskCardUpdate(BaseModel):
    title: Optional[LocalizedText] = None
    category: Optional[str] = None
    estimated_minutes: Optional[int] = None
    steps: Optional[List[Step]] = None
    status: Optional[Literal["draft", "published"]] = None


class RunCreate(BaseModel):
    worker_id: str
    task_card_id: str


class RunFinish(BaseModel):
    step_durations: List[float] = []


class StuckCreate(BaseModel):
    run_id: str
    task_card_id: str
    step_order: int
    kind: Literal["simpler", "picture", "ask"]


class SimplifyRequest(BaseModel):
    text: str
    lang: Literal["id", "en"] = "id"


class TranslateRequest(BaseModel):
    text: str
    target: Literal["id", "en"]


class GenerateFromTextRequest(BaseModel):
    business_id: str
    text: str
