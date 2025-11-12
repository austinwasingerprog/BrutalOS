import { Component, signal, effect } from '@angular/core';
import { BaseWindowComponent } from '../../core/base-window.component';

@Component({
  selector: 'app-notepad',
  imports: [],
  templateUrl: './notepad.component.html',
  styleUrl: './notepad.component.css'
})
export class NotepadComponent extends BaseWindowComponent {
  protected override windowId = 'notepad-1';
  protected override windowTitle = 'NOTEPAD.TXT';
  protected override storageKey = 'brutalos_notepad';
  
  protected content = signal('');
  protected focused = signal(false);
  
  constructor() {
    super();
    
    // Auto-save content changes
    effect(() => {
      this.storageService.saveNotepadContent(this.content());
    });
  }
  
  protected override getDefaultPosition(): { x: number; y: number } {
    return {
      x: window.innerWidth / 2 - 210,
      y: window.innerHeight / 2 - 260
    };
  }
  
  override ngOnInit(): void {
    // Load persisted content
    const stored = this.storageService.loadNotepad();
    this.content.set(stored.content);
    
    // Call base class initialization
    super.ngOnInit();
  }
  
  onInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.content.set(textarea.value);
  }
  
  override onFocus(): void {
    super.onFocus();
    this.focused.set(true);
  }
  
  onBlur(): void {
    this.focused.set(false);
  }
}
