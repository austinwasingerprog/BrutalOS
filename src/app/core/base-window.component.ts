import { Component, signal, computed, inject, OnInit, effect, Directive } from '@angular/core';
import { WindowService } from './window.service';
import { StorageService } from './storage.service';

@Directive()
export abstract class BaseWindowComponent implements OnInit {
  protected windowService = inject(WindowService);
  protected storageService = inject(StorageService);
  
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
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.windowStartX = this.x();
    this.windowStartY = this.y();
    
    this.windowService.bringToFront(this.windowId);
    const state = this.windowService.getWindow(this.windowId);
    if (state) {
      this.zIndex.set(state.zIndex);
    }
    
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }
  
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
