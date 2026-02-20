import streamlit as st


def render():
    st.title("Beverage Information")

    col1, col2 = st.columns([1, 2])
    with col1:
        if st.session_state.uploaded_image is not None:
            st.image(st.session_state.uploaded_image, use_container_width=True)
    with col2:
        tier = st.session_state.confidence_tier
        top_label = st.session_state.top_label
        top_score = st.session_state.top_score

        # Confidence badge
        if tier == "high":
            st.success(f"**{top_label}**")
        elif tier == "medium":
            st.warning(f"**{top_label}**")
        else:
            st.error(f"**{top_label}**")

        st.caption(f"Model confidence: {top_score:.0%}")

        if st.session_state.false_negative_risk:
            st.error("This beverage was predicted to be non-alcoholic. Verify with the physical label.")

    st.divider()
    st.markdown("### Details")
    st.markdown(st.session_state.llm_response or "_No information available._")

    st.divider()
    if st.button("Start over", use_container_width=True):
        _reset()


def _reset():
    from config.settings import INITIAL_STATE
    for key, value in INITIAL_STATE.items():
        st.session_state[key] = value
    st.rerun()
