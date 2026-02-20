import streamlit as st
from core.classifier import classify, ClassificationError, load_model
from core import uncertainty


@st.cache_resource(show_spinner=False)
def _load_model_cached():
    """Load CLIP model once and keep it in cache across reruns."""
    return load_model()


def render():
    st.title("Analyzing your photo...")

    # Pre-load model (cached — fast on subsequent calls)
    with st.spinner("Loading model (first run may take a moment)..."):
        _load_model_cached()

    with st.spinner("Identifying beverage..."):
        try:
            results = classify(st.session_state.uploaded_image)
            analysis = uncertainty.analyze(results)

            # Write all analysis fields into session state
            st.session_state.classification_results = results
            st.session_state.top_label = analysis["top_label"]
            st.session_state.top_score = analysis["top_score"]
            st.session_state.confidence_tier = analysis["confidence_tier"]
            st.session_state.is_alcohol = analysis["is_alcohol"]
            st.session_state.false_negative_risk = analysis["false_negative_risk"]
            st.session_state.top_n = analysis["top_n"]
            st.session_state.plain_message = analysis["plain_message"]
            st.session_state.block_llm = analysis["block_llm"]
            st.session_state.error_message = None

            st.session_state.step = 3
            st.rerun()

        except ClassificationError as exc:
            st.session_state.error_message = str(exc)
            st.error(f"Could not analyze the image: {exc}")
            if st.button("Try again"):
                st.session_state.step = 1
                st.rerun()
