import { Component, signal, computed, inject, ElementRef, effect, viewChild } from '@angular/core';
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
  
  // View query for the desk surface element
  private deskSurface = viewChild<ElementRef<HTMLElement>>('deskSurface');
  
  protected deskX = signal(0);
  protected deskY = signal(0);
  protected zoom = signal(1);
  protected cursorStyle = computed(() => this.panService.getCursorStyle());
  
  constructor() {
    this.syncZoomWithGlobalState();
    this.registerDeskSurfaceWithGlobalState();
  }
  
  private syncZoomWithGlobalState(): void {
    effect(() => {
      this.deskStateService.setZoom(this.zoom());
    });
  }
  
  private registerDeskSurfaceWithGlobalState(): void {
    effect(() => {
      const deskSurfaceElement = this.deskSurface()?.nativeElement;
      if (deskSurfaceElement) {
        this.deskStateService.setDeskSurface(deskSurfaceElement);
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
    if (this.isMiddleMouseButton(event)) {
      this.startMiddleMousePan(event);
    } else if (this.isLeftMouseButtonWithPanMode(event)) {
      this.startLeftMousePan(event);
    }
  }
  
  private isMiddleMouseButton(event: MouseEvent): boolean {
    return event.button === 1;
  }
  
  private isLeftMouseButtonWithPanMode(event: MouseEvent): boolean {
    return event.button === 0 && this.panService.panModeActive();
  }
  
  private startMiddleMousePan(event: MouseEvent): void {
    event.preventDefault();
    this.isMiddleMousePan = true;
    this.panService.startPan(event.clientX, event.clientY, true);
  }
  
  private startLeftMousePan(event: MouseEvent): void {
    event.preventDefault();
    this.isMiddleMousePan = false;
    this.panService.startPan(event.clientX, event.clientY, false);
  }
  
  onMouseMove(event: MouseEvent): void {
    this.panService.updatePan(event.clientX, event.clientY, this.updateDeskPosition);
  }
  
  private updateDeskPosition = (deltaX: number, deltaY: number): void => {
    const newX = this.deskX() + deltaX;
    const newY = this.deskY() + deltaY;
    
    this.deskX.set(this.clampPanValue(newX));
    this.deskY.set(this.clampPanValue(newY));
  };
  
  private clampPanValue(value: number): number {
    return Math.max(-this.maxPan, Math.min(this.maxPan, value));
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
    if (!this.isTwoFingerTouch(event)) return;
    
    event.preventDefault();
    this.initializePinchGesture(event);
  }
  
  private isTwoFingerTouch(event: TouchEvent): boolean {
    return event.touches.length === 2;
  }
  
  private initializePinchGesture(event: TouchEvent): void {
    const [touch1, touch2] = [event.touches[0], event.touches[1]];
    
    this.initialPinchDistance = this.calculateDistance(touch1, touch2);
    this.touchStartZoom = this.zoom();
    
    const centerPoint = this.calculateTouchCenter(touch1, touch2);
    this.panService.startPan(centerPoint.x, centerPoint.y, false);
  }
  
  private calculateDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  private calculateTouchCenter(touch1: Touch, touch2: Touch) {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  }
  
  onTouchMove(event: TouchEvent): void {
    if (!this.isActivePinchGesture(event)) return;
    
    event.preventDefault();
    this.handlePinchGesture(event);
  }
  
  private isActivePinchGesture(event: TouchEvent): boolean {
    return event.touches.length === 2 && this.initialPinchDistance > 0;
  }
  
  private handlePinchGesture(event: TouchEvent): void {
    const [touch1, touch2] = [event.touches[0], event.touches[1]];
    const centerPoint = this.calculateTouchCenter(touch1, touch2);
    const currentDistance = this.calculateDistance(touch1, touch2);
    
    this.updateZoomFromPinch(currentDistance);
    this.panService.updatePan(centerPoint.x, centerPoint.y, this.updateDeskPosition);
  }
  
  private updateZoomFromPinch(currentDistance: number): void {
    const scale = currentDistance / this.initialPinchDistance;
    const newZoom = this.touchStartZoom * scale;
    const clampedZoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
    this.zoom.set(clampedZoom);
  }
  
  onTouchEnd(event: TouchEvent): void {
    if (event.touches.length < 2) {
      this.endPinchGesture();
    }
  }
  
  private endPinchGesture(): void {
    this.panService.endPan(false);
    this.initialPinchDistance = 0;
  }
  
  onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.adjustZoomFromWheel(event);
  }
  
  private adjustZoomFromWheel(event: WheelEvent): void {
    const zoomDirection = event.deltaY > 0 ? -1 : 1;
    const delta = zoomDirection * this.zoomStep;
    const newZoom = this.zoom() + delta;
    const clampedZoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
    this.zoom.set(clampedZoom);
  }
}