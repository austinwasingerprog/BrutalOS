import { Component, signal, computed, inject, OnInit, effect } from '@angular/core';
import { WindowService } from '../../core/window.service';
import { StorageService, TodoItem } from '../../core/storage.service';

@Component({
  selector: 'app-todo',
  imports: [],
  templateUrl: './todo.component.html',
  styleUrl: './todo.component.css'
})
export class TodoComponent implements OnInit {
  private windowService = inject(WindowService);
  private storageService = inject(StorageService);
  private readonly windowId = 'todo-1';
  
  protected todos = signal<TodoItem[]>([]);
  protected newTodoText = signal('');
  private nextId = 1;
  
  // Computed stats
  protected remainingCount = computed(() => 
    this.todos().filter(t => t.completed === false).length
  );
  protected totalCount = computed(() => this.todos().length);
  
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
  
  ngOnInit(): void {
    // Load persisted state
    const stored = this.storageService.loadTodo();
    this.todos.set(stored.todos);
    this.nextId = stored.nextId;
    
    // Use stored position or default to right of notepad
    const initialX = stored.window.x || window.innerWidth / 2 + 250;
    const initialY = stored.window.y || window.innerHeight / 2 - 250;
    
    // Register window with service
    this.windowService.registerWindow(this.windowId, 'TODO.TXT', initialX, initialY);
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
    
    // Auto-save todos changes
    effect(() => {
      this.storageService.saveTodos(this.todos(), this.nextId);
    });
    
    // Auto-save window position changes
    effect(() => {
      const x = this.x();
      const y = this.y();
      const isMinimized = this.isMinimized();
      this.storageService.saveTodoWindow(x, y, isMinimized);
    });
  }
  
  onHeaderMouseDown(event: MouseEvent): void {
    if ((event.target as HTMLElement).closest('button')) {
      return;
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
  
  onFocus(): void {
    this.windowService.bringToFront(this.windowId);
    const state = this.windowService.getWindow(this.windowId);
    if (state) {
      this.zIndex.set(state.zIndex);
    }
  }
  
  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.newTodoText.set(input.value);
  }
  
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.newTodoText().trim()) {
      this.addTodo();
    }
  }
  
  addTodo(): void {
    const text = this.newTodoText().trim();
    if (text) {
      this.todos.update(todos => [
        ...todos,
        { id: this.nextId++, text, completed: false }
      ]);
      this.newTodoText.set('');
    }
  }
  
  toggleTodo(id: number): void {
    this.todos.update(todos =>
      todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }
  
  deleteTodo(id: number): void {
    this.todos.update(todos => todos.filter(todo => todo.id !== id));
  }
}
