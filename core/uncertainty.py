from config.settings import (
    HIGH_CONFIDENCE_THRESHOLD,
    MEDIUM_CONFIDENCE_THRESHOLD,
    ALCOHOL_LABELS,
    NON_ALCOHOL_LABELS,
    TOP_N_CANDIDATES,
)


def analyze(results: list[dict]) -> dict:
    """
    Derive uncertainty metadata from classifier output.

    Args:
        results: sorted list from classifier.classify(), descending by score.

    Returns:
        {
            "top_label": str,
            "top_score": float,
            "confidence_tier": "high" | "medium" | "low",
            "is_alcohol": bool,
            "false_negative_risk": bool,
            "top_n": list[dict],
            "plain_message": str,
            "color": "green" | "orange" | "red",
            "icon": "check" | "warning" | "danger" | "stop",
            "block_llm": bool,
        }
    """
    top = results[0]
    top_label = top["label"]
    top_score = top["score"]

    is_alcohol = top_label in ALCOHOL_LABELS
    # False negative: model's top pick is non-alcoholic — highest severity
    false_negative_risk = top_label in NON_ALCOHOL_LABELS

    if top_score >= HIGH_CONFIDENCE_THRESHOLD:
        tier = "high"
    elif top_score >= MEDIUM_CONFIDENCE_THRESHOLD:
        tier = "medium"
    else:
        tier = "low"

    plain_message, color, icon = _build_message(tier, is_alcohol, false_negative_risk)

    return {
        "top_label": top_label,
        "top_score": top_score,
        "confidence_tier": tier,
        "is_alcohol": is_alcohol,
        "false_negative_risk": false_negative_risk,
        "top_n": results[:TOP_N_CANDIDATES],
        "plain_message": plain_message,
        "color": color,
        "icon": icon,
        "block_llm": tier == "low" or false_negative_risk,
    }


def _build_message(tier: str, is_alcohol: bool, false_negative_risk: bool) -> tuple:
    if false_negative_risk:
        return (
            "The model thinks this may NOT contain alcohol, but it is not certain. "
            "Please check the physical label before acting on this result.",
            "red",
            "danger",
        )
    if tier == "high" and is_alcohol:
        return ("The model is confident this is an alcoholic beverage.", "green", "check")
    if tier == "high" and not is_alcohol:
        return ("The model is confident this does not appear to be alcoholic.", "green", "check")
    if tier == "medium":
        return (
            "The model is not fully sure. Please review the options below and confirm which looks right.",
            "orange",
            "warning",
        )
    # low
    return (
        "The model is uncertain about this image. We recommend checking the physical label before relying on this result.",
        "red",
        "stop",
    )
