# BrutalOS - AI Coding Instructions

You are an expert in TypeScript, Angular 20+, and neo-brutalist UI design. This project is a desktop OS simulator with draggable windows, particle effects, and localStorage persistence.

## Project Architecture

**Core Concept**: Virtual desktop environment where windows (notepad, calculator, todo) float on a pannable/zoomable canvas with animated particle effects.

**Key Components**:
- `DeskComponent`: Main canvas with mouse/touch panning, pinch-to-zoom, and wheel zoom (min: 0.5x, max: 2.0x)
- `BaseWindowComponent`: Abstract directive extended by all window components (notepad, calculator, todo, settings)
- Window system with drag-to-move, minimize/restore, z-index management, and particle emission on active windows

**Services Architecture**:
- `WindowService`: Global window registry, z-index stacking, minimize/restore state, active window tracking
- `DeskStateService`: Shared zoom level and desk surface element reference for coordinate calculations
- `ParticleService`: Canvas-based particle system with zoom-aware positioning, spawns from active window top edge
- `StorageService`: localStorage persistence for window positions, minimize state, and app-specific data
- `ThemeService`: Dark/light theme toggle with CSS custom properties

**Panning**: All panning logic (middle-click, pan mode toggle, cursor styles) is handled directly in `DeskComponent` via signals and methods. The `ControlsComponent` receives pan state and toggle method via inputs/outputs wired through the app component.

## Critical Patterns

### Window Component Pattern
All window components MUST extend `BaseWindowComponent` and implement:
```typescript
protected override windowId = 'unique-id';
protected override windowTitle = 'TITLE.EXT';
protected override storageKey = 'brutalos_keyname';
protected override getDefaultPosition(): { x: number; y: number } { }
protected override getParticleColor(): string { } // hex color
```

The base class automatically handles:
- Drag-to-move with zoom-aware positioning
- Window registration, z-index management, minimize/restore
- localStorage persistence (position + app state)
- Particle emission when window is active and visible
- Touch support for dragging

### State Management
- Use `signal()` for all reactive state
- Use `computed()` for derived state (e.g., `isActive()`, `zIndex()`)
- Use `effect()` for side effects like localStorage sync or particle system updates
- Use `update()` or `set()` on signals, NEVER `mutate()`

### Service Injection
Always use `inject()` function, never constructor injection:
```typescript
private windowService = inject(WindowService);
protected storageService = inject(StorageService);
```

### Coordinate System
- Window positions are in **unscaled desk coordinates** (px relative to desk surface)
- Mouse/touch events are in **viewport coordinates** (screen pixels)
- When dragging, divide deltas by `currentZoom` before applying to position
- Particle positions calculated relative to `containerBounds` with zoom compensation

### Particle System
- Particles spawn from top edge of active window
- Position updates tracked via `effect()` watching `x()` and `y()` signals
- Color per window: notepad=pink (#ff1493), calculator=yellow (#ff0), todo=cyan (#0ff), settings=limegreen
- Automatically starts/stops based on `isActive()` and `isMinimized()` computed signals

## TypeScript & Angular Best Practices

- Use standalone components (default in Angular 20+, do NOT set `standalone: true`)
- Use `changeDetection: ChangeDetectionStrategy.OnPush` on all components
- Use native control flow: `@if`, `@for`, `@switch` (never `*ngIf`, `*ngFor`, `*ngSwitch`)
- Use `inject()` instead of constructor injection
- Use `input()` and `output()` functions instead of decorators
- Use `viewChild()` for template queries instead of `@ViewChild`
- Use `host` object in `@Component` decorator instead of `@HostBinding`/`@HostListener`
- Use style/class bindings: `[style.cursor]="cursorStyle()"`, `[class.active]="isActive()"`
- Prefer type inference; avoid `any`, use `unknown` if type uncertain
- Do NOT use `setTimeout` - use `effect()` or `afterNextRender()` for timing

## Development Commands

```bash
npm start              # Dev server at localhost:4200
npm run build          # Production build to dist/
npm run build:ghpages  # Build for GitHub Pages deployment
npm test               # Run Karma tests
```

## Styling

- **Theme System**: CSS custom properties in `src/styles.css` with `[data-theme="dark"]` selector
- **Neo-Brutalist Design**: Bold borders (4px solid black), vibrant accent colors, `box-shadow: 8px 8px 0 rgba(0,0,0,0.3)`
- **Window Headers**: Bright backgrounds (#0ff, #ff0, #ff1493, limegreen) with black text and bold borders
- **Responsive**: Window positions center-calculated with `window.innerWidth/innerHeight` defaults

## Storage Keys
- Window positions: `brutalos_notepad`, `brutalos_calculator`, `brutalos_todo`, `brutalos_settings`
- App data embedded in same keys via `StorageService.save()`

## Testing Notes
- App uses zoneless change detection (`provideZonelessChangeDetection()`)
- Mock `WindowService`, `StorageService`, `ParticleService` in tests
- Test signal updates with `TestBed.flushEffects()`