"""
Authentication routes
"""

import uuid
from datetime import timedelta
from fastapi import APIRouter, HTTPException, Depends, status
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from config.database import database, users_table
from models.schemas import UserCreate, UserLogin, UserResponse, Token, MessageResponse
from middleware.auth import (
    verify_password, get_password_hash, create_access_token, 
    get_current_active_user, JWT_EXPIRE_HOURS
)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(user_data: UserCreate, request):
    """Register a new user"""
    
    # Check if user already exists
    query = users_table.select().where(users_table.c.email == user_data.email)
    existing_user = await database.fetch_one(query)
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user
    user_id = str(uuid.uuid4())
    insert_query = users_table.insert().values(
        id=user_id,
        name=user_data.name,
        email=user_data.email,
        password=hashed_password,
        role=user_data.role.value
    )
    
    try:
        await database.execute(insert_query)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
    
    # Create access token
    access_token_expires = timedelta(hours=JWT_EXPIRE_HOURS)
    access_token = create_access_token(
        data={"sub": user_id, "email": user_data.email, "role": user_data.role.value},
        expires_delta=access_token_expires
    )
    
    # Get created user
    user_query = users_table.select().where(users_table.c.id == user_id)
    created_user = await database.fetch_one(user_query)
    
    user_response = UserResponse(
        id=created_user["id"],
        name=created_user["name"],
        email=created_user["email"],
        role=created_user["role"],
        created_at=created_user["created_at"]
    )
    
    return Token(access_token=access_token, user=user_response)

@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
async def login(user_credentials: UserLogin, request):
    """Authenticate user and return access token"""
    
    # Get user from database
    query = users_table.select().where(users_table.c.email == user_credentials.email)
    user = await database.fetch_one(query)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Verify password
    if not verify_password(user_credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Create access token
    access_token_expires = timedelta(hours=JWT_EXPIRE_HOURS)
    access_token = create_access_token(
        data={"sub": user["id"], "email": user["email"], "role": user["role"]},
        expires_delta=access_token_expires
    )
    
    user_response = UserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        created_at=user["created_at"]
    )
    
    return Token(access_token=access_token, user=user_response)

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_active_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        role=current_user["role"],
        created_at=current_user["created_at"]
    )

@router.post("/logout", response_model=MessageResponse)
async def logout(current_user: dict = Depends(get_current_active_user)):
    """Logout user (client-side token removal)"""
    # In a JWT-based system, logout is typically handled client-side
    # by removing the token. For more security, you could implement
    # a token blacklist here.
    return MessageResponse(message="Successfully logged out")