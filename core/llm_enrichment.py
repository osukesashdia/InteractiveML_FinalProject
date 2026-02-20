from config.settings import LLM_MODEL, LLM_MAX_TOKENS


def enrich(label: str, confidence: float) -> str:
    """
    Generate enriched beverage information via LLM.

    Args:
        label: Accepted classification label (e.g. "a bottle of whisky")
        confidence: Model confidence score (0.0–1.0)

    Returns:
        str: Formatted enrichment text in plain language.

    NOTE: The Anthropic API key is not yet configured.
    This function returns a placeholder. To wire in the real Claude call:
      1. Add ANTHROPIC_API_KEY to your .env file
      2. Replace the STUB block below with the REAL IMPLEMENTATION block
      3. The function signature must not change — no callers need to be updated.
    """
    # --- STUB: replace this block when API key is available ---
    return (
        f"**Classification:** {label}\n"
        f"**Confidence:** {confidence:.0%}\n\n"
        "---\n"
        "_LLM enrichment is not yet connected. When the Claude API is configured, "
        "this section will show:_\n\n"
        "- Beverage category and subcategory\n"
        "- Typical alcohol content (ABV / proof)\n"
        "- Cultural background and origin\n"
        "- Suggested food pairings\n"
        "- Safe consumption notes"
    )
    # --- END STUB ---

    # REAL IMPLEMENTATION (uncomment when ANTHROPIC_API_KEY is set):
    # import anthropic
    # client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env
    # message = client.messages.create(
    #     model=LLM_MODEL,
    #     max_tokens=LLM_MAX_TOKENS,
    #     messages=[{"role": "user", "content": _build_prompt(label, confidence)}],
    # )
    # return message.content[0].text


def _build_prompt(label: str, confidence: float) -> str:
    return (
        f"You are helping a non-native speaker identify an alcoholic beverage they photographed.\n"
        f"The image classifier identified this as: {label}\n"
        f"Classifier confidence: {confidence:.0%}\n\n"
        "Please provide in plain, simple English (suitable for someone with limited language skills):\n"
        "1. What type of alcohol this is (category and subcategory)\n"
        "2. Typical alcohol content (ABV range or proof)\n"
        "3. Where it originates from\n"
        "4. What foods it pairs well with\n"
        "5. One brief safety note about alcohol consumption\n\n"
        "Keep each point to 1-2 sentences. Use simple vocabulary."
    )
