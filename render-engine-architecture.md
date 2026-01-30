# Retro Skins Platform — Render Engine Architecture

**Version:** 1.0
**Status:** Draft — For Peter Review
**Created:** 2026-01-29

---

## Executive Summary

Extractable render engine for cross-terminal retro visual effects (CRT, LCD, monochrome, etc.). Targets WezTerm, Alacritty, and Kitty users who want visual customization beyond color schemes.

---

## Architecture Principles

1. **Terminal-Agnostic Core** — Render logic doesn't know about terminals
2. **Extractable** — Can be used standalone or embedded
3. **Plugin System** — Skins are plugins, not hardcoded
4. **Performance-First** — GPU acceleration, configurable quality tiers

---

## Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SKIN LAYER (Plugins)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │  CRT     │ │  LCD     │ │Monochrome│ │  Cyber   │        │
│  │  Skin    │ │  Skin    │ │  Skin    │ │  Skin    │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
├─────────────────────────────────────────────────────────────┤
│                  RENDER ENGINE CORE                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  EffectComposer → EffectPipeline → RenderTarget     │    │
│  │  • Scanline pass    • Bloom pass    • Output        │    │
│  │  • Glow pass        • Chromatic ab. • Tone mapping  │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                 TERMINAL ADAPTERS                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                     │
│  │ WezTerm  │ │Alacritty │ │  Kitty   │                     │
│  │  (Lua)   │ │ (Config) │ │ (Sixel)  │                     │
│  └──────────┘ └──────────┘ └──────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### VisualEffect

```typescript
interface VisualEffect {
  readonly type: 'crt' | 'lcd' | 'monochrome' | 'glow' | 'scanlines' | 'chromatic';
  readonly intensity: number; // 0.0 - 1.0
  readonly params: Record<string, number>;
  
  // Render pass interface
  render(input: RenderTarget): RenderTarget;
}
```

### SkinConfig

```typescript
interface SkinConfig {
  readonly name: string;
  readonly author: string;
  readonly version: string;
  readonly effects: VisualEffect[];
  readonly colors: ColorScheme;
  readonly compatibility: Terminal[];
}

interface ColorScheme {
  readonly background: string;    // #000000
  readonly foreground: string;    // #00ff00
  readonly accent: string;        // #00ff00
  readonly glowColor?: string;    // #00ff00 (optional override)
}
```

### RenderTarget

```typescript
interface RenderTarget {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8ClampedArray;
  readonly terminalGrid: TerminalGrid; // char data
  
  clone(): RenderTarget;
}
```

---

## Effect Pipeline

### Built-in Effects

| Effect | Parameters | Performance Cost |
|--------|------------|------------------|
| **Scanlines** | lineWidth, intensity, scanSpeed | Low |
| **Phosphor Glow** | radius, intensity, decay | Medium |
| **Chromatic Aberration** | offset, iterations | Medium |
| **Vignette** | radius, softness | Low |
| **Screen Curvature** | curvature, barrelDistortion | High |
| **RGB Shift** | amount, angle | Low |
| **Bloom** | threshold, radius, intensity | High |
| **LCD Grid** | subpixelOrder, brightnessDrop | Low |

### Effect Composition

```typescript
// Example: CRT effect composed of multiple passes
const crtSkin: SkinConfig = {
  name: 'Classic CRT',
  effects: [
    curvature({ curvature: 0.5, barrelDistortion: 0.2 }),
    scanlines({ lineWidth: 2, intensity: 0.3 }),
    phosphorGlow({ radius: 1.5, intensity: 0.4 }),
    vignette({ radius: 0.8, softness: 0.3 }),
    chromaticAberration({ offset: 1.5, iterations: 2 }),
  ],
  colors: {
    background: '#0a0a0a',
    foreground: '#33ff33',
    accent: '#33ff33',
  },
};
```

---

## Terminal Integration

### WezTerm (Primary Target)

**Integration:** Lua script injection via WezTerm config

```lua
-- In ~/.wezterm.lua
local retro_skins = require('retro-skins')

wezterm.on('update-status', function(window, pane)
  window:leader({ mods = 'CTRL|SHIFT' })
end)

-- Apply CRT skin
retro_skins.apply_skin('crt-classic')
```

**Technical approach:**
- WezTerm supports custom render callbacks via `cell_veto` and `render`
- Can overlay effects on top of rendered terminal cells
- GPU-accelerated via WebGPU/Canvas

### Alacritty

**Integration:** Config overlay + external rendering

```yaml
# ~/.config/alacritty/alacritty.toml
[terminal]
shell.program = /usr/bin/zsh
shell.args = ["-l", "-c", "retro-skins run --skin crt-classic"]

[colors]
primary.background = "#0a0a0a"
primary.foreground = "#33ff33"
```

**Technical approach:**
- Alacritty doesn't support custom render callbacks
- Alternative: Overlay window (transparent, always-on-top)
- Or: Post-processing filter (experimental)

### Kitty

**Integration:** Sixel graphics + CSI sequences

```bash
# Apply skin via escape sequence
echo -e "\e]50;retro-skins=skin=crt-classic\a"
```

**Technical approach:**
- Kitty supports Sixel for images
- Can render effects to Sixel buffer, display as overlay
- Limited by Sixel capabilities

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Frame latency | < 16ms (60fps) | Main thread |
| Memory overhead | < 50MB | Standalone mode |
| GPU usage | < 20% typical | Configurable quality |
| Terminal latency | < 5ms added | Per keystroke |

### Quality Tiers

```typescript
type QualityTier = 'low' | 'medium' | 'high' | 'ultra';

const qualityPresets: Record<QualityTier, EffectQuality[]> = {
  low: [
    scanlines: { skipLines: 2 },
    vignette: { softness: 1.0 },
  ],
  medium: [
    scanlines: { skipLines: 1 },
    phosphorGlow: { radius: 0.5, iterations: 1 },
    vignette: { softness: 0.5 },
  ],
  high: [
    scanlines: { skipLines: 0 },
    phosphorGlow: { radius: 1.0, iterations: 2 },
    chromaticAberration: { offset: 1.0 },
    vignette: { softness: 0.3 },
  ],
  ultra: [
    // All effects at max quality
    phosphorGlow: { radius: 2.0, iterations: 4 },
    bloom: { threshold: 0.8, radius: 2.0 },
  ],
};
```

---

## Plugin System

### Skin Manifest

```json
{
  "name": "cyberpunk-2077",
  "version": "1.0.0",
  "author": "Artist Name",
  "description": "Neon glitch aesthetic with pink/blue color scheme",
  "preview": "preview.png",
  
  "compatibility": {
    "wezterm": ">=2023.03.17",
    "alacritty": ">=0.13.0",
    "kitty": ">=0.28.0"
  },
  
  "config": {
    "colors": {
      "background": "#0d0221",
      "foreground": "#00f0ff",
      "accent": "#ff0055"
    },
    "effects": ["glitch", "neon-glow", "scanlines"],
    "params": {
      "glitch-intensity": 0.5,
      "scanline-opacity": 0.15
    }
  },
  
  "monetization": {
    "type": "paid",
    "price": 9.99,
    "platform": "gumroad"
  }
}
```

### Plugin API

```typescript
interface RetroSkinsPlugin {
  readonly manifest: SkinManifest;
  
  // Initialize skin with config
  init(config: SkinConfig): void;
  
  // Render frame
  render(target: RenderTarget): RenderTarget;
  
  // Cleanup
  dispose(): void;
}

// Plugin registration
export default {
  name: 'my-skin',
  version: '1.0.0',
  
  create(config: SkinConfig): VisualEffect[] {
    return [
      scanlines({ ... }),
      phosphorGlow({ ... }),
    ];
  },
} satisfies RetroSkinsPlugin;
```

---

## Directory Structure

```
retro-skins-platform/
├── engine/
│   ├── src/
│   │   ├── core/
│   │   │   ├── RenderEngine.ts
│   │   │   ├── EffectComposer.ts
│   │   │   └── RenderTarget.ts
│   │   ├── effects/
│   │   │   ├── ScanlineEffect.ts
│   │   │   ├── PhosphorGlowEffect.ts
│   │   │   ├── ChromaticAberrationEffect.ts
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── ColorUtils.ts
│   │   │   └── Shaders.ts
│   │   └── index.ts
│   └── package.json
│
├── adapters/
│   ├── wezterm/
│   │   ├── retro-skins.lua
│   │   └── README.md
│   ├── alacritty/
│   │   ├── retro-skins.toml
│   │   └── overlay/
│   └── kitty/
│       ├── retro-skins.sh
│       └── sixel-renderer/
│
├── skins/
│   ├── core/
│   │   ├── crt-classic/
│   │   ├── lcd-flat/
│   │   └── monochrome-amber/
│   ├── premium/
│   │   ├── cyberpunk-2077/
│   │   ├── star-wars-terminal/
│   │   └── fallout-pipboy/
│   └── community/
│       └── (user contributions)
│
├── cli/
│   ├── src/
│   │   ├── commands/
│   │   │   ├── apply.ts
│   │   │   ├── preview.ts
│   │   │   └── install.ts
│   │   └── index.ts
│   └── package.json
│
├── marketplace/
│   ├── api/
│   ├── web/
│   └── package.json
│
└── README.md
```

---

## Dependencies

### Engine Core

| Package | Version | Purpose |
|---------|---------|---------|
| typescript | ^5.4 | TypeScript 5.x |
| vitest | ^1.4 | Testing |
| gl-matrix | ^3.4 | 2D/3D math (GPU shaders) |
| @webgpu/core | ^0.1 | GPU acceleration (future) |

### Adapters

| Target | Technology |
|--------|------------|
| WezTerm | Lua 5.4 |
| Alacritty | Rust (embedded) + Overlay window |
| Kitty | Sixel + Shell escape sequences |

---

## MVP Scope (Month 1)

### Must Have

- [ ] Core render engine with 3 effects (scanlines, glow, vignette)
- [ ] WezTerm Lua adapter
- [ ] 3 core skins (CRT, LCD, Monochrome)
- [ ] CLI for skin application
- [ ] Quality tier selector

### Nice to Have

- [ ] Alacritty adapter
- [ ] 5 premium skins
- [ ] Skin preview tool
- [ ] Performance profiling

### Out of Scope (MVP)

- [ ] Marketplace (Phase 3)
- [ ] Artist commission program (Phase 3)
- [ ] GPU acceleration (future)
- [ ] Custom shader support (Phase 2)

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| WezTerm API changes | Pin to specific version, abstraction layer |
| Performance overhead | Quality tiers, GPU acceleration option |
| Cross-platform issues | CI testing on macOS/Linux/WSL |
| Low artist adoption | Commission initial skins, revenue share |

---

## Success Metrics

| Metric | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|----------|
| Weekly downloads | 100 | 1,000 | 5,000 |
| GitHub stars | 100 | 500 | 2,000 |
| Community skins | 3 | 10 | 25 |
| Terminal adapters | 1 | 3 | 3 |
| Artist partnerships | 0 | 2 | 10 |
| Revenue/month | $0 | $500 | $2,000 |

---

## Next Steps

1. **Peter reviews** this architecture document
2. **Prototype WezTerm adapter** (Lua script MVP)
3. **Build core render engine** (TypeScript)
4. **Commission 2-3 initial skins** (Twitter artist outreach)
5. **Alpha release** to early adopters

---

**Document Status:** ✅ Ready for Peter Review
**Last Updated:** 2026-01-29 3:30 PM
