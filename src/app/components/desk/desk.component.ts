import { Component, signal, computed, inject } from '@angular/core';
import { NotepadComponent } from '../notepad/notepad.component';
import { TodoComponent } from '../todo/todo.component';
import { PanService } from '../../core/pan.service';

@Component({
  selector: 'app-desk',
  imports: [NotepadComponent, TodoComponent],
  templateUrl: './desk.component.html',
  styleUrl: './desk.component.css'
})
export class DeskComponent {
  private panService = inject(PanService);
  
  protected deskX = signal(0);
  protected deskY = signal(0);
  protected cursorStyle = computed(() => this.panService.getCursorStyle());
  
  private maxPan = 600;
  private isMiddleMousePan = false;
  
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
}