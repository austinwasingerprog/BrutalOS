import { Component, input, output, Signal } from '@angular/core';

@Component({
  selector: 'app-controls',
  imports: [],
  templateUrl: './controls.component.html',
  styleUrl: './controls.component.css'
})
export class ControlsComponent {
  panModeActive = input.required<Signal<boolean>>();
  onTogglePanMode = output<void>();
  
  togglePanMode(): void {
    this.onTogglePanMode.emit();
  }
}
