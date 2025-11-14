import { inject, Injectable, signal } from '@angular/core';
import { BaseWindowComponent } from '../components/windows/base-window.component';

@Injectable({
  providedIn: 'root'
})
export class WindowService {
  windows = signal<BaseWindowComponent[]>([]);
  zoom = signal(1);

  currentDraggingWindow = signal<BaseWindowComponent | null>(null);
  dragStartX = 0;
  dragStartY = 0;
  windowStartX = 0;
  windowStartY = 0;

  registerWindow(baseWindowComponent: BaseWindowComponent): void {
    this.windows.update(windows => [...windows, baseWindowComponent]);
  }

  getWindow(id: string): BaseWindowComponent | undefined {
    return this.windows().find(w => w.windowId === id);
  }

  bringToFront(window: BaseWindowComponent): void {
    if (!window) return;

    const highestZIndex = Math.max(...this.windows().map(w => w.zIndex()));
    window.zIndex.set(highestZIndex + 1);
  }

  startDragging(clientX: number, clientY: number, window: BaseWindowComponent): void {
    this.dragStartX = clientX;
    this.dragStartY = clientY;
    this.windowStartX = window.x();
    this.windowStartY = window.y();
    this.currentDraggingWindow.set(window);
  }

  stopDragging(window: BaseWindowComponent): void {
    if (this.currentDraggingWindow() !== window) return;
    this.currentDraggingWindow.set(null);
  }

  stopDraggingAll(): void {
    this.currentDraggingWindow.set(null);
  }

  updateDraggingPosition(x: number, y: number): void {
    const draggingWindow = this.currentDraggingWindow();
    if (!draggingWindow) return;

    const currentZoom = this.zoom();
    const deltaX = (x - this.dragStartX) / currentZoom;
    const deltaY = (y - this.dragStartY) / currentZoom;

    const newX = this.windowStartX + deltaX;
    const newY = this.windowStartY + deltaY;

    draggingWindow.x.set(newX);
    draggingWindow.y.set(newY);
  }
}
