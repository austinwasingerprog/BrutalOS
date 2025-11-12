import { Component, inject, computed } from '@angular/core';
import { WindowService } from '../../core/window.service';

@Component({
  selector: 'app-taskbar',
  imports: [],
  templateUrl: './taskbar.component.html',
  styleUrl: './taskbar.component.css'
})
export class TaskbarComponent {
  protected windowService = inject(WindowService);
  protected minimizedWindows = computed(() => 
    Array.from(this.windowService.windows().values()).filter(w => w.isMinimized)
  );
  
  restoreWindow(windowId: string): void {
    this.windowService.toggleMinimize(windowId);
  }
}
