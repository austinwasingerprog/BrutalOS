import { Injectable, signal } from '@angular/core';

export interface WindowState {
  id: string;
  title: string;
  isMinimized: boolean;
  x: number;
  y: number;
  zIndex: number;
}

@Injectable({
  providedIn: 'root'
})
export class WindowService {
  windows = signal<Map<string, WindowState>>(new Map());
  activeWindowId = signal<string | null>(null);
  
  private readonly baseZIndex = 10;
  private nextZIndex = 10;
  
  registerWindow(id: string, title: string, x: number, y: number): void {
    const state: WindowState = {
      id,
      title,
      isMinimized: false,
      x,
      y,
      zIndex: this.nextZIndex++
    };
    
    this.windows.update(map => {
      const newMap = new Map(map);
      newMap.set(id, state);
      return newMap;
    });
  }
  
  getWindow(id: string): WindowState | undefined {
    return this.windows().get(id);
  }
  
  updatePosition(id: string, x: number, y: number): void {
    this.windows.update(map => {
      const newMap = new Map(map);
      const window = newMap.get(id);
      if (window) {
        window.x = x;
        window.y = y;
      }
      return newMap;
    });
  }
  
  activateWindow(id: string): void {
    this.activeWindowId.set(id);
    
    this.windows.update(map => {
      const newMap = new Map(map);
      const window = newMap.get(id);
      if (window) {
        window.zIndex = this.nextZIndex++;
      }
      return newMap;
    });
  }
  
  bringToFront(id: string): void {
    this.activateWindow(id);
  }
  
  toggleMinimize(id: string): void {
    this.windows.update(map => {
      const newMap = new Map(map);
      const window = newMap.get(id);
      if (window) {
        window.isMinimized = !window.isMinimized;
        if (!window.isMinimized) {
          // Restore also activates
          this.activateWindow(id);
        } else if (this.activeWindowId() === id) {
          // If minimizing active window, clear active state
          this.activeWindowId.set(null);
        }
      }
      return newMap;
    });
  }
  
  isMinimized(id: string): boolean {
    return this.getWindow(id)?.isMinimized ?? false;
  }
}
