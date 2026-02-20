MODEL_ID = "openai/clip-vit-large-patch14"

CANDIDATE_LABELS = [
    "a bottle of whisky",
    "a glass of red wine",
    "a bottle of white wine",
    "a bottle of beer",
    "a can of beer",
    "a glass of sake",
    "a bottle of vodka",
    "a bottle of rum",
    "a glass of champagne",
    "a bottle of gin",
    "a glass of cocktail",
    "a bottle of tequila",
    "a non-alcoholic beverage",
    "a soft drink, juice, or water",
]

ALCOHOL_LABELS = {
    "a bottle of whisky",
    "a glass of red wine",
    "a bottle of white wine",
    "a bottle of beer",
    "a can of beer",
    "a glass of sake",
    "a bottle of vodka",
    "a bottle of rum",
    "a glass of champagne",
    "a bottle of gin",
    "a glass of cocktail",
    "a bottle of tequila",
}

NON_ALCOHOL_LABELS = {
    "a non-alcoholic beverage",
    "a soft drink, juice, or water",
}

# Confidence thresholds
HIGH_CONFIDENCE_THRESHOLD = 0.85
MEDIUM_CONFIDENCE_THRESHOLD = 0.60

TOP_N_CANDIDATES = 3

# LLM config (used when API key is available)
LLM_MODEL = "claude-opus-4-6"
LLM_MAX_TOKENS = 512

# Initial session state — used by app.py and reset functions in ui/ modules
INITIAL_STATE = {
    "step": 1,
    "uploaded_image": None,
    "image_bytes": None,
    "classification_results": None,
    "top_label": None,
    "top_score": None,
    "confidence_tier": None,
    "is_alcohol": None,
    "false_negative_risk": None,
    "top_n": None,
    "plain_message": None,
    "block_llm": False,
    "user_decision": None,
    "llm_response": None,
    "error_message": None,
}
