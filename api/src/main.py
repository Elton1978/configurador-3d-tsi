from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# Importar routers quando criados
# from .routers import projects, blocks, proposals

app = FastAPI(
    title="Configurador 3D TSI API",
    description="API para configuração de sistemas TSI com visualização 3D",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir arquivos estáticos (modelos 3D)
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    return {"message": "Configurador 3D TSI API - Versão 1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "configurador-3d-tsi-api"}

# Incluir routers quando criados
# app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects"])
# app.include_router(blocks.router, prefix="/api/v1/blocks", tags=["blocks"])
# app.include_router(proposals.router, prefix="/api/v1/proposals", tags=["proposals"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
