from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime

class EvidenceItem(BaseModel):
    claim: str
    status: Literal['verified', 'unverified', 'opinion', 'unavailable']
    source_title: Optional[str] = None
    publisher: Optional[str] = None
    url: Optional[str] = None
    publication_date: Optional[str] = None
    explanation: Optional[str] = None

class Argument(BaseModel):
    id: str
    claim: str
    logical_explanation: str
    real_world_example: str
    evidence_items: List[EvidenceItem] = Field(default_factory=list)
    strength_label: Literal['Decisive', 'Strong', 'Moderate', 'Supporting'] = 'Strong'

class DebateSide(BaseModel):
    opening_statement: str
    arguments: List[Argument]
    concluding_statement: str

class RebuttalItem(BaseModel):
    argument_id: str
    original_claim: str
    counter_challenge: str
    logical_response: str
    supporting_evidence: EvidenceItem
    weak_point: str

class ExpectedQuestion(BaseModel):
    question: str
    suggested_answer: str

class DebatePrep(BaseModel):
    opening_speech: str
    closing_speech: str
    duration_minutes: int
    word_count: int
    cross_examination_questions: List[str]  # 8-10 questions to ask opposing team
    expected_questions: List[ExpectedQuestion]  # 8-10 questions you may face + suggested answer
    checklist: List[str]  # Key points to remember

class DebateInterpretation(BaseModel):
    interpreted_as: str
    alternative_interpretations: List[str] = Field(default_factory=list)
    is_time_sensitive: bool = False
    category: Optional[str] = "General"

class VerificationSummary(BaseModel):
    verified_count: int = 0
    unverified_count: int = 0
    opinion_count: int = 0
    unavailable_count: int = 0
    retrieval_date: str
    search_engine_used: str

class SourceItem(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = None
    publisher: Optional[str] = None
    url: str
    published_date: Optional[str] = None
    retrieved_at: Optional[datetime] = None
    verified: bool = False
    status_label: str = "unverified"
    snippet: Optional[str] = None

class DebateSettings(BaseModel):
    difficulty: Literal['Beginner', 'Intermediate', 'Advanced'] = 'Intermediate'
    style: Literal['Simple', 'Academic', 'Persuasive'] = 'Academic'
    argument_count: Literal[3, 5, 7] = 5
    duration_minutes: Literal[2, 5, 10] = 5
    side_focus: Literal['Both', 'FOR', 'AGAINST'] = 'Both'

class DebateResult(BaseModel):
    interpretation: DebateInterpretation
    for_side: DebateSide
    against_side: DebateSide
    for_rebuttals: List[RebuttalItem] = Field(default_factory=list)
    against_rebuttals: List[RebuttalItem] = Field(default_factory=list)
    prep_for: Optional[DebatePrep] = None
    prep_against: Optional[DebatePrep] = None
    verification_summary: VerificationSummary
    sources: List[SourceItem] = Field(default_factory=list)

class DebateCreateRequest(BaseModel):
    topic: str = Field(..., min_length=5, max_length=300)
    settings: Optional[DebateSettings] = Field(default_factory=DebateSettings)

class DebateRegenerateRequest(BaseModel):
    settings: Optional[DebateSettings] = None

class DebateResponse(BaseModel):
    id: str
    topic: str
    interpretation: Optional[str] = None
    settings: Dict[str, Any]
    status: str
    stage_message: Optional[str] = ""
    error_message: Optional[str] = None
    result: Optional[DebateResult] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DebateSummary(BaseModel):
    id: str
    topic: str
    interpretation: Optional[str] = None
    status: str
    settings: Dict[str, Any]
    created_at: datetime
    argument_count: Optional[int] = 5

    class Config:
        from_attributes = True

class DebateListResponse(BaseModel):
    items: List[DebateSummary]
    total: int
    page: int
    limit: int

class HealthResponse(BaseModel):
    status: str
    version: str
    llm_configured: bool
    llm_provider: str
    search_configured: bool
    search_provider: str
    database: str

