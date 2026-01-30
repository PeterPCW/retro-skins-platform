# Retro Skins Platform — Architecture Document

**Created:** 2026-01-29
**Status:** Draft
**PRD:** `/projects/retro-skins-platform/prd/01-platform-prd.md`

---

## Overview

This document details the technical architecture for a cross-terminal retro visual skin platform. The system is designed as a modular, extractable ecosystem with three core components:

1. **Render Engine** — Standalone library for retro visual effects
2. **Terminal Adapters** — Terminal-specific integration layers
3. **Skin Marketplace** — Community skin distribution platform

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Retro Skins Platform                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   Render Engine │    │   Terminal      │    │   Marketplace│ │
│  │   (Core Lib)    │◄──►│   Adapters      │◄──►│   (Web/CLI)  │ │
│  │                 │    │                 │    │              │ │
│  │ • CRT effects   │    │ • WezTerm Lua   │    │ • Skin       │ │
│  │ • LCD effects   │    │ • Alacritty     │    │   repository │ │
│  │ • Monochrome    │    │ • Kitty Sixel   │    │ • Artist     │ │
│  │ • Glow/Bloom    │    │ • iTerm2        │    │   portal     │ │
│  │ • Scanlines     │    │ • Windows Term  │    │ • Payments   │ │
│  │ • Color grading │    │                 │    │ • Analytics  │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│           │                     │                     │         │
│           └─────────────────────┴─────────────────────┘         │
│                             │                                   │
│                    ┌────────▼────────┐                          │
│                    │   Skin Format   │                          │
│                    │   (JSON/YAML)   │                          │
│                    └─────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component 1: Render Engine

### Core Architecture

```
src/
├── effects/
│   ├── CRT/
│   │   ├── scanlines.ts
│   │   ├── phosphor.ts
│   │   ├── curvature.ts
│   │   ├── vignette.ts
│   │   └── index.ts
│   ├── LCD/
│   │   ├── subpixel.ts
│   │   ├── grid.ts
│   │   ├── backlight.ts
│   │   └── index.ts
│   ├── Monochrome/
│   │   ├── green.ts
│   │   ├── amber.ts
│   │   ├── white.ts
│   │   └── index.ts
│   ├── Glow/
│   │   ├── bloom.ts
│   │   ├── halo.ts
│   │   └── index.ts
│   └── common/
│       ├── color.ts
│       ├── blend.ts
│       └── index.ts
├── engine/
│   ├── renderer.ts
│   ├── compositor.ts
│   ├── shader.ts
│   └── index.ts
├── skin/
│   ├── parser.ts
│   ├── validator.ts
│   └── index.ts
└── index.ts
```

### Effect Interfaces

```typescript
/**
 * Base interface for all visual effects
 */
export interface VisualEffect {
  readonly type: EffectType;
  readonly intensity: number; // 0.0 - 1.0
  readonly params: EffectParams;
  
  /**
   * Apply effect to frame buffer
   */
  apply(frame: FrameBuffer, options?: EffectOptions): FrameBuffer;
  
  /**
   * Get effect metadata for UI
   */
  getMetadata(): EffectMetadata;
}

/**
 * Effect types supported by the engine
 */
export type EffectType = 
  | 'crt.scanlines'
  | 'crt.phosphor'
  | 'crt.curvature'
  | 'crt.vignette'
  | 'crt.chromatic-aberration'
  | 'lcd.subpixel'
  | 'lcd.grid'
  | 'lcd.backlight'
  | 'monochrome.green'
  | 'monochrome.amber'
  | 'monochrome.white'
  | 'monochrome.ibm'
  | 'glow.bloom'
  | 'glow.halo'
  | 'color.grading'
  | 'color.sepia';

/**
 * Configuration for an effect instance
 */
export interface EffectConfig {
  type: EffectType;
  enabled: boolean;
  intensity: number;
  params: Record<string, number | string | boolean>;
}

/**
 * Complete skin configuration
 */
export interface RetroSkin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  effects: EffectConfig[];
  colors: ColorScheme;
  typography: TypographyConfig;
  metadata: SkinMetadata;
}

/**
 * Color scheme definition
 */
export interface ColorScheme {
  background: string; // hex or CSS color
  foreground: string;
  cursor: string;
  selection: string;
  ANSI: string[]; // 16 ANSI colors
  palette?: string[]; // Extended palette (256 colors)
}

/**
 * Typography configuration
 */
export interface TypographyConfig {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  fontWeight: number;
  antialiasing: 'none' | 'subpixel' | 'grayscale';
}
```

### Frame Buffer Structure

```typescript
/**
 * Pixel data structure for rendering
 */
export interface Pixel {
  r: number; // 0-255
  g: number;
  b: number;
  a: number; // 0-255, alpha
}

/**
 * Frame buffer for terminal content
 */
export interface FrameBuffer {
  width: number;
  height: number;
  pixels: Pixel[]; // Row-major order
  timestamp: number;
  
  // Cell-based storage for terminal content
  cells?: TerminalCell[];
}

/**
 * Terminal cell (character + attributes)
 */
export interface TerminalCell {
  char: string;
  fg: string; // Color index or hex
  bg: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
}
```

### Renderer Implementation

```typescript
/**
 * Main renderer class
 */
export class RetroRenderer {
  private effects: VisualEffect[];
  private compositor: Compositor;
  private canvas: HTMLCanvasElement | OffscreenCanvas | null;
  private gl: WebGLRenderingContext | null = null;
  
  constructor(options: RendererOptions = {}) {
    this.effects = [];
    this.compositor = new Compositor();
    this.canvas = options.canvas || null;
    
    if (options.gpuAcceleration && typeof window !== 'undefined') {
      this.initWebGL();
    }
  }
  
  /**
   * Register a visual effect
   */
  registerEffect(effect: VisualEffect): void {
    this.effects.push(effect);
  }
  
  /**
   * Remove an effect by type
   */
  unregisterEffect(type: EffectType): void {
    this.effects = this.effects.filter(e => e.type !== type);
  }
  
  /**
   * Render a frame with all registered effects
   */
  render(frame: FrameBuffer, skin: RetroSkin): FrameBuffer {
    let result = frame;
    
    // Apply enabled effects in order
    for (const effect of this.effects) {
      const config = skin.effects.find(c => c.type === effect.type && c.enabled);
      if (config) {
        effect.intensity = config.intensity;
        effect.params = config.params;
        result = effect.apply(result);
      }
    }
    
    return result;
  }
  
  /**
   * Render to canvas for preview/export
   */
  renderToCanvas(
    frame: FrameBuffer,
    skin: RetroSkin,
    canvas: HTMLCanvasElement
  ): void {
    const rendered = this.render(frame, skin);
    this.drawToCanvas(rendered, canvas);
  }
  
  /**
   * Initialize WebGL for GPU acceleration
   */
  private initWebGL(): void {
    // WebGL initialization for shader-based effects
  }
  
  /**
   * Draw frame buffer to canvas
   */
  private drawToCanvas(frame: FrameBuffer, canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const imageData = ctx.createImageData(frame.width, frame.height);
    const data = imageData.data;
    
    for (let i = 0; i < frame.pixels.length; i++) {
      const pixel = frame.pixels[i];
      const idx = i * 4;
      data[idx] = pixel.r;
      data[idx + 1] = pixel.g;
      data[idx + 2] = pixel.b;
      data[idx + 3] = pixel.a;
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
}
```

---

## Component 2: Terminal Adapters

### WezTerm Adapter

WezTerm supports Lua scripting for visual customization:

```lua
-- wezterm/skins/retro-crt.lua
local wezterm = require 'wezterm'

local Skin = {}

function Skin.apply(config)
  -- Enable true color
  config.colors = {
    foreground = '#33ff33',
    background = '#001100',
    cursor_bg = '#33ff33',
    cursor_fg = '#001100',
    selection_bg = '#33ff33',
    selection_fg = '#001100',
  }
  
  -- Font configuration
  config.font = wezterm.font 'IBM Plex Mono'
  config.font_size = 14
  
  -- Disable default cursor styles
  config.cursor_style = 'BlinkingBlock'
  
  -- Apply custom CSS via tab bar
  wezterm.on('format-tab-title', function(tab, tabs, panes, config, hover)
    return string.format(
      '[%s] %s',
      tab.tab_index + 1,
      tab.active_pane.title or 'Shell'
    )
  end)
  
  -- Disable native window decorations for full retro effect
  config.win32_system_backdrop = 'Acrylic'
end

return Skin
```

**Integration approach:**
1. Provide Lua skin files as downloadable modules
2. User copies to `~/.config/wezterm/skins/`
3. Add `wezterm -c ~/.config/wezterm/skins/retro-crt.lua` to terminal command

### Alacritty Adapter

Alacritty uses YAML configuration:

```yaml
# alacritty/skins/retro-crt.yml
colors:
  primary:
    background: '#0a0a0a'
    foreground: '#33ff33'
  cursor:
    cursor: '#33ff33'
    text: '#0a0a0a'
  selection:
    background: '#33ff33'
    foreground: '#0a0a0a'
  normal:
    black: '#0a0a0a'
    red: '#ff3333'
    green: '#33ff33'
    yellow: '#ffff33'
    blue: '#3333ff'
    magenta: '#ff33ff'
    cyan: '#33ffff'
    white: '#cccccc'
  bright:
    black: '#666666'
    # ... extended colors

font:
  normal:
    family: "IBM Plex Mono"
    style: Regular
  size: 14

cursor:
  style: Block
  blinking: On

draw_bold_text_with_bright_colors: true

window:
  padding:
    x: 10
    y: 10
```

### Kitty Adapter

Kitty supports Sixel graphics for advanced effects:

```python
# kitty/skins/retro_crt.py
import sys

def apply_skin(config):
    """Apply retro CRT skin via Kitty configuration"""
    
    skin_config = """
# Retro CRT Skin - Kitty Configuration
include ./kitty.conf.base

# Color scheme
background #001100
foreground #33ff33
cursor #33ff33
selection_background #33ff33
selection_foreground #001100

# Extended color palette (256 colors)
color0 #0a0a0a
color1 #ff3333
color2 #33ff33
color3 #ffff33
color4 #3333ff
color5 #ff33ff
color6 #33ffff
color7 #cccccc
color8 #666666
# ... rest of 256 colors

# Font
font_family IBM Plex Mono
bold_font IBM Plex Mono SemiBold
italic_font IBM Plex Mono Italic
bold_italic_font IBM Plex Mono SemiBold Italic
font_size 14.0

# Cursor
cursor_style block
cursor_blink_interval 0.5

# Retro effects via Sixel
# (Kitty supports sixel graphics for advanced effects)
    """
    
    print(skin_config)
```

### Adapter Interface

```typescript
/**
 * Base interface for terminal adapters
 */
export interface TerminalAdapter {
  readonly terminal: string;
  readonly extensions: string[];
  
  /**
   * Convert skin to terminal-specific config
   */
  exportSkin(skin: RetroSkin): TerminalConfig;
  
  /**
   * Apply skin to running terminal
   */
  applySkin(config: TerminalConfig): void;
  
  /**
   * Get installation instructions
   */
  getInstallInstructions(): string;
}

/**
 * Terminal-specific configuration
 */
export interface TerminalConfig {
  files: ConfigFile[];
  scripts: InstallScript[];
  dependencies?: string[];
}

export interface ConfigFile {
  path: string;
  content: string;
  mode: 'overwrite' | 'append' | 'merge';
}

export interface InstallScript {
  platform: 'linux' | 'macos' | 'windows';
  commands: string[];
  description: string;
}
```

---

## Component 3: Skin Format

### JSON Schema

```json
{
  "$schema": "https://retro-skins.dev/schema/v1/skin.json",
  "id": "retro-crt-classic",
  "name": "Retro CRT Classic",
  "version": "1.0.0",
  "description": "Classic 1980s CRT monitor aesthetic",
  "author": {
    "name": "Terminal Artist",
    "email": "artist@example.com",
    "url": "https://github.com/artist"
  },
  "license": "MIT",
  "tags": ["crt", "retro", "phosphor", "green"],
  "effects": [
    {
      "type": "crt.scanlines",
      "enabled": true,
      "intensity": 0.7,
      "params": {
        "lineThickness": 2,
        "lineColor": "rgba(0,0,0,0.5)"
      }
    },
    {
      "type": "crt.phosphor",
      "enabled": true,
      "intensity": 0.8,
      "params": {
        "dotPitch": 0.25,
        "glowRadius": 1.5
      }
    },
    {
      "type": "crt.curvature",
      "enabled": true,
      "intensity": 1.0,
      "params": {
        "radius": 3.0,
        "corners": true
      }
    }
  ],
  "colors": {
    "background": "#001100",
    "foreground": "#33ff33",
    "cursor": "#33ff33",
    "selection": "rgba(51, 255, 51, 0.3)",
    "ANSI": [
      "#0a0a0a", "#ff3333", "#33ff33", "#ffff33",
      "#3333ff", "#ff33ff", "#33ffff", "#cccccc",
      "#666666", "#ff6666", "#66ff66", "#ffff66",
      "#6666ff", "#ff66ff", "#66ffff", "#ffffff"
    ]
  },
  "typography": {
    "fontFamily": "IBM Plex Mono",
    "fontSize": 14,
    "lineHeight": 1.2,
    "letterSpacing": 0,
    "fontWeight": 400,
    "antialiasing": "subpixel"
  },
  "compatibility": {
    "wezterm": ">=2023.03.17",
    "alacritty": ">=0.12.0",
    "kitty": ">=0.26.0",
    "iterm2": ">=3.4"
  },
  "preview": {
    "image": "preview.png",
    "thumbnail": "thumbnail.png"
  },
  "metadata": {
    "created": "2026-01-29T00:00:00Z",
    "updated": "2026-01-29T00:00:00Z",
    "downloads": 0,
    "rating": 0
  }
}
```

### Validation

```typescript
/**
 * Validate a skin configuration
 */
export function validateSkin(skin: RetroSkin): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Required fields
  if (!skin.id || !skin.id.match(/^[a-z0-9-]+$/)) {
    errors.push({
      field: 'id',
      message: 'ID must be lowercase, hyphen-separated'
    });
  }
  
  // Effect validation
  for (const effect of skin.effects) {
    const effectValidator = getEffectValidator(effect.type);
    if (effectValidator) {
      const effectErrors = effectValidator.validate(effect.params);
      errors.push(...effectErrors);
    }
  }
  
  // Color validation
  for (const color of skin.colors.ANSI) {
    if (!isValidColor(color)) {
      errors.push({
        field: `colors.ANSI[${skin.colors.ANSI.indexOf(color)}]`,
        message: `Invalid color: ${color}`
      });
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## Performance Considerations

### GPU Acceleration

```typescript
/**
 * WebGL shader for CRT scanlines
 */
const scanlineFragmentShader = `
precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_intensity;

varying vec2 v_texCoord;

void main() {
  vec4 color = texture2D(u_texture, v_texCoord);
  
  // Scanline pattern
  float scanline = sin(v_texCoord.y * u_resolution.y * 0.5) * 0.5 + 0.5;
  scanline = pow(scanline, 2.0) * u_intensity;
  
  // Apply scanline darkening
  color.rgb *= 1.0 - (scanline * 0.3);
  
  gl_FragColor = color;
}
`;
```

### Optimization Strategies

1. **Effect Chaining** — Apply multiple passes efficiently
2. **LOD System** — Lower quality for slow terminals
3. **Caching** — Cache expensive calculations
4. **Web Workers** — Offload processing to background threads

---

## File Structure

```
retro-skins-platform/
├── src/
│   ├── engine/
│   │   ├── renderer.ts
│   │   ├── compositor.ts
│   │   └── shader.ts
│   ├── effects/
│   │   ├── crt/
│   │   ├── lcd/
│   │   ├── monochrome/
│   │   └── glow/
│   ├── adapters/
│   │   ├── wezterm/
│   │   ├── alacritty/
│   │   ├── kitty/
│   │   └── iterm2/
│   ├── skin/
│   │   ├── parser.ts
│   │   ├── validator.ts
│   │   └── presets.ts
│   └── cli/
│       └── index.ts
├── skins/
│   ├── retro-crt-classic/
│   │   ├── skin.json
│   │   ├── preview.png
│   │   └── wezterm.lua
│   ├── retro-lcd-flat/
│   └── retro-amber-phosphor/
├── tests/
│   ├── engine.test.ts
│   └── adapters.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## Next Steps

1. **Prototype** — Build core renderer with CRT/LCD effects
2. **WezTerm Integration** — Create first terminal adapter
3. **Skin Validation** — Implement schema validation
4. **CLI Tool** — Build skin management command-line tool
5. **Marketplace** — Design web interface for skin browsing

---

*Document version: 1.0*
*Last updated: 2026-01-29*
