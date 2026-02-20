export { AudioProviderLoader, AudioTrackList, DASHProviderLoader, FullscreenController, HLSProviderLoader, List, LocalMediaStorage, Logger, MEDIA_KEY_SHORTCUTS, MediaControls, MediaPlayer, MediaProvider, MediaRemoteControl, ScreenOrientationController, TextRenderers, TextTrackList, VideoProviderLoader, VideoQualityList, VimeoProviderLoader, YouTubeProviderLoader, boundTime, canFullscreen, isAudioProvider, isDASHProvider, isGoogleCastProvider, isHLSProvider, isHTMLAudioElement, isHTMLIFrameElement, isHTMLMediaElement, isHTMLVideoElement, isVideoProvider, isVideoQualitySrc, isVimeoProvider, isYouTubeProvider, mediaState, softResetMediaState } from './chunks/vidstack-7RO-J1Y1.js';
export { mediaContext } from './chunks/vidstack-DFImIcIL.js';
import { TextTrackSymbol } from './chunks/vidstack-BYNmVJLa.js';
export { TextTrack, isTrackCaptionKind, parseJSONCaptionsFile } from './chunks/vidstack-BYNmVJLa.js';
import { isString, EventsController, DOMEvent, useState } from './chunks/vidstack-Bu2kfzUd.js';
export { appendTriggerEvent, findTriggerEvent, hasTriggerEvent, isKeyboardClick, isKeyboardEvent, isPointerEvent, walkTriggerEventChain } from './chunks/vidstack-Bu2kfzUd.js';
export { findActiveCue, isCueActive, watchActiveTextTrack, watchCueTextChange } from './chunks/vidstack-28cU2iGK.js';
export { sortVideoQualities } from './chunks/vidstack-BTM4ERc7.js';
import { Thumbnail, Slider } from './chunks/vidstack-CVwXxMve.js';
export { ARIAKeyShortcuts, AirPlayButton, AudioRadioGroup, CaptionButton, CaptionsRadioGroup, DEFAULT_PLAYBACK_RATES, FullscreenButton, LiveButton, Menu, MenuButton, MenuItem, MenuItems, MenuPortal, MuteButton, PIPButton, PlayButton, QualityRadioGroup, Radio, SeekButton, SliderController, SliderPreview, SliderValue, SpeedRadioGroup, ThumbnailsLoader, Time, TimeSlider, VolumeSlider, formatSpokenTime, formatTime, menuPortalContext, sliderContext, sliderState, updateSliderPreviewPlacement } from './chunks/vidstack-CVwXxMve.js';
export { TimeRange, getTimeRangesEnd, getTimeRangesStart, normalizeTimeIntervals, updateTimeIntervals } from './chunks/vidstack-BFg1ZqiG.js';
export { AudioGainRadioGroup, AudioGainSlider, Captions, ChaptersRadioGroup, Controls, ControlsGroup, DEFAULT_AUDIO_GAINS, Gesture, GoogleCastButton, MediaAnnouncer, QualitySlider, RadioGroup, SliderChapters, SliderVideo, SpeedSlider, ToggleButton, Tooltip, TooltipContent, TooltipTrigger } from './chunks/vidstack-9LccZv14.js';
export { Poster } from './chunks/vidstack-rB-wqXw1.js';
export { usePlyrLayoutClasses } from './chunks/vidstack-C6QxXqZ8.js';
export { getDownloadFile } from './chunks/vidstack-zG6PIeGg.js';
export { AUDIO_EXTENSIONS, AUDIO_TYPES, DASH_VIDEO_EXTENSIONS, DASH_VIDEO_TYPES, HLS_VIDEO_EXTENSIONS, HLS_VIDEO_TYPES, VIDEO_EXTENSIONS, VIDEO_TYPES, canChangeVolume, canGoogleCastSrc, canOrientScreen, canPlayHLSNatively, canRotateScreen, canUsePictureInPicture, canUseVideoPresentation, isAudioSrc, isDASHSrc, isHLSSrc, isMediaStream, isVideoSrc } from './chunks/vidstack-CjhKISI0.js';
import './chunks/vidstack-Dv_LIPFu.js';
import './chunks/vidstack-Bpr4fI4n.js';
import './chunks/vidstack-DbBJlz7I.js';
import './chunks/vidstack-C_l97D5j.js';
import '@floating-ui/dom';
import './chunks/vidstack-Dihypf8P.js';
import './chunks/vidstack-CofXIJAy.js';

class LibASSTextRenderer {
  constructor(loader, config) {
    this.loader = loader;
    this.config = config;
  }
  priority = 1;
  #instance = null;
  #track = null;
  #typeRE = /(ssa|ass)$/;
  canRender(track, video) {
    return !!video && !!track.src && (isString(track.type) && this.#typeRE.test(track.type) || this.#typeRE.test(track.src));
  }
  attach(video) {
    if (!video) return;
    this.loader().then(async (mod) => {
      this.#instance = new mod.default({
        ...this.config,
        video,
        subUrl: this.#track?.src || ""
      });
      new EventsController(this.#instance).add("ready", () => {
        const canvas = this.#instance?._canvas;
        if (canvas) canvas.style.pointerEvents = "none";
      }).add("error", (event) => {
        if (!this.#track) return;
        this.#track[TextTrackSymbol.readyState] = 3;
        this.#track.dispatchEvent(
          new DOMEvent("error", {
            trigger: event,
            detail: event.error
          })
        );
      });
    });
  }
  changeTrack(track) {
    if (!track || track.readyState === 3) {
      this.#freeTrack();
    } else if (this.#track !== track) {
      this.#instance?.setTrackByUrl(track.src);
      this.#track = track;
    }
  }
  detach() {
    this.#freeTrack();
  }
  #freeTrack() {
    this.#instance?.freeTrack();
    this.#track = null;
  }
}

class SliderThumbnail extends Thumbnail {
  #slider;
  onAttach(el) {
    this.#slider = useState(Slider.state);
  }
  getTime() {
    const { duration, clipStartTime } = this.media.$state;
    return clipStartTime() + this.#slider.pointerRate() * duration();
  }
}

{
  console.warn("[vidstack] dev mode!");
}

export { LibASSTextRenderer, Slider, SliderThumbnail, Thumbnail };
