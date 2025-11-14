import { signal, computed, inject, OnInit, OnDestroy, effect, Directive, ElementRef, viewChild, afterNextRender } from '@angular/core';
import { WindowService } from './window.service';
import { StorageService } from './storage.service';
import { DeskStateService } from './desk-state.service';

@Directive()
export abstract class BaseWindowComponent implements OnInit, OnDestroy {
  protected windowService = inject(WindowService);
  protected storageService = inject(StorageService);
  protected deskStateService = inject(DeskStateService);

  protected windowContainer = viewChild<ElementRef<HTMLElement>>('windowContainer');

  protected abstract windowId: string;
  protected abstract windowTitle: string;
  protected abstract storageKey: string;
  protected abstract getDefaultPosition(): { x: number; y: number };
  protected abstract getParticleColor(): string;

  protected x = signal(0);
  protected y = signal(0);
  protected zIndex = computed(() => this.windowService.getWindow(this.windowId)?.zIndex ?? 1);
  protected isMinimized = computed(() => this.windowService.isMinimized(this.windowId));
  protected isActive = computed(() => this.windowService.activeWindowId() === this.windowId);

  protected isDragging = signal(false);
  private dragStartX = 0;
  private dragStartY = 0;
  private windowStartX = 0;
  private windowStartY = 0;

  constructor() {
    this.setupWindowStatePersistence();
  }

  private setupWindowStatePersistence(): void {
    effect(() => {
      const x = this.x();
      const y = this.y();
      const isMinimized = this.isMinimized();
      this.storageService.saveWindowState(this.storageKey, x, y, isMinimized);
    });
  }

  ngOnInit(): void {
    this.initializeWindowFromStorage();
  }

  ngOnDestroy(): void {
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
    }
  }

  onHeaderMouseDown(event: MouseEvent): void {
    if (!this.isLeftMouseButton(event)) return;
    if (this.isClickingButton(event)) return;

    event.preventDefault();
    event.stopPropagation();
    this.windowService.bringToFront(this.windowId);
    this.beginDrag(event.clientX, event.clientY);
  }

  onHeaderTouchStart(event: TouchEvent): void {
    if (this.isClickingButton(event as any)) return;
    if (!this.isSingleTouchGesture(event)) return;

    event.preventDefault();
    event.stopPropagation();
    this.windowService.bringToFront(this.windowId);
    const touch = event.touches[0];
    this.beginDrag(touch.clientX, touch.clientY);
  }

  private isSingleTouchGesture(event: TouchEvent): boolean {
    return event.touches.length === 1;
  }

  private beginDrag(clientX: number, clientY: number): void {
    this.isDragging.set(true);
    this.dragStartX = clientX;
    this.dragStartY = clientY;
    this.windowStartX = this.x();
    this.windowStartY = this.y();
  }

  onWindowMouseMove(event: MouseEvent): void {
    if (!this.isDragging()) return;
    this.updateWindowPosition(event.clientX, event.clientY);
  }

  onWindowMouseUp(): void {
    this.isDragging.set(false);
  }

  onWindowTouchMove(event: TouchEvent): void {
    if (!this.isDragging() || !this.isSingleTouchGesture(event)) return;

    event.preventDefault();
    const touch = event.touches[0];
    this.updateWindowPosition(touch.clientX, touch.clientY);
  }

  onWindowTouchEnd(): void {
    this.isDragging.set(false);
  }

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

  onMinimize(): void {
    this.windowService.toggleMinimize(this.windowId);
  }

  onMouseDown(event: MouseEvent): void {
    if (!this.isLeftMouseButton(event)) return;
    this.windowService.bringToFront(this.windowId);
  }

  private isLeftMouseButton(event: MouseEvent): boolean {
    return event.button === 0;
  }

  private isClickingButton(event: MouseEvent): boolean {
    return (event.target as HTMLElement).closest('button') !== null;
  }
}