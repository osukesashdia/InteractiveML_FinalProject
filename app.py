import streamlit as st

from config.settings import INITIAL_STATE
from ui import (
    step1_upload,
    step2_classify,
    step3_uncertainty,
    step4_decision,
    step5_enrichment,
    step6_output,
)

STEP_LABELS = ["Upload", "Classify", "Review", "Decide", "Enrich", "Result"]

STEP_MODULES = {
    1: step1_upload,
    2: step2_classify,
    3: step3_uncertainty,
    4: step4_decision,
    5: step5_enrichment,
    6: step6_output,
}


def init_state():
    for key, value in INITIAL_STATE.items():
        if key not in st.session_state:
            st.session_state[key] = value


def reset_flow():
    for key, value in INITIAL_STATE.items():
        st.session_state[key] = value


st.set_page_config(
    page_title="Beverage Identifier",
    page_icon="🍶",
    layout="centered",
)

init_state()

# Sidebar — step progress
st.sidebar.title("Progress")
current_step = st.session_state.step
for i, label in enumerate(STEP_LABELS, start=1):
    if i < current_step:
        st.sidebar.markdown(f"✅ Step {i}: {label}")
    elif i == current_step:
        st.sidebar.markdown(f"**▶ Step {i}: {label}**")
    else:
        st.sidebar.markdown(f"○ Step {i}: {label}")

if current_step > 1:
    if st.sidebar.button("Start Over"):
        reset_flow()
        st.rerun()

# Route to current step
STEP_MODULES[current_step].render()
