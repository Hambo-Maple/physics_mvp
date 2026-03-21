# Vector Visualization Specification

## ADDED Requirements

### Requirement: Real-Time Vector Decomposition Display

The application SHALL display animated velocity vectors decomposed into components to help users understand motion physics.

#### Scenario: Vector display during animation
**Given** vector visualization is enabled
**When** the animation is playing or paused
**Then** three vectors SHALL originate from the ball's center:
  - Resultant velocity (v) in dark color
  - Horizontal component (vx) in green
  - Vertical component (vy) in blue
**And** each vector SHALL have a properly proportioned arrowhead
**And** vector lengths SHALL be proportional to their magnitudes
**And** vectors SHALL update in real-time as the ball moves

#### Scenario: Vector scaling and visibility
**Given** the ball is moving at high velocity
**When** rendering vectors
**Then** vectors SHALL scale to remain visible but not dominate the canvas
**And** vectors SHALL remain proportional to each other
**And** arrowheads SHALL maintain consistent size regardless of vector length
**And** vectors SHALL remain clearly visible against canvas background

#### Scenario: Vector display at trajectory extremes
**Given** the ball is at key points (start, peak, landing)
**When** vectors are rendered
**Then** vectors SHALL accurately reflect physics at that point:
  - At peak: vy ≈ 0, only vx and v visible
  - At start: both vx and vy present (if θ > 0)
  - At landing: vy present, vx present
**And** vector directions SHALL align with motion direction

### Requirement: Vector Toggle Control

The application SHALL provide user control over vector visualization.

#### Scenario: Enable vector display
**Given** vector visualization is disabled
**When** the user enables the vector toggle
**Then** vectors SHALL immediately appear on the canvas
**And** the toggle state SHALL persist for the session
**And** no other visualization features SHALL be affected

#### Scenario: Disable vector display
**Given** vector visualization is enabled
**When** the user disables the vector toggle
**Then** vectors SHALL immediately disappear from the canvas
**And** all other animations SHALL continue normally
**And** performance SHALL improve (if vectors were causing overhead)

### Requirement: Vector Rendering Quality

The application SHALL render vectors with high visual quality and smooth animation.

#### Scenario: Smooth vector animation
**Given** the animation is playing
**When** the ball's velocity changes between frames
**Then** vector lengths SHALL update smoothly
**And** arrow positions SHALL follow ball position accurately
**And** no flickering or visual artifacts SHALL appear
**And** frame rate SHALL remain at 60fps

#### Scenario: Vector arrowhead rendering
**Given** vectors are displayed
**When** rendering arrowheads
**Then** arrowheads SHALL have proper geometry (triangular)
**And** arrowhead size SHALL be proportional to vector scale
**And** arrowheads SHALL point in the direction of the vector
**And** arrowhead color SHALL match vector shaft color

#### Scenario: Vector color coding
**Given** vectors are displayed
**When** viewing multiple vectors simultaneously
**Then** each vector type SHALL have a distinct color:
  - Resultant velocity (v): dark color (e.g., #333)
  - Horizontal component (vx): green (e.g., #00AA00)
  - Vertical component (vy): blue (e.g., #0066CC)
**And** colors SHALL be color-blind friendly where possible
**And** colors SHALL maintain sufficient contrast with background

### Requirement: Vector Information Display

The application SHALL provide quantitative information about vectors in tooltips and displays.

#### Scenario: Tooltip shows vector components
**Given** the user hovers over the ball
**When** vector visualization is enabled
**Then** the tooltip SHALL include:
  - Resultant velocity magnitude: v = [value] m/s
  - Horizontal component: vx = [value] m/s
  - Vertical component: vy = [value] m/s
**And** values SHALL update in real-time during animation
**And** values SHALL be formatted to 2 decimal places

#### Scenario: Formula display includes vector equations
**Given** vector visualization is enabled
**When** the formula display is visible
**Then** vector decomposition equations SHALL be displayed:
  - v = √(vx² + vy²)
  - vx = v₀ · cos(θ)
  - vy = v₀ · sin(θ) - g·t
**And** equations SHALL be rendered using KaTeX
**And** current values SHALL be shown below equations

## Cross-Reference

- Extends: Physics calculations (requires vx, vy in real-time)
- Enhances: Educational value of visualization
- Related to: Energy Visualization (vectors help explain energy changes)
- Related to: Stroboscopic Effect (vectors at marker positions)
- Related to: Auto-Scaling (vectors scale with canvas)
