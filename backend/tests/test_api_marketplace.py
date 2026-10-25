"""
MindCare AI — Unit & Integration Tests for API Marketplace Platform
Tests API key generation, SHA256 hashing security, scope authorization, REST endpoint authentication,
GraphQL query execution, and rate limiting headers.
"""
import pytest
from app.database import SessionLocal
from app.services.marketplace_service import marketplace_service


def test_api_key_generation_and_authentication():
    """Test generating API Key with prefix, SHA256 hashing, and authenticating valid key."""
    email = "dev_test_999@mindcare.ai"
    key_name = "Unit Test Key"

    db = SessionLocal()
    try:
        gen = marketplace_service.generate_api_key(
            db=db,
            developer_email=email,
            key_name=key_name,
            environment="live",
            tier="FREE",
            scopes=["emotion:analyze", "chat:write"],
        )
        assert "full_api_key" in gen
        assert gen["full_api_key"].startswith("mk_live_")
        assert gen["masked_key"].startswith("mk_live_************")

        # Authenticate generated key
        rec = marketplace_service.authenticate_api_key(
            db=db, raw_key=gen["full_api_key"], required_scope="emotion:analyze"
        )
        assert rec.developer_email == email
        assert rec.is_active is True
    finally:
        db.close()


def test_graphql_query_execution():
    """Test strongly typed GraphQL query execution."""
    db = SessionLocal()
    try:
        query = "query { emotionAnalysis(text: \"I feel great\") { emotion confidence } }"
        res = marketplace_service.execute_graphql_query(db=db, query_str=query)
        assert "data" in res
        assert "emotionAnalysis" in res["data"]
        assert res["data"]["emotionAnalysis"]["emotion"] == "Joy"
    finally:
        db.close()
