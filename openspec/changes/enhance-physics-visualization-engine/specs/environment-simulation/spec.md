# Environment Simulation Specification

## ADDED Requirements

### Requirement: Planetary Gravity Presets

The application SHALL provide presets for different gravitational environments (Earth, Moon, Mars).

#### Scenario: Earth gravity preset
**Given** the environment mode is set to "Earth"
**When** the preset is applied
**Then** gravity SHALL be set to 9.8 m/s²
**And** air resistance SHALL be disabled
**And** canvas background SHALL be Earth-like (e.g., light blue)
**And** the preset SHALL be indicated in the UI

#### Scenario: Moon gravity preset
**Given** the environment mode is set to "Moon"
**When** the preset is applied
**Then** gravity SHALL be set to 1.6 m/s²
**And** air resistance SHALL be disabled
**And** canvas background SHALL be Moon-like (e.g., gray)
**And** the preset SHALL be indicated in the UI

#### Scenario: Mars gravity preset
**Given** the environment mode is set to "Mars"
**When** the preset is applied
**Then** gravity SHALL be set to 3.7 m/s²
**And** air resistance SHALL be disabled
**And** canvas background SHALL be Mars-like (e.g., reddish-orange)
**And** the preset SHALL be indicated in the UI

#### Scenario: Custom environment mode
**Given** the environment mode is set to "Custom"
**When** the mode is active
**Then** gravity MAY be adjusted manually
**And** air resistance MAY be enabled/disabled
**And** drag coefficient MAY be adjusted
**And** canvas background SHALL be neutral (e.g., default gray)

### Requirement: Air Resistance Simulation

The application SHALL simulate linear air resistance (drag) when enabled.

#### Scenario: Enable air resistance
**Given** air resistance is disabled
**When** the user enables air resistance
**Then** drag force SHALL be calculated as: F_drag = -k · v
**And** drag SHALL apply opposite to velocity direction
**And** horizontal and vertical components SHALL be affected
**And** trajectory SHALL deviate from ideal parabola

#### Scenario: Drag coefficient adjustment
**Given** air resistance is enabled
**When** the user adjusts the drag coefficient (k)
**Then** drag force SHALL update proportionally
**And** higher k values SHALL cause greater trajectory deviation
**And** k values SHALL be bounded (e.g., 0.0 to 1.0)
**And** the current k value SHALL be displayed

#### Scenario: Physics accuracy with drag
**Given** air resistance is enabled
**When** the animation plays
**Then** numerical integration SHALL be used (e.g., Euler method)
**And** position updates SHALL account for drag acceleration:
  - a_x = -(k · v_x) / m
  - a_y = -g - (k · v_y) / m
**And** energy SHALL NOT be conserved (shall decrease over time)
**And** landing distance SHALL be less than without drag

#### Scenario: Drag force visualization
**Given** air resistance is enabled
**When** vector visualization is also enabled
**Then** a drag force vector MAY be displayed
**And** the vector SHALL point opposite to velocity
**And** vector length SHALL be proportional to drag magnitude
**And** vector SHALL be clearly distinguishable from velocity vectors

### Requirement: Environment Mode Selection

The application SHALL provide UI controls for selecting and switching environment modes.

#### Scenario: Environment mode selector
**Given** the user views the control panel
**When** the environment mode selector is displayed
**Then** options SHALL include: Earth, Moon, Mars, Custom
**And** selection SHALL be made via dropdown or radio buttons
**And** the current mode SHALL be clearly indicated
**And** switching modes SHALL be immediate

#### Scenario: Mode switching behavior
**Given** the user switches environment modes
**When** the new mode is applied
**Then** the animation SHALL reset to initial state
**And** gravity parameter SHALL update
**And** background color SHALL change
**And** air resistance SHALL apply per mode settings
**And** all trajectories SHALL be cleared (optional, based on UX decision)

#### Scenario: Air resistance toggle
**Given** the environment mode is Custom (or allows modification)
**When** the user toggles air resistance
**Then** the toggle state SHALL immediately apply
**And** drag coefficient control SHALL appear/disappear
**And** animation SHALL reset if currently playing
**And** current state SHALL be clearly indicated

### Requirement: Environmental Information Display

The application SHALL display environmental parameters and their effects.

#### Scenario: Environment parameter display
**Given** an environment mode is selected
**When** viewing the formula display/dashboard
**Then** current environmental parameters SHALL be shown:
  - Gravity: g = [value] m/s²
  - Air resistance: [Enabled/Disabled]
  - Drag coefficient: k = [value] (if enabled)
**And** environment name SHALL be displayed
**And** parameters SHALL update when mode changes

#### Scenario: Environmental effects in tooltip
**Given** the user hovers over the ball
**When** air resistance is enabled
**Then** the tooltip SHALL include:
  - Drag force: F_drag = [value] N
  - Acceleration due to drag: a_drag = [value] m/s²
**And** values SHALL update in real-time
**And** total energy SHALL show decrease (if not already displayed)

#### Scenario: Educational information
**Given** an environment preset is selected
**When** the user wants to learn about the environment
**Then** brief educational information MAY be displayed:
  - Earth: "Standard gravity (9.8 m/s²)"
  - Moon: "Lunar gravity (1.6 m/s², ~1/6 Earth)"
  - Mars: "Martian gravity (3.7 m/s², ~38% Earth)"
**And** information SHALL be concise and accurate

### Requirement: Background Color Coordination

The application SHALL coordinate canvas background color with environment selection.

#### Scenario: Background color per environment
**Given** an environment mode is selected
**When** the background color is applied
**Then** colors SHALL be:
  - Earth: light blue (#E6F3FF or similar)
  - Moon: light gray (#E0E0E0 or similar)
  - Mars: light reddish-orange (#FFE6D6 or similar)
  - Custom: default gray (#F5F5F5)
**And** colors SHALL not interfere with trajectory visibility
**And** colors SHALL provide adequate contrast

#### Scenario: Smooth color transitions
**Given** the user switches environment modes
**When** the background color changes
**Then** the transition SHALL be smooth (CSS transition or p5.js lerp)
**And** transition duration SHALL be approximately 0.5 seconds
**And** no visual artifacts SHALL appear during transition

## MODIFIED Requirements

### Requirement: Gravity Parameter Control

The application's gravity parameter SHALL support multiple values through environment presets while maintaining backward compatibility with the default Earth gravity.

**Before**: Gravity is always 9.8 m/s² (Earth standard).

**After**: Gravity defaults to 9.8 m/s² but can be changed via environment presets or manual adjustment in Custom mode.

#### Scenario: Manual gravity adjustment
**Given** the environment mode is Custom
**When** the user manually adjusts gravity
**Then** gravity slider/input SHALL be enabled
**And** range SHALL be 0.1 to 25.0 m/s²
**And** value SHALL update immediately
**And** animation SHALL reset if playing

### Requirement: Physics Calculations

The application's physics engine SHALL support both analytical solutions (ideal motion) and numerical integration (with air resistance) depending on environment settings.

**Before**: Physics calculations assume ideal projectile motion (no air resistance).

**After**: Physics calculations account for air resistance when enabled, using numerical integration.

#### Scenario: Calculation mode selection
**Given** the animation is about to play
**When** air resistance is disabled
**Then** analytical solutions SHALL be used (faster, exact)
**When** air resistance is enabled
**Then** numerical integration SHALL be used (Euler or Runge-Kutta)
**And** time step SHALL be small enough for accuracy (dt ≤ 0.01s)
**And** calculations SHALL remain performant

## Cross-Reference

- Enhances: Realism and educational value
- Related to: Energy Visualization (drag affects energy conservation)
- Related to: Multi-Trajectory Comparison (compare different environments)
- Related to: Vector Visualization (drag force vector)
- Modifies: Physics calculations (conditional drag)
