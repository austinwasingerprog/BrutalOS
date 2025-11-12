import { Component, signal, computed, inject, OnInit, effect } from '@angular/core';
import { WindowService } from '../../core/window.service';
import { StorageService } from '../../core/storage.service';

@Component({
  selector: 'app-notepad',
  imports: [],
  templateUrl: './notepad.component.html',
  styleUrl: './notepad.component.css'
})
export class NotepadComponent implements OnInit {
  private windowService = inject(WindowService);
  private storageService = inject(StorageService);
  private readonly windowId = 'notepad-1';
  
  protected content = signal('');
  protected focused = signal(false);
  
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
    // Auto-save content changes
    effect(() => {
      this.storageService.saveNotepadContent(this.content());
    });
    
    // Auto-save window position changes
    effect(() => {
      const x = this.x();
      const y = this.y();
      const isMinimized = this.isMinimized();
      this.storageService.saveNotepadWindow(x, y, isMinimized);
    });
  }
  
  ngOnInit(): void {
    // Load persisted state
    const stored = this.storageService.loadNotepad();
    this.content.set(stored.content);
    
    // Use stored position or center on screen
    const initialX = stored.window.x || window.innerWidth / 2 - 200;
    const initialY = stored.window.y || window.innerHeight / 2 - 250;
    
    // Register window with service
    this.windowService.registerWindow(this.windowId, 'NOTEPAD.TXT', initialX, initialY);
    if (stored.window.isMinimized) {
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
  
  onHeaderMouseDown(event: MouseEvent): void {
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
    
    // Add global listeners
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }
  
  private onMouseMove = (event: MouseEvent): void => {
    if (!this.isDragging) return;
    
    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;
    
    const newX = this.windowStartX + deltaX;
    const newY = this.windowStartY + deltaY;
    
    this.x.set(newX);
    this.y.set(newY);
    this.windowService.updatePosition(this.windowId, newX, newY);
  };
  
  private onMouseUp = (): void => {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  };
  
  onMinimize(): void {
    this.windowService.toggleMinimize(this.windowId);
  }
  
  onInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.content.set(textarea.value);
  }
  
  onFocus(): void {
    this.focused.set(true);
    this.windowService.bringToFront(this.windowId);
    const state = this.windowService.getWindow(this.windowId);
    if (state) {
      this.zIndex.set(state.zIndex);
    }
  }
  
  onBlur(): void {
    this.focused.set(false);
  }
}
