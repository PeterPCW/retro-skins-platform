/**
 * Retro Skins Render Engine
 * 
 * Core visual effects for terminal retro styling:
 * - CRT scanlines and curvature
 * - Phosphor glow
 * - Shaking text
 * - Animated backgrounds
 * - Custom shader effects
 */

export interface SkinConfig {
  /** Skin name */
  name: string;
  /** Visual effects to apply */
  effects: VisualEffect[];
  /** Color scheme */
  colors: ColorScheme;
  /** Performance settings */
  performance: PerformanceConfig;
}

export interface VisualEffect {
  /** Effect type */
  type: EffectType;
  /** Effect intensity (0-1) */
  intensity: number;
  /** Effect-specific parameters */
  params: Partial<Record<string, number>>;
}

export type EffectType = 
  | 'crt-scanlines'
  | 'crt-curvature'
  | 'crt-flicker'
  | 'phosphor-glow'
  | 'phosphor-persistence'
  | 'shake'
  | 'animated-bg'
  | 'color-shift'
  | 'vignette'
  | 'noise';

export interface ColorScheme {
  /** Background color */
  background: string;
  /** Foreground/text color */
  foreground: string;
  /** Accent color */
  accent: string;
  /** Glow color */
  glow: string;
  /** Custom 16-color palette (overrides auto-generation for terminals like WT) */
  palette?: {
    black: string;
    red: string;
    green: string;
    yellow: string;
    blue: string;
    purple: string;
    cyan: string;
    white: string;
    brightBlack: string;
    brightRed: string;
    brightGreen: string;
    brightYellow: string;
    brightBlue: string;
    brightPurple: string;
    brightCyan: string;
    brightWhite: string;
  };
}

export interface PerformanceConfig {
  /** Enable GPU acceleration */
  gpuAcceleration: boolean;
  /** Target FPS for animations */
  targetFps: number;
  /** Quality preset */
  quality: 'low' | 'medium' | 'high';
}

export interface RenderContext {
  /** Canvas or terminal element */
  element: HTMLElement | HTMLCanvasElement;
  /** Current skin configuration */
  config: SkinConfig;
  /** Animation frame ID */
  animationId: number | null;
  /** Last render timestamp */
  lastRender: number;
}

/**
 * Create a retro skin configuration
 */
export function createSkin(config: Partial<SkinConfig>): SkinConfig {
  return {
    name: config.name || 'Default',
    effects: config.effects || [],
    colors: config.colors || {
      background: '#0D0208',
      foreground: '#00FF41',
      accent: '#008F11',
      glow: '#00FF41',
    },
    performance: config.performance || {
      gpuAcceleration: true,
      targetFps: 60,
      quality: 'high',
    },
  };
}

/**
 * Pre-defined skin configurations
 */
export const PRESET_SKINS: Record<string, () => SkinConfig> = {
  /** Classic green phosphor CRT */
  phosphor: () => createSkin({
    name: 'Phosphor CRT',
    effects: [
      { type: 'crt-scanlines', intensity: 0.4, params: { lineSpacing: 2 } },
      { type: 'phosphor-glow', intensity: 0.6, params: { radius: 3, falloff: 0.5 } },
      { type: 'phosphor-persistence', intensity: 0.3, params: { decay: 0.1 } },
      { type: 'crt-flicker', intensity: 0.1, params: { frequency: 0.1 } },
      { type: 'vignette', intensity: 0.5, params: { radius: 0.8 } },
    ],
    colors: {
      background: '#0D0208',
      foreground: '#00FF41',
      accent: '#008F11',
      glow: '#00FF41',
      palette: {
        black: '#0D0208',
        red: '#FF3333',
        green: '#00FF41',
        yellow: '#CCFF00',
        blue: '#008F11',
        purple: '#FF00FF',
        cyan: '#00FFFF',
        white: '#00FF41',
        brightBlack: '#1A1A1A',
        brightRed: '#FF6666',
        brightGreen: '#66FF66',
        brightYellow: '#FFFF66',
        brightBlue: '#66FF66',
        brightPurple: '#FF66FF',
        brightCyan: '#66FFFF',
        brightWhite: '#66FF66',
      },
    },
  }),

  /** Amber monochrome */
  amber: () => createSkin({
    name: 'Amber Monochrome',
    effects: [
      { type: 'crt-scanlines', intensity: 0.3, params: { lineSpacing: 2 } },
      { type: 'phosphor-glow', intensity: 0.5, params: { radius: 2, falloff: 0.6 } },
      { type: 'crt-flicker', intensity: 0.05, params: { frequency: 0.05 } },
      { type: 'vignette', intensity: 0.4, params: { radius: 0.9 } },
    ],
    colors: {
      background: '#1A0F00',
      foreground: '#FFB000',
      accent: '#FF8C00',
      glow: '#FFB000',
      palette: {
        black: '#1A0F00',
        red: '#FF6600',
        green: '#FFB000',
        yellow: '#FFCC00',
        blue: '#994400',
        purple: '#FF8800',
        cyan: '#FFAA00',
        white: '#FFB000',
        brightBlack: '#332200',
        brightRed: '#FF8800',
        brightGreen: '#FFCD00',
        brightYellow: '#FFDD66',
        brightBlue: '#AA6600',
        brightPurple: '#FF9900',
        brightCyan: '#FFDD88',
        brightWhite: '#FFEE99',
      },
    },
  }),

  /** White LCD style */
  lcd: () => createSkin({
    name: 'LCD Display',
    effects: [
      { type: 'crt-scanlines', intensity: 0.2, params: { lineSpacing: 1 } },
      { type: 'phosphor-glow', intensity: 0.3, params: { radius: 1, falloff: 0.8 } },
      { type: 'color-shift', intensity: 0.1, params: { shift: 0.02 } },
      { type: 'vignette', intensity: 0.2, params: { radius: 0.95 } },
    ],
    colors: {
      background: '#0A0A0A',
      foreground: '#E8E8E8',
      accent: '#A0A0A0',
      glow: '#FFFFFF',
      palette: {
        black: '#0A0A0A',
        red: '#FF4444',
        green: '#44FF44',
        yellow: '#FFFF44',
        blue: '#4444FF',
        purple: '#FF44FF',
        cyan: '#44FFFF',
        white: '#E8E8E8',
        brightBlack: '#333333',
        brightRed: '#FF8888',
        brightGreen: '#88FF88',
        brightYellow: '#FFFF88',
        brightBlue: '#8888FF',
        brightPurple: '#FF88FF',
        brightCyan: '#88FFFF',
        brightWhite: '#FFFFFF',
      },
    },
  }),

  /** Retro purple cyber */
  cyber: () => createSkin({
    name: 'Cyber Purple',
    effects: [
      { type: 'crt-scanlines', intensity: 0.35, params: { lineSpacing: 2 } },
      { type: 'phosphor-glow', intensity: 0.7, params: { radius: 4, falloff: 0.4 } },
      { type: 'crt-flicker', intensity: 0.08, params: { frequency: 0.08 } },
      { type: 'animated-bg', intensity: 0.3, params: { speed: 0.5 } },
      { type: 'noise', intensity: 0.05, params: { amount: 0.02 } },
    ],
    colors: {
      background: '#0D0D1A',
      foreground: '#B388FF',
      accent: '#7C4DFF',
      glow: '#E040FB',
      palette: {
        black: '#0D0D1A',
        red: '#FF0055',
        green: '#00FF66',
        yellow: '#FFFF00',
        blue: '#0085FF',
        purple: '#B388FF',
        cyan: '#00FFFF',
        white: '#E0E0FF',
        brightBlack: '#2A2A3A',
        brightRed: '#FF4488',
        brightGreen: '#66FF99',
        brightYellow: '#FFFF66',
        brightBlue: '#6699FF',
        brightPurple: '#D199FF',
        brightCyan: '#99FFFF',
        brightWhite: '#FFFFFF',
      },
    },
  }),

  /** Blue-tinted terminal */
  terminal: () => createSkin({
    name: 'Classic Terminal',
    effects: [
      { type: 'crt-scanlines', intensity: 0.25, params: { lineSpacing: 2 } },
      { type: 'phosphor-glow', intensity: 0.4, params: { radius: 2, falloff: 0.5 } },
      { type: 'vignette', intensity: 0.3, params: { radius: 0.85 } },
    ],
    colors: {
      background: '#0C0C14',
      foreground: '#4AF626',
      accent: '#2AAE22',
      glow: '#4AF626',
      palette: {
        black: '#0C0C14',
        red: '#CC3333',
        green: '#4AF626',
        yellow: '#CCFF00',
        blue: '#0066CC',
        purple: '#FF00FF',
        cyan: '#00CCFF',
        white: '#4AF626',
        brightBlack: '#1A1A2A',
        brightRed: '#FF6666',
        brightGreen: '#88FF88',
        brightYellow: '#FFFF66',
        brightBlue: '#6699FF',
        brightPurple: '#FF66FF',
        brightCyan: '#66FFFF',
        brightWhite: '#99FF99',
      },
    },
  }),

  /** Puncore neon theme */
  puncore: () => createSkin({
    name: 'Puncore Neon',
    effects: [
      { type: 'crt-scanlines', intensity: 0.1, params: { lineSpacing: 1 } },
      { type: 'phosphor-glow', intensity: 0.5, params: { radius: 3, falloff: 0.4 } },
      { type: 'vignette', intensity: 0.15, params: { radius: 0.95 } },
    ],
    colors: {
      background: '#575757',
      foreground: '#858585',
      accent: '#FF5700',
      glow: '#8500FF',
      palette: {
        black: '#575757',
        red: '#FF0085',
        green: '#00FF00',
        yellow: '#FF5700',
        blue: '#0085FF',
        purple: '#8500FF',
        cyan: '#0085FF',
        white: '#858585',
        brightBlack: '#313131',
        brightRed: '#FF0085',
        brightGreen: '#00FF00',
        brightYellow: '#FF8500',
        brightBlue: '#0085FF',
        brightPurple: '#8500FF',
        brightCyan: '#00FFFF',
        brightWhite: '#FFFFFF',
      },
    },
  }),
};
