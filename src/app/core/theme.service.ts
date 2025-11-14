import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  theme = signal<Theme>('light');
  
  constructor() {
    const savedTheme = localStorage.getItem('brutalos_theme') as Theme;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      this.theme.set(savedTheme);
      this.applyTheme(savedTheme);
    }
    
    effect(() => {
      const currentTheme = this.theme();
      localStorage.setItem('brutalos_theme', currentTheme);
      this.applyTheme(currentTheme);
    });
  }
  
  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }
  
  private applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
