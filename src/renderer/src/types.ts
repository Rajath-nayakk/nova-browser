import { NovaAPI } from '../../preload';

declare global {
  interface Window {
    novaAPI: NovaAPI;
  }
}
