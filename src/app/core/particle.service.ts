import { Injectable, signal } from '@angular/core';

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

@Injectable({
  providedIn: 'root'
})
export class ParticleService {
  particles = signal<Particle[]>([]);
  
  private nextParticleId = 0;
  private animationFrameId: number | null = null;
  private lastAnimationTime = 0;
  
  private activeWindowId: string | null = null;
  private activeWindowElement: HTMLElement | null = null;
  private containerElement: HTMLElement | null = null;
  private windowBounds: DOMRect | null = null;
  private containerBounds: DOMRect | null = null;
  
  private currentColor = '#ff1493';
  private currentZoom = 1;
  
  startEmitting(windowId: string, windowElement: HTMLElement, color: string, containerElement: HTMLElement): void {
    this.activeWindowId = windowId;
    this.activeWindowElement = windowElement;
    this.containerElement = containerElement;
    this.currentColor = color;
    this.captureBoundingBoxes();
    
    this.ensureAnimationIsRunning();
  }
  
  private captureBoundingBoxes(): void {
    if (this.activeWindowElement && this.containerElement) {
      this.windowBounds = this.activeWindowElement.getBoundingClientRect();
      this.containerBounds = this.containerElement.getBoundingClientRect();
    }
  }
  
  stopEmitting(windowId: string): void {
    if (this.activeWindowId === windowId) {
      this.activeWindowId = null;
      this.activeWindowElement = null;
      this.windowBounds = null;
      this.containerBounds = null;
    }
  }
  
  updateWindowPosition(windowId: string, windowElement: HTMLElement, containerElement: HTMLElement): void {
    if (this.activeWindowId === windowId) {
      this.activeWindowElement = windowElement;
      this.containerElement = containerElement;
      this.captureBoundingBoxes();
    }
  }
  
  private ensureAnimationIsRunning(): void {
    if (!this.animationFrameId) {
      this.lastAnimationTime = performance.now();
      this.runAnimationLoop();
    }
  }
  
  updateZoom(zoom: number): void {
    this.currentZoom = zoom;
  }
  
  private runAnimationLoop = (): void => {
    const currentTime = performance.now();
    const deltaTimeInSeconds = (currentTime - this.lastAnimationTime) / 1000;
    this.lastAnimationTime = currentTime;
    
    this.maybeSpawnParticle();
    this.updateExistingParticles(deltaTimeInSeconds);
    
    if (this.shouldStopAnimation()) {
      this.stopAnimation();
    } else {
      this.scheduleNextFrame();
    }
  };
  
  private shouldStopAnimation(): boolean {
    return !this.activeWindowElement && this.particles().length === 0;
  }
  
  private stopAnimation(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  private maybeSpawnParticle(): void {
    if (!this.canSpawnParticles()) return;
    if (Math.random() >= 0.3) return;
    
    this.createParticle(this.windowBounds!, this.containerBounds!, this.currentZoom);
  }
  
  private canSpawnParticles(): boolean {
    return this.windowBounds !== null && this.containerBounds !== null;
  }
  
  private scheduleNextFrame(): void {
    this.animationFrameId = requestAnimationFrame(this.runAnimationLoop);
  }
  
  private createParticle(windowBounds: DOMRect, containerBounds: DOMRect, zoom: number): void {
    const position = this.calculateParticlePosition(windowBounds, containerBounds, zoom);
    const velocity = this.calculateParticleVelocity(zoom);
    const lifespan = this.calculateParticleLifespan();
    
    const particle: Particle = {
      id: this.nextParticleId++,
      ...position,
      ...velocity,
      life: 0,
      maxLife: lifespan,
      color: this.currentColor
    };
    
    this.particles.update(existing => [...existing, particle]);
  }
  
  private calculateParticlePosition(windowBounds: DOMRect, containerBounds: DOMRect, zoom: number) {
    const offsetX = containerBounds.left;
    const offsetY = containerBounds.top;
    
    const randomXOffset = Math.random() * windowBounds.width;
    const topEdgeOffset = 10;
    
    return {
      x: (windowBounds.left - offsetX + randomXOffset) / zoom,
      y: (windowBounds.top - offsetY - topEdgeOffset) / zoom
    };
  }
  
  private calculateParticleVelocity(zoom: number) {
    const horizontalSpeed = (Math.random() - 0.5) * 30 / zoom;
    const verticalSpeed = (-20 - Math.random() * 20) / zoom;
    
    return {
      vx: horizontalSpeed,
      vy: verticalSpeed
    };
  }
  
  private calculateParticleLifespan(): number {
    const minLifespan = 1.5;
    const maxAdditionalLifespan = 1.5;
    return minLifespan + Math.random() * maxAdditionalLifespan;
  }
  
  private updateExistingParticles(deltaTime: number): void {
    this.particles.update(particles => 
      particles
        .map(particle => this.advanceParticle(particle, deltaTime))
        .filter(particle => this.isParticleAlive(particle))
    );
  }
  
  private advanceParticle(particle: Particle, deltaTime: number): Particle {
    return {
      ...particle,
      x: particle.x + particle.vx * deltaTime,
      y: particle.y + particle.vy * deltaTime,
      life: particle.life + deltaTime
    };
  }
  
  private isParticleAlive(particle: Particle): boolean {
    return particle.life < particle.maxLife;
  }
  
  destroy(): void {
    this.stopAnimation();
    this.particles.set([]);
  }
}
