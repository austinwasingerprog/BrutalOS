import { Component, signal, computed, inject, ElementRef, effect } from '@angular/core';
import { NotepadComponent } from '../notepad/notepad.component';
import { TodoComponent } from '../todo/todo.component';
import { CalculatorComponent } from '../calculator/calculator.component';
import { SettingsComponent } from '../settings/settings.component';
import { ParticleOverlayComponent } from '../particle-overlay/particle-overlay.component';
import { PanService } from '../../core/pan.service';
import { DeskStateService } from '../../core/desk-state.service';

@Component({
  selector: 'app-desk',
  imports: [NotepadComponent, TodoComponent, CalculatorComponent, SettingsComponent, ParticleOverlayComponent],
  templateUrl: './desk.component.html',
  styleUrl: './desk.component.css'
})
export class DeskComponent {
  private panService = inject(PanService);
  private deskStateService = inject(DeskStateService);
  private elementRef = inject(ElementRef);
  
  protected deskX = signal(0);
  protected deskY = signal(0);
  protected zoom = signal(1);
  protected cursorStyle = computed(() => this.panService.getCursorStyle());
  
  constructor() {
    // Sync zoom with desk state service
    effect(() => {
      this.deskStateService.setZoom(this.zoom());
    });
    
    // Set desk surface element reference after view init
    setTimeout(() => {
      const deskSurface = this.elementRef.nativeElement.querySelector('.desk-surface');
      if (deskSurface) {
        this.deskStateService.setDeskSurface(deskSurface);
      }
    });
  }
  
  private maxPan = 600;
  private readonly minZoom = 0.5;
  private readonly maxZoom = 2.0;
  private readonly zoomStep = 0.1;
  private isMiddleMousePan = false;
  
  // Touch state for pinch-to-zoom
  private touchStartZoom = 1;
  private initialPinchDistance = 0;
  
  onMouseDown(event: MouseEvent): void {
    // Middle mouse button (button 1) or pan mode with left click
    if (event.button === 1) {
      event.preventDefault();
      this.isMiddleMousePan = true;
      this.panService.startPan(event.clientX, event.clientY, true);
    } else if (event.button === 0 && this.panService.panModeActive()) {
      event.preventDefault();
      this.isMiddleMousePan = false;
      this.panService.startPan(event.clientX, event.clientY, false);
    }
  }
  
  onMouseMove(event: MouseEvent): void {
    this.panService.updatePan(event.clientX, event.clientY, (deltaX, deltaY) => {
      const newX = this.deskX() + deltaX;
      const newY = this.deskY() + deltaY;
      
      // Apply limits
      this.deskX.set(Math.max(-this.maxPan, Math.min(this.maxPan, newX)));
      this.deskY.set(Math.max(-this.maxPan, Math.min(this.maxPan, newY)));
    });
  }
  
  onMouseUp(event: MouseEvent): void {
    if (event.button === 1 || event.button === 0) {
      this.panService.endPan(this.isMiddleMousePan);
      this.isMiddleMousePan = false;
    }
  }
  
  onMouseLeave(): void {
    this.panService.endPan(this.isMiddleMousePan);
    this.isMiddleMousePan = false;
  }
  
  onTouchStart(event: TouchEvent): void {
    // Handle two-finger touch for both panning and zooming
    if (event.touches.length === 2) {
      event.preventDefault();
      
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      
      // Calculate initial distance for pinch detection
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      this.initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
      
      this.touchStartZoom = this.zoom();
      
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      this.panService.startPan(centerX, centerY, false);
    }
  }
  
  onTouchMove(event: TouchEvent): void {
    // Handle two-finger touch for both panning and zooming
    if (event.touches.length === 2 && this.initialPinchDistance > 0) {
      event.preventDefault();
      
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      // Calculate current distance for pinch/zoom detection
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate zoom factor based on pinch distance change
      const scale = currentDistance / this.initialPinchDistance;
      const newZoom = this.touchStartZoom * scale;
      
      // Apply zoom (clamped between min and max)
      this.zoom.set(Math.max(this.minZoom, Math.min(this.maxZoom, newZoom)));
      
      // Also handle panning at the same time
      this.panService.updatePan(centerX, centerY, (deltaX, deltaY) => {
        const newX = this.deskX() + deltaX;
        const newY = this.deskY() + deltaY;
        
        // Apply limits
        this.deskX.set(Math.max(-this.maxPan, Math.min(this.maxPan, newX)));
        this.deskY.set(Math.max(-this.maxPan, Math.min(this.maxPan, newY)));
      });
    }
  }
  
  onTouchEnd(event: TouchEvent): void {
    // End panning and reset zoom tracking when fingers are lifted
    if (event.touches.length < 2) {
      this.panService.endPan(false);
      this.initialPinchDistance = 0;
    }
  }
  
  onWheel(event: WheelEvent): void {
    event.preventDefault();
    
    // deltaY < 0 = scroll up = zoom in
    // deltaY > 0 = scroll down = zoom out
    const delta = event.deltaY > 0 ? -this.zoomStep : this.zoomStep;
    const newZoom = this.zoom() + delta;
    
    // Clamp zoom between min and max
    this.zoom.set(Math.max(this.minZoom, Math.min(this.maxZoom, newZoom)));
  }
}