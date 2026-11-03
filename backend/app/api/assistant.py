from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User
from app.schemas.schemas import AssistantQueryRequest, AssistantQueryResponse
from app.services.auth import get_current_user
from app.services.assistant import AssistantService

router = APIRouter(prefix="/assistant", tags=["AI Finance Assistant"])

@router.post("/query", response_model=AssistantQueryResponse)
def ask_assistant(
    payload: AssistantQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AssistantService(db, current_user.organization_id)
    return service.process_query(
        query=payload.query,
        period=payload.period,
        bank_account_id=payload.bank_account_id
    )

