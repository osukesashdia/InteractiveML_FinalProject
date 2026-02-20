import { useContext, createContext } from './vidstack-Bu2kfzUd.js';

const mediaContext = createContext();
function useMediaContext() {
  return useContext(mediaContext);
}
function useMediaState() {
  return useMediaContext().$state;
}

export { mediaContext, useMediaContext, useMediaState };
