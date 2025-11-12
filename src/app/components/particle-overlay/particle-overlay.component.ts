import { Component, inject } from '@angular/core';
import { ParticleService } from '../../core/particle.service';

@Component({
  selector: 'app-particle-overlay',
  imports: [],
  template: `
    <div class="particle-overlay">
      @for (particle of particles(); track particle.id) {
        <div 
          class="particle"
          [style.left.px]="particle.x"
          [style.top.px]="particle.y"
          [style.background]="particle.color"
          [style.box-shadow]="'0 0 4px ' + particle.color"
          [style.opacity]="1 - (particle.life / particle.maxLife)"
        ></div>
      }
    </div>
  `,
  styles: [`
    .particle-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 10;
      overflow: visible;
    }
    
    .particle {
      position: absolute;
      width: 8px;
      height: 8px;
      transform: translate(-50%, -50%);
      will-change: transform, opacity;
    }
  `]
})
export class ParticleOverlayComponent {
  private particleService = inject(ParticleService);
  
  protected particles = this.particleService.particles;
}
