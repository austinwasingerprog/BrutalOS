import { Component, inject } from '@angular/core';
import { PanService } from '../../core/pan.service';

@Component({
  selector: 'app-controls',
  imports: [],
  templateUrl: './controls.component.html',
  styleUrl: './controls.component.css'
})
export class ControlsComponent {
  protected panService = inject(PanService);
  
  togglePanMode(): void {
    this.panService.togglePanMode();
  }
}
