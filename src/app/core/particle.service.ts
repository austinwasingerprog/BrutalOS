import { Injectable, signal, effect } from '@angular/core';

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
  
  startEmitting(element: HTMLElement, color: string): void {
    this.particleColor = color;
    this.activeWindowBounds = element.getBoundingClientRect();
    
    if (!this.animationFrame) {
      this.lastTime = performance.now();
      this.animate();
    }
  }
  
  stopEmitting(): void {
    this.activeWindowBounds = null;
  }
  
  private animate = (): void => {
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // seconds
    this.lastTime = currentTime;
    
    // Spawn new particles if we have an active window
    if (this.activeWindowBounds && Math.random() < 0.3) {
      this.spawnParticle(this.activeWindowBounds);
    }
    
    // Update existing particles
    this.updateParticles(deltaTime);
    
    // Continue animation
    this.animationFrame = requestAnimationFrame(this.animate);
  };
  
  private spawnParticle(bounds: DOMRect): void {
    const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let x = 0;
    let y = 0;
    let vx = 0;
    let vy = 0;
    
    switch (side) {
      case 0: // top
        x = bounds.left + Math.random() * bounds.width;
        y = bounds.top - 10;
        vx = (Math.random() - 0.5) * 30;
        vy = -20 - Math.random() * 20;
        break;
      case 1: // right
        x = bounds.right + 10;
        y = bounds.top + Math.random() * bounds.height;
        vx = 20 + Math.random() * 20;
        vy = (Math.random() - 0.5) * 30;
        break;
      case 2: // bottom
        x = bounds.left + Math.random() * bounds.width;
        y = bounds.bottom + 10;
        vx = (Math.random() - 0.5) * 30;
        vy = 20 + Math.random() * 20;
        break;
      case 3: // left
        x = bounds.left - 10;
        y = bounds.top + Math.random() * bounds.height;
        vx = -20 - Math.random() * 20;
        vy = (Math.random() - 0.5) * 30;
        break;
    }
    
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
