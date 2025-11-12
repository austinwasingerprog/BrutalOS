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
    this.setupAutoSave();
  }
  
  private setupAutoSave(): void {
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
  
  protected override getParticleColor(): string {
    return '#ff1493'; // pink
  }
  
  override ngOnInit(): void {
    this.loadSavedContent();
    super.ngOnInit();
  }
  
  private loadSavedContent(): void {
    const savedNotepad = this.storageService.loadNotepad();
    this.content.set(savedNotepad.content);
  }
  
  onInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.content.set(textarea.value);
  }
  
  onBlur(): void {
    this.focused.set(false);
  }
}
