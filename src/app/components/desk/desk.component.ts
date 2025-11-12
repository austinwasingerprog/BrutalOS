import { Component, signal, computed, inject } from '@angular/core';
import { NotepadComponent } from '../notepad/notepad.component';
import { TodoComponent } from '../todo/todo.component';
import { CalculatorComponent } from '../calculator/calculator.component';
import { PanService } from '../../core/pan.service';

@Component({
  selector: 'app-desk',
  imports: [NotepadComponent, TodoComponent, CalculatorComponent],
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
  
  // Touch state
  private touchStartDistance = 0;
  private touchStartX = 0;
  private touchStartY = 0;
  
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
  
  onTouchStart(event: TouchEvent): void {
    // Only handle two-finger touch for panning
    if (event.touches.length === 2) {
      event.preventDefault();
      
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      this.touchStartX = centerX;
      this.touchStartY = centerY;
      this.panService.startPan(centerX, centerY, false);
    }
  }
  
  onTouchMove(event: TouchEvent): void {
    // Only handle two-finger touch for panning
    if (event.touches.length === 2) {
      event.preventDefault();
      
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      this.panService.updatePan(centerX, centerY, (deltaX, deltaY) => {
        const newX = this.deskX() + deltaX;
        const newY = this.deskY() + deltaY;
        
        // Apply limits
        this.deskX.set(Math.max(-this.maxPan, Math.min(this.maxPan, newX)));
        this.deskY.set(Math.max(-this.maxPan, Math.min(this.maxPan, newY)));
      });
    }
  }
  
  onTouchEnd(event: TouchEvent): void {
    // End panning when fingers are lifted
    if (event.touches.length < 2) {
      this.panService.endPan(false);
    }
  }
}