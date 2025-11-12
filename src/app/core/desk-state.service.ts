import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DeskStateService {
  zoom = signal(1);
  private deskSurfaceElement: HTMLElement | null = null;
  
  setZoom(zoom: number): void {
    this.zoom.set(zoom);
  }
  
  setDeskSurface(element: HTMLElement): void {
    this.deskSurfaceElement = element;
  }
  
  getDeskSurface(): HTMLElement | null {
    return this.deskSurfaceElement;
  }
}
