import { signal, computed, inject, OnInit, OnDestroy, effect, Directive, ElementRef, viewChild, afterNextRender } from '@angular/core';
import { WindowService } from '../../core/window.service';
import { StorageService } from '../../core/storage.service';

@Directive()
export abstract class BaseWindowComponent implements OnInit, OnDestroy {
  protected windowService = inject(WindowService);
  protected storageService = inject(StorageService);

  protected windowContainer = viewChild<ElementRef<HTMLElement>>('windowContainer');

  public abstract windowId: string;
  public abstract windowTitle: string;
  protected abstract storageKey: string;
  protected abstract getDefaultPosition(): { x: number; y: number };

  public x = signal(0);
  public y = signal(0);
  public zIndex = signal(0);
  public isMinimized = signal(false);
  
  constructor() {
    this.setupWindowStatePersistence();
  }

  ngOnInit(): void {
    this.initializeWindowFromStorage();
  }

  ngOnDestroy(): void {
  }

  onMouseDown(event: MouseEvent): void {
    if (!this.isLeftMouseButton(event)) return;
    this.windowService.bringToFront(this);
  }

  onTouchStart(event: TouchEvent): void {
    if (!this.isSingleTouchGesture(event)) return;
    this.windowService.bringToFront(this);
  }

  onHeaderMouseDown(event: MouseEvent): void {
    if (!this.isLeftMouseButton(event)) return;
    if (this.isClickingButton(event)) return;

    this.activateHeader(event, event.clientX, event.clientY);
  }

  onHeaderTouchStart(event: TouchEvent): void {
    if (!this.isSingleTouchGesture(event)) return;
    if (this.isClickingButton(event as any)) return;

    this.activateHeader(event, event.touches[0].clientX, event.touches[0].clientY);
  }

  private activateHeader(event: Event, x: number, y: number): void {
    event.preventDefault();
    event.stopPropagation();

    this.windowService.bringToFront(this);
    this.beginDrag(x, y);
  }

  private beginDrag(clientX: number, clientY: number): void {
    this.windowService.startDragging(clientX, clientY, this);
  }

  onWindowMouseMove(event: MouseEvent): void {
    this.windowService.updateDraggingPosition(event.clientX, event.clientY);
  }

  onWindowTouchMove(event: TouchEvent): void {
    this.windowService.updateDraggingPosition(event.touches[0].clientX, event.touches[0].clientY);
  }

  onWindowMouseUp(): void {
    this.windowService.stopDragging(this);
  }

  onWindowTouchEnd(): void {
    this.windowService.stopDragging(this);
  }

  onMinimize(): void {
    this.isMinimized.set(true);
  }

  private isLeftMouseButton(event: MouseEvent): boolean {
    return event.button === 0;
  }

  private isClickingButton(event: MouseEvent): boolean {
    return (event.target as HTMLElement).tagName.toLowerCase() == 'button';
  }

  private isSingleTouchGesture(event: TouchEvent): boolean {
    return event.touches.length === 1;
  }

  private setupWindowStatePersistence(): void {
    effect(() => {
      const x = this.x();
      const y = this.y();
      const isMinimized = this.isMinimized();
      this.storageService.saveWindowState(this.storageKey, x, y, isMinimized);
    });
  }

  private initializeWindowFromStorage(): void {
    const defaultPosition = this.getDefaultPosition();
    const savedState = this.storageService.loadWindowState(
      this.storageKey,
      defaultPosition.x,
      defaultPosition.y
    );

    this.windowService.registerWindow(this);
    this.isMinimized.set(savedState.isMinimized);
    this.x.set(savedState.x);
    this.y.set(savedState.y);
  }
}