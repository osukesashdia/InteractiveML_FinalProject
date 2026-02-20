import { Host, effect, setAttribute } from './vidstack-BGSTndAW.js';
import { Poster } from './vidstack-BiyXcJ_M.js';
import './vidstack-DJDnh4xT.js';
import './vidstack-CTojmhKq.js';
import './vidstack-xMS8dnYq.js';

class MediaPosterElement extends Host(HTMLElement, Poster) {
  static tagName = "media-poster";
  static attrs = {
    crossOrigin: "crossorigin"
  };
  #img = document.createElement("img");
  onSetup() {
    this.$state.img.set(this.#img);
  }
  onConnect() {
    const { src, alt, crossOrigin } = this.$state;
    effect(() => {
      const { loading, hidden } = this.$state;
      this.#img.style.display = loading() || hidden() ? "none" : "";
    });
    effect(() => {
      setAttribute(this.#img, "alt", alt());
      setAttribute(this.#img, "crossorigin", crossOrigin());
      setAttribute(this.#img, "src", src());
    });
    if (this.#img.parentNode !== this) {
      this.prepend(this.#img);
    }
  }
}

export { MediaPosterElement };
