import { Component, signal, computed, inject, OnInit, effect, Directive, ElementRef } from '@angular/core';
import { WindowService } from './window.service';
import { StorageService } from './storage.service';
import { ParticleService } from './particle.service';

@Directive()
export abstract class BaseWindowComponent implements OnInit {
  protected windowService = inject(WindowService);
  protected storageService = inject(StorageService);
  protected particleService = inject(ParticleService);
  protected elementRef = inject(ElementRef);
  
  // Subclasses must provide these
  protected abstract windowId: string;
  protected abstract windowTitle: string;
  protected abstract storageKey: string;
  protected abstract getDefaultPosition(): { x: number; y: number };
  
  // Window state
  protected x = signal(0);
  protected y = signal(0);
  protected zIndex = signal(1);
  protected isMinimized = computed(() => this.windowService.isMinimized(this.windowId));
  protected isActive = computed(() => this.windowService.activeWindowId() === this.windowId);
  
  // Dragging state
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private windowStartX = 0;
  private windowStartY = 0;
  
  constructor() {
    // Auto-save window position changes
    effect(() => {
      const x = this.x();
      const y = this.y();
      const isMinimized = this.isMinimized();
      this.storageService.saveWindowState(this.storageKey, x, y, isMinimized);
    });
    
    // Emit particles when window is active or position changes
    effect(() => {
      const isActive = this.isActive();
      const x = this.x(); // Track position changes
      const y = this.y();
      const isMin = this.isMinimized();
      
      if (isActive && !isMin) {
        const element = this.elementRef.nativeElement.querySelector('.window, .window-container');
        if (element) {
          this.particleService.startEmitting(element, this.getParticleColor());
        }
      } else {
        this.particleService.stopEmitting();
      }
    });
  }
  
  ngOnInit(): void {
    // Load persisted position or use default
    const defaultPos = this.getDefaultPosition();
    const { x: initialX, y: initialY, isMinimized } = this.storageService.loadWindowState(
      this.storageKey,
      defaultPos.x,
      defaultPos.y
    );
    
    // Register window with service
    this.windowService.registerWindow(this.windowId, this.windowTitle, initialX, initialY);
    if (isMinimized) {
      this.windowService.toggleMinimize(this.windowId);
    }
    
    // Sync with service state
    const state = this.windowService.getWindow(this.windowId);
    if (state) {
      this.x.set(state.x);
      this.y.set(state.y);
      this.zIndex.set(state.zIndex);
    }
  }
  
  // Common window operations
  onHeaderMouseDown(event: MouseEvent): void {
    // Only drag with left mouse button (button 0)
    if (event.button !== 0) {
      return;
    }
    
    if ((event.target as HTMLElement).closest('button')) {
      return; // Don't drag if clicking a button
    }
    
    event.preventDefault();
    this.startDrag(event.clientX, event.clientY);
    
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }
  
  onHeaderTouchStart(event: TouchEvent): void {
    if ((event.target as HTMLElement).closest('button')) {
      return; // Don't drag if touching a button
    }
    
    // Only handle single touch
    if (event.touches.length !== 1) {
      return;
    }
    
    event.preventDefault();
    const touch = event.touches[0];
    this.startDrag(touch.clientX, touch.clientY);
    
    document.addEventListener('touchmove', this.onTouchMove, { passive: false });
    document.addEventListener('touchend', this.onTouchEnd);
    document.addEventListener('touchcancel', this.onTouchEnd);
  }
  
  private startDrag(clientX: number, clientY: number): void {
    this.isDragging = true;
    this.dragStartX = clientX;
    this.dragStartY = clientY;
    this.windowStartX = this.x();
    this.windowStartY = this.y();
    
    this.windowService.bringToFront(this.windowId);
    const state = this.windowService.getWindow(this.windowId);
    if (state) {
      this.zIndex.set(state.zIndex);
    }
  }
  
  protected abstract getParticleColor(): string;
  
  protected onMouseMove = (event: MouseEvent): void => {
    if (!this.isDragging) return;
    
    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;
    
    const newX = this.windowStartX + deltaX;
    const newY = this.windowStartY + deltaY;
    
    this.x.set(newX);
    this.y.set(newY);
    this.windowService.updatePosition(this.windowId, newX, newY);
  };
  
  protected onMouseUp = (): void => {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  };
  
  protected onTouchMove = (event: TouchEvent): void => {
    if (!this.isDragging || event.touches.length !== 1) return;
    
    event.preventDefault();
    const touch = event.touches[0];
    
    const deltaX = touch.clientX - this.dragStartX;
    const deltaY = touch.clientY - this.dragStartY;
    
    const newX = this.windowStartX + deltaX;
    const newY = this.windowStartY + deltaY;
    
    this.x.set(newX);
    this.y.set(newY);
    this.windowService.updatePosition(this.windowId, newX, newY);
  };
  
  protected onTouchEnd = (): void => {
    this.isDragging = false;
    document.removeEventListener('touchmove', this.onTouchMove);
    document.removeEventListener('touchend', this.onTouchEnd);
    document.removeEventListener('touchcancel', this.onTouchEnd);
  };
  
  onMinimize(): void {
    this.windowService.toggleMinimize(this.windowId);
  }
  
  onFocus(): void {
    this.windowService.bringToFront(this.windowId);
    const state = this.windowService.getWindow(this.windowId);
    if (state) {
      this.zIndex.set(state.zIndex);
    }
  }
}
