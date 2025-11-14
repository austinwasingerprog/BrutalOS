import { Component, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { BaseWindowComponent } from '../base-window.component';
import { TodoItem } from '../../../core/storage.service';

@Component({
  selector: 'app-todo',
  imports: [],
  templateUrl: './todo.component.html',
  styleUrl: './todo.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TodoComponent extends BaseWindowComponent {
  public override windowId = 'todo-1';
  public override windowTitle = 'TODO.TXT';
  protected override storageKey = 'brutalos_todo';
  
  protected todos = signal<TodoItem[]>([]);
  protected newTodoText = signal('');
  private nextId = 1;
  
  // Computed stats
  protected remainingCount = computed(() => 
    this.todos().filter(t => t.completed === false).length
  );
  protected totalCount = computed(() => this.todos().length);
  
  constructor() {
    super();
    this.setupAutoSave();
  }
  
  private setupAutoSave(): void {
    effect(() => {
      this.storageService.saveTodos(this.todos(), this.nextId);
    });
  }
  
  protected override getDefaultPosition(): { x: number; y: number } {
    return {
      x: window.innerWidth / 2 + 250,
      y: window.innerHeight / 2 - 260
    };
  }
  
  protected override getParticleColor(): string {
    return '#0ff'; // cyan
  }
  
  override ngOnInit(): void {
    this.loadSavedTodos();
    super.ngOnInit();
  }
  
  private loadSavedTodos(): void {
    const savedData = this.storageService.loadTodo();
    this.todos.set(savedData.todos);
    this.nextId = savedData.nextId;
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
