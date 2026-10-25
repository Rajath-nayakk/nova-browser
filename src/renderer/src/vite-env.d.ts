/// <reference types="vite/client" />
import type { NovaAPI } from '../../preload';

declare global {
  interface Window {
    novaAPI: NovaAPI;
  }
}
