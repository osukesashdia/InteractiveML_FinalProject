import streamlit as st


def render():
    st.title("Review the Result")
    st.image(st.session_state.uploaded_image, width=300)
    st.divider()

    false_neg = st.session_state.false_negative_risk
    tier = st.session_state.confidence_tier
    message = st.session_state.plain_message

    # --- Tier banner (false negative overrides everything) ---
    if false_neg:
        st.error(
            "**CAUTION:** The model believes this may **not contain alcohol**, "
            "but it is not certain. Please verify by checking the physical label."
        )
    elif tier == "high":
        st.success(message)
    elif tier == "medium":
        st.warning(message)
    else:  # low
        st.error(message)

    st.markdown("### Top candidates")

    for candidate in st.session_state.top_n:
        label = candidate["label"]
        score = candidate["score"]
        pct = int(score * 100)

        if score >= 0.85:
            label_md = f":green[**{label}**]"
            tier_text = "High confidence"
        elif score >= 0.60:
            label_md = f":orange[**{label}**]"
            tier_text = "Moderate confidence"
        else:
            label_md = f":red[**{label}**]"
            tier_text = "Low confidence"

        col1, col2 = st.columns([3, 1])
        with col1:
            st.markdown(label_md)
            st.progress(score)
        with col2:
            st.metric(label=" ", value=f"{pct}%", help=tier_text)

    # --- False negative safety panel ---
    if false_neg:
        st.divider()
        with st.container(border=True):
            st.markdown("#### Safety Notice")
            st.markdown(
                "The AI suggests this beverage **may not contain alcohol**, but predictions can be wrong. "
                "**Always check the physical label** — especially if you are under 18 or need to avoid alcohol "
                "for health or personal reasons.\n\n"
                "Look for **ABV** (alcohol by volume) on the bottle. "
                "Any value **above 0.5% ABV** means the drink contains alcohol."
            )

    # --- Block LLM notice ---
    if st.session_state.block_llm:
        st.info(
            "Because the model is not confident, detailed beverage information will not be shown. "
            "Please verify using the physical label."
        )

    st.divider()
    st.button(
        "Continue to decision",
        type="primary",
        use_container_width=True,
        on_click=_advance,
    )


def _advance():
    st.session_state.step = 4
