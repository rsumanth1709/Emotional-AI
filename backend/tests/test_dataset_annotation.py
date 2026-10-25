"""
MindCare AI — Unit & Integration Tests for Dataset Annotation Platform
Tests submitting multi-turn conversation emotion annotations, consensus resolution via majority vote,
Fleiss' Kappa and Cohen's Kappa inter-annotator agreement calculations, and multi-format dataset exports (JSON, JSONL, CSV).
"""
import json
import pytest
from app.database import SessionLocal
from app.models.annotation import ConversationSample
from app.services.annotation_service import annotation_service


def test_annotation_submission_and_consensus():
    """Test submitting annotations and resolving consensus."""
    db = SessionLocal()
    try:
        task = annotation_service.seed_annotation_task(db)
        samples = annotation_service.export_dataset(db, task.id, "json")
        assert len(samples) > 0

        sample_id = db.query(ConversationSample).filter_by(task_id=task.id).first().id

        # Submit annotation from a new annotator
        res = annotation_service.submit_annotation(
            db=db,
            sample_id=sample_id,
            annotator_email="test_annotator_3@mindcare.ai",
            primary_emotion="Anxious",
            turn_emotions={"1": "Anxious", "2": "Neutral", "3": "Anxious"},
            confidence=0.95,
        )
        assert res["success"] is True

        # Verify consensus reached
        sample = db.query(ConversationSample).filter_by(id=sample_id).first()
        assert sample.is_consensus_reached is True
        assert sample.consensus_emotion == "Anxious"
    finally:
        db.close()


def test_inter_annotator_agreement_fleiss_kappa():
    """Test Fleiss' Kappa and Cohen's Kappa agreement metric calculations."""
    db = SessionLocal()
    try:
        task = annotation_service.seed_annotation_task(db)
        metrics = annotation_service.compute_inter_annotator_agreement(db, task.id)
        assert "fleiss_kappa" in metrics
        assert "cohens_kappa" in metrics
        assert "percentage_agreement" in metrics
        assert metrics["percentage_agreement"] >= 0.0
    finally:
        db.close()


def test_dataset_export_formats():
    """Test exporting dataset in JSON, JSONL, and CSV formats."""
    db = SessionLocal()
    try:
        task = annotation_service.seed_annotation_task(db)

        # Test JSON export
        json_data = annotation_service.export_dataset(db, task.id, "json")
        assert isinstance(json_data, list)
        assert "conversation_id" in json_data[0]

        # Test JSONL export
        jsonl_data = annotation_service.export_dataset(db, task.id, "jsonl")
        assert isinstance(jsonl_data, str)
        assert "\n" in jsonl_data or len(jsonl_data) > 0

        # Test CSV export
        csv_data = annotation_service.export_dataset(db, task.id, "csv")
        assert isinstance(csv_data, str)
        assert "conversation_id" in csv_data
    finally:
        db.close()
