import streamlit as st


def render():
    st.title("What would you like to do?")

    top_label = st.session_state.top_label
    top_score = st.session_state.top_score
    block_llm = st.session_state.block_llm

    st.markdown(f"**Top prediction:** {top_label} ({top_score:.0%} confidence)")
    st.divider()

    col1, col2, col3 = st.columns(3)

    with col1:
        if st.button("Accept", type="primary", use_container_width=True, help="Proceed with this prediction"):
            st.session_state.user_decision = "accept"
            if block_llm:
                # Skip LLM — go straight to output with a notice
                st.session_state.llm_response = (
                    "_Detailed information is unavailable because the model confidence is too low "
                    "or the beverage may not be alcoholic. Please check the physical label._"
                )
                st.session_state.step = 6
            else:
                st.session_state.step = 5
            st.rerun()

    with col2:
        if st.button("Try another photo", use_container_width=True, help="Go back and upload a different image"):
            _reset_and_restart()

    with col3:
        if st.button("I'm not sure", use_container_width=True, help="Flag this result as uncertain"):
            st.session_state.user_decision = "flag"
            st.session_state.step = 3
            st.rerun()

    if block_llm:
        st.divider()
        st.info(
            "If you accept this prediction, detailed information will not be shown "
            "because the model is not confident enough. You can still see the classification result."
        )


def _reset_and_restart():
    from config.settings import INITIAL_STATE
    for key, value in INITIAL_STATE.items():
        st.session_state[key] = value
    st.rerun()
