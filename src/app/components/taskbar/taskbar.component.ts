import { Component, inject, computed } from '@angular/core';
import { WindowService } from '../../core/window.service';
import { BaseWindowComponent } from '../windows/base-window.component';

@Component({
  selector: 'app-taskbar',
  imports: [],
  templateUrl: './taskbar.component.html',
  styleUrl: './taskbar.component.css'
})
export class TaskbarComponent {
  protected windowService = inject(WindowService);
  protected minimizedWindows = computed(() => 
    this.windowService.windows().filter(w => w.isMinimized()).sort((a, b) => a.windowTitle.localeCompare(b.windowTitle))
  );
  
  restoreWindow(window: BaseWindowComponent): void {
    window.isMinimized.set(false);
  }
}
