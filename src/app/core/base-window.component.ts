import { signal, computed, inject, OnInit, effect, Directive, ElementRef } from '@angular/core';
import { WindowService } from './window.service';
import { StorageService } from './storage.service';
import { ParticleService } from './particle.service';
import { DeskStateService } from './desk-state.service';

@Directive()
export abstract class BaseWindowComponent implements OnInit {
  protected windowService = inject(WindowService);
  protected storageService = inject(StorageService);
  protected particleService = inject(ParticleService);
  protected elementRef = inject(ElementRef);
  protected deskStateService = inject(DeskStateService);

  protected abstract windowId: string;
  protected abstract windowTitle: string;
  protected abstract storageKey: string;
  protected abstract getDefaultPosition(): { x: number; y: number };
  protected abstract getParticleColor(): string;

  protected x = signal(0);
  protected y = signal(0);
  protected zIndex = signal(1);
  protected isMinimized = computed(() => this.windowService.isMinimized(this.windowId));
  protected isActive = computed(() => this.windowService.activeWindowId() === this.windowId);

  private activationTrigger = signal(0);
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private windowStartX = 0;
  private windowStartY = 0;

  constructor() {
    this.setupWindowStatePersistence();
    this.setupParticleEffects();
    this.setupZoomTracking();
  }

  private setupWindowStatePersistence(): void {
    effect(() => {
      const x = this.x();
      const y = this.y();
      const isMinimized = this.isMinimized();
      this.storageService.saveWindowState(this.storageKey, x, y, isMinimized);
    });
  }

  private setupParticleEffects(): void {
    effect(() => {
      const isActive = this.isActive();
      const isMinimized = this.isMinimized();
      const position = { x: this.x(), y: this.y() };
      this.activationTrigger();

      if (isActive && !isMinimized) {
        this.startParticleEmission();
      } else {
        this.particleService.stopEmitting();
      }
    });
  }

  private setupZoomTracking(): void {
    effect(() => {
      const currentZoom = this.deskStateService.zoom();
      this.particleService.updateZoom(currentZoom);
    });
  }

  private startParticleEmission(): void {
    const windowElement = this.getWindowElement();
    const deskContainer = this.deskStateService.getDeskSurface();

    if (windowElement && deskContainer) {
      this.particleService.startEmitting(windowElement, this.getParticleColor(), deskContainer);
    }
  }

  private getWindowElement(): HTMLElement | null {
    return this.elementRef.nativeElement.querySelector('.window, .window-container');
  }

  ngOnInit(): void {
    this.initializeWindowFromStorage();
  }

  private initializeWindowFromStorage(): void {
    const defaultPosition = this.getDefaultPosition();
    const savedState = this.storageService.loadWindowState(
      this.storageKey,
      defaultPosition.x,
      defaultPosition.y
    );

    this.registerWindowInService(savedState.x, savedState.y);
    this.restoreMinimizedState(savedState.isMinimized);
    this.synchronizeLocalState();
  }

  private registerWindowInService(x: number, y: number): void {
    this.windowService.registerWindow(this.windowId, this.windowTitle, x, y);
  }

  private restoreMinimizedState(isMinimized: boolean): void {
    if (isMinimized) {
      this.windowService.toggleMinimize(this.windowId);
    }
  }

  private synchronizeLocalState(): void {
    const windowState = this.windowService.getWindow(this.windowId);

    if (windowState) {
      this.x.set(windowState.x);
      this.y.set(windowState.y);
      this.zIndex.set(windowState.zIndex);
    }
  }

  onHeaderMouseDown(event: MouseEvent): void {
    if (!this.isLeftMouseButton(event)) return;
    if (this.isClickingButton(event)) return;

    event.preventDefault();
    this.beginDrag(event.clientX, event.clientY);
    this.attachMouseDragListeners();
  }

  private isLeftMouseButton(event: MouseEvent): boolean {
    return event.button === 0;
  }

  private isClickingButton(event: MouseEvent): boolean {
    return (event.target as HTMLElement).closest('button') !== null;
  }

  private attachMouseDragListeners(): void {
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  onHeaderTouchStart(event: TouchEvent): void {
    if (this.isClickingButton(event as any)) return;
    if (!this.isSingleTouchGesture(event)) return;

    event.preventDefault();
    const touch = event.touches[0];
    this.beginDrag(touch.clientX, touch.clientY);
    this.attachTouchDragListeners();
  }

  private isSingleTouchGesture(event: TouchEvent): boolean {
    return event.touches.length === 1;
  }

  private attachTouchDragListeners(): void {
    document.addEventListener('touchmove', this.onTouchMove, { passive: false });
    document.addEventListener('touchend', this.onTouchEnd);
    document.addEventListener('touchcancel', this.onTouchEnd);
  }

  private beginDrag(clientX: number, clientY: number): void {
    this.captureDragStartPosition(clientX, clientY);
    this.bringWindowToFront();
    this.triggerParticleActivation();
  }

  private captureDragStartPosition(clientX: number, clientY: number): void {
    this.isDragging = true;
    this.dragStartX = clientX;
    this.dragStartY = clientY;
    this.windowStartX = this.x();
    this.windowStartY = this.y();
  }

  private bringWindowToFront(): void {
    this.windowService.bringToFront(this.windowId);

    const windowState = this.windowService.getWindow(this.windowId);
    if (windowState) {
      this.zIndex.set(windowState.zIndex);
    }
  }

  private triggerParticleActivation(): void {
    this.activationTrigger.update(count => count + 1);
  }

  protected onMouseMove = (event: MouseEvent): void => {
    if (!this.isDragging) return;

    this.updateWindowPosition(event.clientX, event.clientY);
  };

  protected onMouseUp = (): void => {
    this.endDrag();
    this.detachMouseDragListeners();
  };

  protected onTouchMove = (event: TouchEvent): void => {
    if (!this.isDragging || !this.isSingleTouchGesture(event)) return;

    event.preventDefault();
    const touch = event.touches[0];
    this.updateWindowPosition(touch.clientX, touch.clientY);
  };

  protected onTouchEnd = (): void => {
    this.endDrag();
    this.detachTouchDragListeners();
  };

  private updateWindowPosition(clientX: number, clientY: number): void {
    const currentZoom = this.deskStateService.zoom();
    const deltaX = (clientX - this.dragStartX) / currentZoom;
    const deltaY = (clientY - this.dragStartY) / currentZoom;

    const newX = this.windowStartX + deltaX;
    const newY = this.windowStartY + deltaY;

    this.x.set(newX);
    this.y.set(newY);
    this.windowService.updatePosition(this.windowId, newX, newY);
  }

  private endDrag(): void {
    this.isDragging = false;
  }

  private detachMouseDragListeners(): void {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  private detachTouchDragListeners(): void {
    document.removeEventListener('touchmove', this.onTouchMove);
    document.removeEventListener('touchend', this.onTouchEnd);
    document.removeEventListener('touchcancel', this.onTouchEnd);
  }

  onMinimize(): void {
    this.windowService.toggleMinimize(this.windowId);
  }

  onFocus(): void {
    this.bringWindowToFront();
    this.triggerParticleActivation();
  }
}
