import { scoped } from '../chunks/vidstack-BGSTndAW.js';
import { HTMLMediaProvider } from './vidstack-html.js';
import { HTMLAirPlayAdapter } from '../chunks/vidstack-Bq6c3Bam.js';
import '../chunks/vidstack-xMS8dnYq.js';
import '../chunks/vidstack-DqAw8m9J.js';
import '../chunks/vidstack-Dihypf8P.js';
import '../chunks/vidstack-D5EzK014.js';

class AudioProvider extends HTMLMediaProvider {
  $$PROVIDER_TYPE = "AUDIO";
  get type() {
    return "audio";
  }
  airPlay;
  constructor(audio, ctx) {
    super(audio, ctx);
    scoped(() => {
      this.airPlay = new HTMLAirPlayAdapter(this.media, ctx);
    }, this.scope);
  }
  setup() {
    super.setup();
    if (this.type === "audio") this.ctx.notify("provider-setup", this);
  }
  /**
   * The native HTML `<audio>` element.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement}
   */
  get audio() {
    return this.media;
  }
}

export { AudioProvider };
