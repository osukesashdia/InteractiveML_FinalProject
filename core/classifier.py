from PIL import Image
from transformers import CLIPModel, CLIPProcessor
import torch

from config.settings import MODEL_ID, CANDIDATE_LABELS

_model = None
_processor = None


class ClassificationError(Exception):
    pass


def load_model():
    global _model, _processor
    if _model is None:
        _model = CLIPModel.from_pretrained(MODEL_ID)
        _processor = CLIPProcessor.from_pretrained(MODEL_ID)
        _model.eval()
    return _model, _processor


def classify(image: Image.Image) -> list[dict]:
    """
    Classify a PIL image against the beverage candidate labels.

    Returns:
        list[dict]: sorted descending by score.
        Each item: {"label": str, "score": float (0.0–1.0)}

    Raises:
        ClassificationError: on model or input failure.
    """
    try:
        model, processor = load_model()
        inputs = processor(
            text=CANDIDATE_LABELS,
            images=image,
            return_tensors="pt",
            padding=True,
        )
        with torch.no_grad():
            outputs = model(**inputs)

        probs = outputs.logits_per_image.softmax(dim=1).squeeze().tolist()

        results = sorted(
            [{"label": lbl, "score": s} for lbl, s in zip(CANDIDATE_LABELS, probs)],
            key=lambda x: x["score"],
            reverse=True,
        )
        return results
    except Exception as exc:
        raise ClassificationError(f"Classification failed: {exc}") from exc
