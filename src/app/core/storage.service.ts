import { Injectable } from '@angular/core';

export interface StoredWindowState {
  x: number;
  y: number;
  isMinimized: boolean;
}

export interface StoredNotepadState {
  content: string;
  window: StoredWindowState;
}

export interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

export interface StoredTodoState {
  todos: TodoItem[];
  nextId: number;
  window: StoredWindowState;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly NOTEPAD_KEY = 'brutalos_notepad';
  private readonly TODO_KEY = 'brutalos_todo';

  // Notepad persistence
  saveNotepadContent(content: string): void {
    const current = this.loadNotepad();
    this.save(this.NOTEPAD_KEY, { ...current, content });
  }

  saveNotepadWindow(x: number, y: number, isMinimized: boolean): void {
    const current = this.loadNotepad();
    this.save(this.NOTEPAD_KEY, {
      ...current,
      window: { x, y, isMinimized }
    });
  }

  loadNotepad(): StoredNotepadState {
    return this.load(this.NOTEPAD_KEY, {
      content: '',
      window: { x: 0, y: 0, isMinimized: false }
    });
  }

  // Todo persistence
  saveTodos(todos: TodoItem[], nextId: number): void {
    const current = this.loadTodo();
    this.save(this.TODO_KEY, { ...current, todos, nextId });
  }

  saveTodoWindow(x: number, y: number, isMinimized: boolean): void {
    const current = this.loadTodo();
    this.save(this.TODO_KEY, {
      ...current,
      window: { x, y, isMinimized }
    });
  }

  loadTodo(): StoredTodoState {
    return this.load(this.TODO_KEY, {
      todos: [],
      nextId: 1,
      window: { x: 0, y: 0, isMinimized: false }
    });
  }

  // Generic helpers
  private save<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  private load<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return defaultValue;
    }
  }
}
