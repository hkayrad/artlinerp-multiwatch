/// <reference types="vite/client" />

interface TwitchPlayerInstance {
  setMuted: (muted: boolean) => void;
  getMuted: () => boolean;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  pause: () => void;
  play: () => void;
  destroy: () => void;
  addEventListener: (event: string, callback: () => void) => void;
}

interface Window {
  Twitch?: {
    Player: new (
      element: string | HTMLElement,
      options: {
        channel?: string;
        video?: string;
        collection?: string;
        parent: string[];
        width?: string | number;
        height?: string | number;
        autoplay?: boolean;
        muted?: boolean;
      }
    ) => TwitchPlayerInstance;
  };
}
