import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { BaseWindowComponent } from '../../core/base-window.component';
import { ThemeService, Theme } from '../../core/theme.service';

@Component({
  selector: 'app-settings',
  imports: [],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent extends BaseWindowComponent {
  private themeService = inject(ThemeService);
  
  protected override windowId = 'settings';
  protected override windowTitle = 'Settings';
  protected override storageKey = 'brutalos_settings';
  
  protected theme = this.themeService.theme;
  
  protected override getDefaultPosition() {
    return { x: 450, y: 250 };
  }
  
  protected override getParticleColor(): string {
    return 'limegreen';
  }
  
  onThemeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.themeService.setTheme(select.value as Theme);
  }
}
