import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { BaseWindowComponent } from '../base-window.component';
import { Theme, ThemeService } from '../../../core/theme.service';

@Component({
  selector: 'app-settings',
  imports: [],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent extends BaseWindowComponent {
  private themeService = inject(ThemeService);
  
  public override windowId = 'settings';
  public override windowTitle = 'Settings';
  protected override storageKey = 'brutalos_settings';
  
  protected theme = this.themeService.theme;
  
  protected override getDefaultPosition() {
    return { x: 450, y: 250 };
  }
  
  onThemeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.themeService.setTheme(select.value as Theme);
  }
}
