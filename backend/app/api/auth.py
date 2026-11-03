from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, Organization
from app.schemas.schemas import Token, UserLogin, UserCreate, UserResponse
from app.services.auth import hash_password, verify_password, create_access_token, get_current_user
from app.services.synthetic import seed_database_if_empty

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    seed_database_if_empty(db)
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role, "organization_id": user.organization_id}
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/seed")
def trigger_seed(force: bool = False, db: Session = Depends(get_db)):
    """Initializes or resets 1,000+ realistic synthetic financial transactions"""
    seed_database_if_empty(db, force_reset=force)
    return {"status": "success", "message": "Synthetic financial dataset initialized successfully."}

