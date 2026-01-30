/**
 * Retro Skins Render Engine
 *
 * Browser-based render engine for applying visual effects to terminal content.
 * Uses CSS and canvas for real-time animation and effects.
 *
 * NOTE: This module is designed for browser environments (preview tools, web UIs).
 * For Node.js CLI usage, use the terminal adapters directly.
 */

import type { SkinConfig, VisualEffect, EffectType, RenderContext } from './skins.js';
export { PRESET_SKINS } from './skins.js';

export class RetroRenderEngine {
  private context: RenderContext | null = null;
  private effects: Map<EffectType, VisualEffect> = new Map();
  private shakeOffset = { x: 0, y: 0 };
  private animationFrame = 0;
  private lastTime = 0;
  
  /** Initialize the render engine for an element */
  initialize(element: HTMLElement, config: SkinConfig): RenderContext {
    this.context = {
      element,
      config,
      animationId: null,
      lastRender: 0,
    };
    
    // Parse effects from config
    this.effects.clear();
    config.effects.forEach(effect => {
      this.effects.set(effect.type, effect);
    });
    
    // Apply CSS base styles
    this.applyBaseStyles(element, config);
    
    // Start animation loop
    this.startAnimation();
    
    return this.context;
  }
  
  /** Apply base CSS styles for the skin */
  private applyBaseStyles(element: HTMLElement, config: SkinConfig): void {
    const styles = element.style;
    
    // Colors
    styles.setProperty('--retro-bg', config.colors.background);
    styles.setProperty('--retro-fg', config.colors.foreground);
    styles.setProperty('--retro-accent', config.colors.accent);
    styles.setProperty('--retro-glow', config.colors.glow);
    
    // Base appearance
    styles.backgroundColor = config.colors.background;
    styles.color = config.colors.foreground;
    
    // Text shadow for glow effect
    const glowIntensity = this.effects.get('phosphor-glow')?.intensity || 0;
    if (glowIntensity > 0) {
      styles.textShadow = `0 0 ${glowIntensity * 4}px ${config.colors.glow}`;
    }
  }
  
  /** Start the animation loop */
  private startAnimation(): void {
    const animate = (timestamp: number) => {
      const config = this.context?.config;
      if (!config) return;
      
      // Throttle to target FPS
      const targetFps = config.performance.targetFps;
      const frameInterval = 1000 / targetFps;
      
      if (timestamp - this.lastTime < frameInterval) {
        this.animationFrame = requestAnimationFrame(animate);
        return;
      }
      
      this.lastTime = timestamp;
      
      // Apply animated effects
      this.applyAnimatedEffects(timestamp);
      
      this.context!.animationId = requestAnimationFrame(animate);
    };
    
    this.animationFrame = requestAnimationFrame(animate);
  }
  
  /** Apply effects that change over time */
  private applyAnimatedEffects(timestamp: number): void {
    const element = this.context?.element;
    if (!element) return;
    
    const shake = this.effects.get('shake');
    const flicker = this.effects.get('crt-flicker');
    const animatedBg = this.effects.get('animated-bg');
    const noise = this.effects.get('noise');
    
    // Apply shake effect
    if (shake && shake.intensity > 0) {
      const shakeIntensity = shake.intensity * 3;
      const shakeX = (Math.random() - 0.5) * shakeIntensity;
      const shakeY = (Math.random() - 0.5) * shakeIntensity;
      this.shakeOffset = { x: shakeX, y: shakeY };
      element.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
    }
    
    // Apply CRT flicker
    if (flicker && flicker.intensity > 0) {
      const flickerAmount = Math.sin(timestamp * 0.01 * (flicker.params?.frequency || 1)) * flicker.intensity * 0.1;
      element.style.filter = `brightness(${1 + flickerAmount})`;
    }
    
    // Apply animated background
    if (animatedBg && animatedBg.intensity > 0) {
      const speed = animatedBg.params?.speed || 0.5;
      const gradientShift = (timestamp * 0.001 * speed) % 1;
      // Background animation would go here
    }
    
    // Apply noise
    if (noise && noise.intensity > 0) {
      // CSS noise effect via pseudo-element
      this.applyNoiseEffect(element, noise.intensity);
    }
  }
  
  /** Apply CRT scanline effect */
  applyScanlines(element: HTMLElement, intensity: number): void {
    const scanlineStyle = `
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, ${intensity * 0.3}) 2px,
        rgba(0, 0, 0, ${intensity * 0.3}) 4px
      );
    `;
    element.style.setProperty('--scanlines', scanlineStyle);
  }
  
  /** Apply vignette effect */
  applyVignette(element: HTMLElement, intensity: number): void {
    const vignette = `
      radial-gradient(
        ellipse at center,
        transparent 0%,
        transparent ${(1 - intensity) * 80}%,
        rgba(0, 0, 0, ${intensity * 0.8}) 100%
      )
    `;
    element.style.setProperty('--vignette', `mask-image: ${vignette}`);
    element.style.webkitMaskImage = vignette as any;
    element.style.maskImage = vignette as any;
  }
  
  /** Apply noise effect via pseudo-element */
  private applyNoiseEffect(element: HTMLElement, intensity: number): void {
    // Create noise pattern using SVG filter (valid CSS)
    const noiseValue = Math.random() * intensity * 0.1;
    element.style.filter = `url('#retro-noise-filter')`;
    
    // Add noise via data URI if needed
    if (intensity > 0.05) {
      const noiseDataUrl = this.generateNoiseDataUrl(intensity);
      if (!element.querySelector('.retro-noise')) {
        const noiseDiv = document.createElement('div');
        noiseDiv.className = 'retro-noise';
        noiseDiv.style.cssText = `
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: ${intensity * 0.1};
          background: url(${noiseDataUrl});
          mix-blend-mode: overlay;
        `;
        element.appendChild(noiseDiv);
      }
    }
  }
  
  /** Generate noise pattern data URL */
  private generateNoiseDataUrl(intensity: number): string {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';
    
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() * 255 * intensity;
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = 255;
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  }
  
  /** Apply curvature effect (CRT bend) */
  applyCurvature(element: HTMLElement, intensity: number): void {
    const curvature = `radial-gradient(
      circle at 50% 50%,
      transparent 50%,
      rgba(0, 0, 0, ${intensity * 0.5}) 100%
    )`;
    element.style.setProperty('--curvature', `box-shadow: inset 0 0 ${intensity * 100}px rgba(0,0,0,${intensity * 0.5})`);
    
    // Apply border radius for curved corners
    const radius = intensity * 20;
    element.style.borderRadius = `${radius}px`;
    element.style.boxShadow = `inset 0 0 ${radius}px rgba(0,0,0,${intensity * 0.3})`;
  }
  
  /** Update skin configuration at runtime */
  updateConfig(config: SkinConfig): void {
    if (!this.context) return;
    
    this.context.config = config;
    this.effects.clear();
    config.effects.forEach(effect => {
      this.effects.set(effect.type, effect);
    });
    
    this.applyBaseStyles(this.context.element, config);
  }
  
  /** Get current configuration */
  getConfig(): SkinConfig | null {
    return this.context?.config || null;
  }
  
  /** Pause animations */
  pause(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }
  }
  
  /** Resume animations */
  resume(): void {
    if (!this.animationFrame && this.context) {
      this.startAnimation();
    }
  }
  
  /** Destroy the engine and cleanup */
  destroy(): void {
    this.pause();
    
    // Cleanup noise elements
    const noiseEl = this.context?.element.querySelector('.retro-noise');
    noiseEl?.remove();
    
    // Reset styles
    if (this.context) {
      const element = this.context.element;
      element.style.transform = '';
      element.style.filter = '';
      element.style.textShadow = '';
      element.style.backgroundColor = '';
      element.style.color = '';
    }
    
    this.context = null;
    this.effects.clear();
  }
}

/**
 * Create a new render engine instance
 */
export function createRenderEngine(): RetroRenderEngine {
  return new RetroRenderEngine();
}
