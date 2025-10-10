#!/usr/bin/env python3
"""
FastAPI Backend Runner
Run the FastAPI application with uvicorn
"""

import os
import uvicorn

if __name__ == "__main__":
    # Get configuration from environment variables
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    reload = os.getenv("ENVIRONMENT", "development") != "production"
    
    print(f"🚀 Starting FastAPI backend on {host}:{port}")
    print(f"📝 Environment: {os.getenv('ENVIRONMENT', 'development')}")
    print(f"🔄 Auto-reload: {reload}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )