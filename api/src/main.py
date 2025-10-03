from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import asyncpg
import json
from datetime import datetime, timedelta
import uuid
import hashlib
import jwt
import os

from database import get_db_connection, init_db

app = FastAPI(
    title="Configurador 3D TSI API",
    description="API para o sistema de configuração 3D de equipamentos industriais TSI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "https://configurador-tsi.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir arquivos estáticos (modelos 3D, imagens)
if os.path.exists("../static"):
    app.mount("/static", StaticFiles(directory="../static"), name="static")

# Configuração de segurança
security = HTTPBearer()
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
ALGORITHM = "HS256"

# === MODELOS PYDANTIC ===

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    customer_id: Optional[str] = None
    barracao: Dict[str, Any]
    application: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    barracao: Optional[Dict[str, Any]] = None
    status: Optional[str] = None

class BlockCreate(BaseModel):
    project_id: str
    variant_id: str
    position: Dict[str, float]
    rotation: Optional[Dict[str, float]] = None
    options: Optional[Dict[str, Any]] = None
    tag: Optional[str] = None

class ProposalGenerate(BaseModel):
    project_id: str
    template: Optional[str] = "standard"
    options: Optional[Dict[str, Any]] = None

# === UTILITÁRIOS DE AUTENTICAÇÃO ===

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return username
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# === ENDPOINTS DE AUTENTICAÇÃO ===

@app.post("/auth/register", status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    """Registrar novo usuário"""
    conn = await get_db_connection()
    try:
        # Verificar se usuário já existe
        existing = await conn.fetchrow(
            "SELECT id FROM users WHERE username = $1 OR email = $2",
            user.username, user.email
        )
        if existing:
            raise HTTPException(status_code=400, detail="Username or email already registered")
        
        # Criar novo usuário
        user_id = str(uuid.uuid4())
        hashed_password = hash_password(user.password)
        
        await conn.execute(
            """INSERT INTO users (id, username, email, password_hash, full_name, created_at)
               VALUES ($1, $2, $3, $4, $5, $6)""",
            user_id, user.username, user.email, hashed_password, 
            user.full_name, datetime.utcnow()
        )
        
        return {"message": "User created successfully", "user_id": user_id}
    finally:
        await conn.close()

@app.post("/auth/login")
async def login_user(user: UserLogin):
    """Fazer login e obter token"""
    conn = await get_db_connection()
    try:
        # Verificar credenciais
        db_user = await conn.fetchrow(
            "SELECT id, username, password_hash FROM users WHERE username = $1",
            user.username
        )
        
        if not db_user or db_user['password_hash'] != hash_password(user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password"
            )
        
        # Criar token
        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": db_user['id']
        }
    finally:
        await conn.close()

# === ENDPOINTS DE CATÁLOGO ===

@app.get("/catalog/families")
async def get_families():
    """Obter todas as famílias de produtos"""
    conn = await get_db_connection()
    try:
        families = await conn.fetch("SELECT * FROM families ORDER BY name")
        return [dict(family) for family in families]
    finally:
        await conn.close()

@app.get("/catalog/variants")
async def get_variants(family_id: Optional[str] = None):
    """Obter variantes de produtos"""
    conn = await get_db_connection()
    try:
        if family_id:
            variants = await conn.fetch(
                """SELECT v.*, f.name as family_name 
                   FROM variants v 
                   JOIN families f ON v.family_id = f.id 
                   WHERE v.family_id = $1 
                   ORDER BY v.name""",
                family_id
            )
        else:
            variants = await conn.fetch(
                """SELECT v.*, f.name as family_name 
                   FROM variants v 
                   JOIN families f ON v.family_id = f.id 
                   ORDER BY f.name, v.name"""
            )
        
        return [dict(variant) for variant in variants]
    finally:
        await conn.close()

@app.get("/catalog/connectors")
async def get_connectors():
    """Obter tipos de conectores"""
    conn = await get_db_connection()
    try:
        connectors = await conn.fetch("SELECT * FROM connectors ORDER BY type, name")
        return [dict(connector) for connector in connectors]
    finally:
        await conn.close()

# === ENDPOINTS DE PROJETOS ===

@app.post("/projects", status_code=status.HTTP_201_CREATED)
async def create_project(project: ProjectCreate, username: str = Depends(verify_token)):
    """Criar novo projeto"""
    conn = await get_db_connection()
    try:
        # Obter user_id
        user = await conn.fetchrow("SELECT id FROM users WHERE username = $1", username)
        
        project_id = str(uuid.uuid4())
        await conn.execute(
            """INSERT INTO projects (id, name, description, user_id, customer_id, 
                                   barracao, application, status, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)""",
            project_id, project.name, project.description, user['id'],
            project.customer_id, json.dumps(project.barracao), 
            project.application, 'draft', datetime.utcnow()
        )
        
        return {"message": "Project created successfully", "project_id": project_id}
    finally:
        await conn.close()

@app.get("/projects")
async def get_user_projects(username: str = Depends(verify_token)):
    """Obter projetos do usuário"""
    conn = await get_db_connection()
    try:
        user = await conn.fetchrow("SELECT id FROM users WHERE username = $1", username)
        
        projects = await conn.fetch(
            """SELECT p.*, u.username as owner_username 
               FROM projects p 
               JOIN users u ON p.user_id = u.id 
               WHERE p.user_id = $1 
               ORDER BY p.updated_at DESC""",
            user['id']
        )
        
        return [dict(project) for project in projects]
    finally:
        await conn.close()

@app.get("/projects/{project_id}")
async def get_project(project_id: str, username: str = Depends(verify_token)):
    """Obter projeto específico"""
    conn = await get_db_connection()
    try:
        user = await conn.fetchrow("SELECT id FROM users WHERE username = $1", username)
        
        project = await conn.fetchrow(
            """SELECT p.*, u.username as owner_username 
               FROM projects p 
               JOIN users u ON p.user_id = u.id 
               WHERE p.id = $1 AND p.user_id = $2""",
            project_id, user['id']
        )
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Obter blocos do projeto
        blocks = await conn.fetch(
            """SELECT pb.*, v.name as variant_name, v.family_id, f.name as family_name
               FROM project_blocks pb
               JOIN variants v ON pb.variant_id = v.id
               JOIN families f ON v.family_id = f.id
               WHERE pb.project_id = $1
               ORDER BY pb.created_at""",
            project_id
        )
        
        project_dict = dict(project)
        project_dict['blocks'] = [dict(block) for block in blocks]
        
        return project_dict
    finally:
        await conn.close()

# === ENDPOINTS DE BLOCOS ===

@app.post("/projects/{project_id}/blocks", status_code=status.HTTP_201_CREATED)
async def add_block_to_project(project_id: str, block: BlockCreate, username: str = Depends(verify_token)):
    """Adicionar bloco ao projeto"""
    conn = await get_db_connection()
    try:
        user = await conn.fetchrow("SELECT id FROM users WHERE username = $1", username)
        
        # Verificar se projeto existe e pertence ao usuário
        project_exists = await conn.fetchrow(
            "SELECT id FROM projects WHERE id = $1 AND user_id = $2",
            project_id, user['id']
        )
        if not project_exists:
            raise HTTPException(status_code=404, detail="Project not found")
        
        block_id = str(uuid.uuid4())
        await conn.execute(
            """INSERT INTO project_blocks (id, project_id, variant_id, position, 
                                         rotation, options, tag, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)""",
            block_id, project_id, block.variant_id, 
            json.dumps(block.position), json.dumps(block.rotation or {}),
            json.dumps(block.options or {}), block.tag, datetime.utcnow()
        )
        
        return {"message": "Block added successfully", "block_id": block_id}
    finally:
        await conn.close()

# === ENDPOINTS DE PROPOSTAS ===

@app.post("/proposals/generate")
async def generate_proposal(proposal_data: ProposalGenerate, username: str = Depends(verify_token)):
    """Gerar proposta comercial"""
    conn = await get_db_connection()
    try:
        user = await conn.fetchrow("SELECT id FROM users WHERE username = $1", username)
        
        # Verificar se projeto existe
        project = await conn.fetchrow(
            "SELECT * FROM projects WHERE id = $1 AND user_id = $2",
            proposal_data.project_id, user['id']
        )
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Simular geração de proposta
        proposal_id = str(uuid.uuid4())
        proposal_number = f"PROP-{datetime.now().year}-{1:04d}"
        
        proposal = {
            "id": proposal_id,
            "number": proposal_number,
            "project_id": proposal_data.project_id,
            "template": proposal_data.template,
            "total_value": 250000.00,
            "status": "draft",
            "created_at": datetime.utcnow().isoformat(),
            "valid_until": (datetime.utcnow() + timedelta(days=30)).isoformat()
        }
        
        return {
            "message": "Proposal generated successfully",
            "proposal": proposal
        }
    finally:
        await conn.close()

# === ENDPOINTS DE CONFIGURAÇÃO ===

@app.post("/configure")
async def configure_product(config_data: Dict[str, Any]):
    """Configurar produto com opções específicas"""
    return {
        "configuration_id": str(uuid.uuid4()),
        "base_variant": config_data.get("variant_id"),
        "options": config_data.get("options", {}),
        "calculated_price": 50000.00,
        "specifications": {
            "capacity": 100,
            "power": 15,
            "weight": 2500,
            "dimensions": {"length": 3, "width": 2, "height": 2.5}
        },
        "validations": [],
        "warnings": []
    }

@app.post("/pricing/calculate")
async def calculate_pricing(pricing_data: Dict[str, Any]):
    """Calcular preços de itens ou projeto"""
    items = pricing_data.get("items", [])
    
    total_price = 0
    item_prices = []
    
    for item in items:
        base_price = item.get("base_price", 50000)
        multiplier = item.get("multiplier", 1.0)
        item_price = base_price * multiplier
        
        item_prices.append({
            "item_id": item.get("id"),
            "base_price": base_price,
            "final_price": item_price,
            "breakdown": {
                "base": base_price,
                "adjustments": 0,
                "discounts": 0,
                "taxes": item_price * 0.2
            }
        })
        
        total_price += item_price
    
    return {
        "pricing_id": str(uuid.uuid4()),
        "total_price": total_price,
        "currency": "BRL",
        "items": item_prices,
        "discounts": [],
        "taxes": total_price * 0.2,
        "calculated_at": datetime.utcnow().isoformat()
    }

# === ENDPOINTS DE SISTEMA ===

@app.get("/")
async def root():
    return {
        "message": "Configurador 3D TSI API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Verificação de saúde do sistema"""
    try:
        conn = await get_db_connection()
        await conn.fetchval("SELECT 1")
        await conn.close()
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    return {
        "status": "healthy" if "healthy" in db_status else "degraded",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": db_status
        }
    }

# === INICIALIZAÇÃO ===

@app.on_event("startup")
async def startup_event():
    """Inicializar serviços na inicialização"""
    try:
        await init_db()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize database: {e}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
