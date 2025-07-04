#!/usr/bin/env python3
"""
Simple runner script for the SnapShot Photo Management API
"""

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=3000,
        reload=True,
        log_level="info"
    ) 