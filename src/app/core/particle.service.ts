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
  private nextId = 0;
  private animationFrame: number | null = null;
  private lastTime = 0;
  
  private activeWindowBounds: DOMRect | null = null;
  private particleColor = '#ff1493';
  private containerBounds: DOMRect | null = null;
  private currentZoom = 1;
  private containerElement: HTMLElement | null = null;
  private activeElement: HTMLElement | null = null;
  
  startEmitting(element: HTMLElement, color: string, container: HTMLElement): void {
    this.particleColor = color;
    this.activeElement = element;
    this.containerElement = container;
    
    // Always update bounds immediately
    this.containerBounds = container.getBoundingClientRect();
    this.activeWindowBounds = element.getBoundingClientRect();
    
    // Start animation loop if not already running
    if (!this.animationFrame) {
      this.lastTime = performance.now();
      this.animate();
    }
  }
  
  updateZoom(zoom: number): void {
    this.currentZoom = zoom;
  }
  
  stopEmitting(): void {
    this.activeElement = null;
    this.activeWindowBounds = null;
    // Keep containerElement - it's desk-level and doesn't change
  }
  
  private animate = (): void => {
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // seconds
    this.lastTime = currentTime;
    
    // Update bounds from active element (tracks movement and zoom changes)
    if (this.activeElement && this.containerElement) {
      this.containerBounds = this.containerElement.getBoundingClientRect();
      this.activeWindowBounds = this.activeElement.getBoundingClientRect();
    }
    
    // Spawn new particles if we have an active window
    if (this.activeWindowBounds && this.containerBounds && Math.random() < 0.3) {
      this.spawnParticle(this.activeWindowBounds, this.containerBounds, this.currentZoom);
    }
    
    // Update existing particles
    this.updateParticles(deltaTime);
    
    // Continue animation
    this.animationFrame = requestAnimationFrame(this.animate);
  };
  
  private spawnParticle(bounds: DOMRect, containerBounds: DOMRect, zoom: number): void {
    // Convert screen coordinates to desk-surface coordinates
    // Account for container offset and zoom
    const offsetX = containerBounds.left;
    const offsetY = containerBounds.top;
    
    // Spawn only from the top edge
    const x = (bounds.left - offsetX + Math.random() * bounds.width) / zoom;
    const y = (bounds.top - offsetY - 10) / zoom;
    const vx = (Math.random() - 0.5) * 30 / zoom;
    const vy = (-20 - Math.random() * 20) / zoom;
    
    const particle: Particle = {
      id: this.nextId++,
      x,
      y,
      vx,
      vy,
      life: 0,
      maxLife: 1.5 + Math.random() * 1.5, // 1.5-3 seconds
      color: this.particleColor
    };
    
    this.particles.update(particles => [...particles, particle]);
  }
  
  private updateParticles(deltaTime: number): void {
    this.particles.update(particles => {
      return particles
        .map(p => ({
          ...p,
          x: p.x + p.vx * deltaTime,
          y: p.y + p.vy * deltaTime,
          life: p.life + deltaTime
        }))
        .filter(p => p.life < p.maxLife); // Remove dead particles
    });
  }
  
  destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.particles.set([]);
  }
}
