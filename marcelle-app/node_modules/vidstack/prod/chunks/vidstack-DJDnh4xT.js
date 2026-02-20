import { useContext, createContext } from './vidstack-BGSTndAW.js';

const mediaContext = createContext();
function useMediaContext() {
  return useContext(mediaContext);
}
function useMediaState() {
  return useMediaContext().$state;
}

export { mediaContext, useMediaContext, useMediaState };
