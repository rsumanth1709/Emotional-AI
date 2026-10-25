"""
MindCare AI — Multimodal Explainability & Reasoning Engine
Generates machine-readable and human-readable explanations explaining why the final
multimodal emotion prediction was selected.
"""
from typing import Dict, List, Any, Optional


class ExplanationService:
    """Generates structured machine-readable and human-readable reasoning explanations."""

    def generate_explanation(
        self,
        final_emotion: str,
        confidence_percentage: float,
        agreement_score: float,
        modality_contributions: List[Dict[str, Any]],
        available_modalities: List[str],
        unavailable_modalities: List[str],
    ) -> Dict[str, Any]:
        """
        Generate structured explanation breakdown.
        """
        supporting = [m["modality"] for m in modality_contributions if m["is_supporting"]]
        conflicting = [m["modality"] for m in modality_contributions if not m["is_supporting"]]

        main_factors = []
        for m in modality_contributions:
            if m["is_supporting"]:
                main_factors.append(f"High {m['modality']} signal ({m['normalized_emotion']} {m['confidence_percentage']}%)")

        if agreement_score >= 0.75:
            main_factors.append(f"Strong cross-modality agreement ({int(agreement_score * 100)}%)")
        elif agreement_score < 0.50 and conflicting:
            main_factors.append(f"Conflicting signals detected ({', '.join(conflicting)} differed)")

        summary = f"{final_emotion} was the strongest combined emotional signal across available inputs."

        # Construct human-readable reasoning text
        supp_str = ", ".join(m.capitalize() for m in supporting) if supporting else "none"
        conf_str = ", ".join(m.capitalize() for m in conflicting) if conflicting else "none"

        reasoning = (
            f"Final predicted emotion '{final_emotion}' was selected with {confidence_percentage}% confidence. "
            f"Supporting modalities: {supp_str}. "
            + (f"Conflicting modalities: {conf_str}. " if conflicting else "All available modalities agreed cleanly. ")
            + f"Signal agreement score is {int(agreement_score * 100)}%."
        )

        return {
            "summary": summary,
            "final_emotion": final_emotion,
            "confidence_percentage": confidence_percentage,
            "agreement_score": round(agreement_score, 2),
            "supporting_modalities": supporting,
            "conflicting_modalities": conflicting,
            "main_factors": main_factors,
            "reasoning_text": reasoning,
            "available_modalities": available_modalities,
            "unavailable_modalities": unavailable_modalities,
        }


explanation_service = ExplanationService()
