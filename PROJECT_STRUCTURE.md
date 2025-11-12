# BrutalOS

A brutalist-themed Angular SPA featuring a top-down desk view with mouse-based panning and an interactive notepad.

## Project Structure

```
src/
├── app/
│   ├── components/             # Feature components
│   │   ├── desk/               # Desk component with panning functionality
│   │   │   ├── desk.component.ts
│   │   │   ├── desk.component.html
│   │   │   └── desk.component.css
│   │   ├── notepad/            # Notepad component
│   │   │   ├── notepad.component.ts
│   │   │   ├── notepad.component.html
│   │   │   └── notepad.component.css
│   │   └── index.ts            # Barrel export for components
│   ├── core/                   # Core services and utilities (reserved for future use)
│   ├── app.ts                  # Root component
│   ├── app.html                # Root template
│   ├── app.css                 # Root styles
│   └── app.config.ts           # Application configuration
├── styles.css                  # Global styles
└── main.ts                     # Application bootstrap

```

## Architecture

### Components

#### Root Component (`app.ts`)
- Entry point of the application
- Hosts the desk component and instructions overlay
- Minimal logic - delegates functionality to feature components

#### Desk Component (`components/desk/`)
- Manages the virtual desk surface and panning behavior
- Implements edge-based mouse panning with percentage thresholds (15% of viewport)
- Hosts the notepad and any future desk items
- Uses signals for reactive state management

#### Notepad Component (`components/notepad/`)
- Self-contained notepad with character counter
- Uses host bindings for focus state styling
- Brutalist UI design with terminal-like aesthetics

## Features

- **Mouse-Based Panning**: Move mouse to screen edges (15% threshold) to pan the desk
- **Responsive Panning Speed**: Panning speed increases proportionally with distance from edge
- **Interactive Notepad**: Click to type, with real-time character count
- **Brutalist Design**: Terminal-inspired color scheme with bold borders and shadows
- **Standalone Components**: Modern Angular architecture without NgModules
- **Signal-Based State**: Uses Angular signals for reactive state management

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Technologies

- Angular 20.3.0 (latest)
- TypeScript 5.9.2
- Standalone components
- Zoneless change detection
- Signal-based state management
