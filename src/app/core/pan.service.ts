import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PanService {
  isPanning = signal(false);
  panModeActive = signal(false);
  
  private lastX = 0;
  private lastY = 0;
  
  startPan(clientX: number, clientY: number, isMiddleClick: boolean = false): void {
    this.isPanning.set(true);
    this.lastX = clientX;
    this.lastY = clientY;
    
    // Temporarily activate pan mode for middle click
    if (isMiddleClick) {
      this.panModeActive.set(true);
    }
  }
  
  updatePan(clientX: number, clientY: number, onDelta: (deltaX: number, deltaY: number) => void): void {
    if (this.isPanning()) {
      const deltaX = clientX - this.lastX;
      const deltaY = clientY - this.lastY;
      
      onDelta(deltaX, deltaY);
      
      this.lastX = clientX;
      this.lastY = clientY;
    }
  }
  
  endPan(wasMiddleClick: boolean = false): void {
    this.isPanning.set(false);
    
    // Deactivate pan mode if it was a middle click
    if (wasMiddleClick) {
      this.panModeActive.set(false);
    }
  }
  
  togglePanMode(): void {
    this.panModeActive.update(active => !active);
  }
  
  getCursorStyle(): string {
    if (this.panModeActive() || this.isPanning()) {
      return this.isPanning() ? 'grabbing' : 'grab';
    }
    return 'default';
  }
}
