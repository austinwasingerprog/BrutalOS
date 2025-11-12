import { Component, signal, effect } from '@angular/core';
import { BaseWindowComponent } from '../../core/base-window.component';

@Component({
  selector: 'app-calculator',
  imports: [],
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.css'
})
export class CalculatorComponent extends BaseWindowComponent {
  protected override windowId = 'calculator-1';
  protected override windowTitle = 'CALCULATOR.EXE';
  protected override storageKey = 'brutalos_calculator';
  
  protected display = signal('0');
  protected currentValue = signal('0');
  protected previousValue = signal<string | null>(null);
  protected operation = signal<string | null>(null);
  protected newNumber = signal(true);
  
  protected override getDefaultPosition(): { x: number; y: number } {
    return {
      x: window.innerWidth / 2 - 150,
      y: window.innerHeight / 2 - 200
    };
  }
  
  onNumberClick(num: string): void {
    if (this.newNumber()) {
      this.display.set(num);
      this.currentValue.set(num);
      this.newNumber.set(false);
    } else {
      const newDisplay = this.display() === '0' ? num : this.display() + num;
      this.display.set(newDisplay);
      this.currentValue.set(newDisplay);
    }
  }
  
  onOperationClick(op: string): void {
    if (this.operation() && !this.newNumber()) {
      this.calculate();
    }
    
    this.previousValue.set(this.currentValue());
    this.operation.set(op);
    this.newNumber.set(true);
  }
  
  onEqualsClick(): void {
    this.calculate();
    this.operation.set(null);
    this.previousValue.set(null);
    this.newNumber.set(true);
  }
  
  onClearClick(): void {
    this.display.set('0');
    this.currentValue.set('0');
    this.previousValue.set(null);
    this.operation.set(null);
    this.newNumber.set(true);
  }
  
  onDecimalClick(): void {
    if (this.newNumber()) {
      this.display.set('0.');
      this.currentValue.set('0.');
      this.newNumber.set(false);
    } else if (!this.display().includes('.')) {
      this.display.update(d => d + '.');
      this.currentValue.update(d => d + '.');
    }
  }
  
  private calculate(): void {
    const prev = parseFloat(this.previousValue() || '0');
    const current = parseFloat(this.currentValue());
    const op = this.operation();
    
    let result = 0;
    switch (op) {
      case '+':
        result = prev + current;
        break;
      case '-':
        result = prev - current;
        break;
      case '×':
        result = prev * current;
        break;
      case '÷':
        result = current !== 0 ? prev / current : 0;
        break;
      default:
        return;
    }
    
    const resultStr = result.toString();
    this.display.set(resultStr);
    this.currentValue.set(resultStr);
  }
}
