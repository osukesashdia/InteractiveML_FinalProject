import streamlit as st
from core.llm_enrichment import enrich


def render():
    st.title("Getting more information...")

    with st.spinner("Fetching beverage details..."):
        label = st.session_state.top_label
        score = st.session_state.top_score

        result = enrich(label, score)
        st.session_state.llm_response = result

    st.session_state.step = 6
    st.rerun()
