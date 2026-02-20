import io
import streamlit as st
from PIL import Image


def render():
    st.title("Beverage Identifier")
    st.markdown(
        "Take or upload a photo of an alcoholic beverage. "
        "The AI will help you identify it and explain what it is."
    )
    st.divider()

    uploaded_file = st.file_uploader(
        "Upload a photo of a beverage",
        type=["jpg", "jpeg", "png", "webp"],
        help="Works best with clear, well-lit photos of the bottle or glass.",
    )

    if uploaded_file is not None:
        image_bytes = uploaded_file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        st.image(image, caption="Your photo", use_container_width=True)

        if st.button("Identify this beverage", type="primary", use_container_width=True):
            st.session_state.uploaded_image = image
            st.session_state.image_bytes = image_bytes
            st.session_state.step = 2
            st.rerun()
