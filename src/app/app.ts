import { Component, signal } from '@angular/core';
import { DeskComponent } from './components/desk/desk.component';
import { ControlsComponent } from './components/controls/controls.component';
import { TaskbarComponent } from './components/taskbar/taskbar.component';

@Component({
  selector: 'app-root',
  imports: [DeskComponent, ControlsComponent, TaskbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Brutal OS');
}
