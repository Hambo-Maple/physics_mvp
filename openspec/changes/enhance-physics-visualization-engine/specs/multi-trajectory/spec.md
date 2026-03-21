# Multi-Trajectory Comparison Specification

## ADDED Requirements

### Requirement: Trajectory History Storage

The application SHALL allow users to save and compare multiple projectile motion trajectories.

#### Scenario: Save current trajectory
**Given** an animation has completed or is paused
**When** the user clicks the "Save" button
**Then** the current trajectory SHALL be saved to history
**And** the trajectory SHALL include all position points (x, y, t)
**And** the trajectory SHALL be assigned a unique color
**And** a success notification SHALL appear
**And** the saved trajectory count SHALL increment

#### Scenario: Multiple trajectory storage
**Given** the user has saved multiple trajectories
**When** viewing trajectory history
**Then** each trajectory SHALL be stored independently
**And** each trajectory SHALL retain its original parameters (v0, g, h, θ, mass)
**And** trajectories SHALL be stored in memory (client-side only)
**And** maximum storage capacity SHALL be at least 20 trajectories

#### Scenario: Trajectory data structure
**Given** a trajectory is saved
**When** examining the trajectory data
**Then** the data SHALL include:
  - Unique identifier
  - Parameter set (v0, g, h, θ, mass)
  - Array of position points {x, y, t}
  - Timestamp of save
  - Assigned color
**And** data SHALL be sufficient for complete trajectory reconstruction

### Requirement: Historical Trajectory Rendering

The application SHALL render saved trajectories for visual comparison.

#### Scenario: Render saved trajectories
**Given** one or more trajectories are saved
**When** the canvas is redrawn
**Then** saved trajectories SHALL be rendered on the canvas
**And** each trajectory SHALL use a distinct color
**And** trajectories SHALL be rendered with reduced opacity (20-40%)
**And** trajectories SHALL use dashed line style for distinction
**And** the current (active) trajectory SHALL be rendered normally (solid, full opacity)

#### Scenario: Visual differentiation of trajectories
**Given** multiple trajectories are saved
**When** viewing the canvas
**Then** each saved trajectory SHALL have a unique color
**And** colors SHALL be visually distinct from each other
**And** colors SHALL be color-blind friendly where possible
**And** the active trajectory SHALL be the most prominent visually

#### Scenario: Trajectory rendering performance
**Given** 10 trajectories are saved and displayed
**When** the canvas is redrawn at 60fps
**Then** all trajectories SHALL render within the frame budget
**And** no frame drops SHALL occur
**And** rendering time SHALL scale linearly with trajectory count
**And** performance SHALL remain acceptable with maximum trajectories

### Requirement: Trajectory Management Controls

The application SHALL provide controls for managing saved trajectories.

#### Scenario: Clear all trajectories
**Given** one or more trajectories are saved
**When** the user clicks "Clear History"
**Then** all saved trajectories SHALL be removed
**And** the canvas SHALL only show the active trajectory
**And** the saved trajectory count SHALL reset to zero
**And** a confirmation dialog MAY appear (optional)

#### Scenario: Delete individual trajectory
**Given** multiple trajectories are saved
**When** the user deletes a specific trajectory
**Then** only that trajectory SHALL be removed
**And** other trajectories SHALL remain
**And** the canvas SHALL update immediately
**And** the trajectory count SHALL decrement

#### Scenario: Trajectory count display
**Given** trajectories are saved
**When** viewing the control panel
**Then** the number of saved trajectories SHALL be displayed
**And** the count SHALL update in real-time
**And** the display SHALL show "X trajectories saved" or similar

### Requirement: Trajectory Comparison Features

The application SHALL provide features to facilitate trajectory comparison.

#### Scenario: Parameter display for saved trajectories
**Given** multiple trajectories are saved
**When** the user hovers over a saved trajectory
**Then** a tooltip SHALL display:
  - Initial parameters (v0, g, h, θ, mass)
  - Trajectory color indicator
  - Save timestamp
**And** the tooltip SHALL appear near the trajectory

#### Scenario: Key point comparison
**Given** multiple trajectories are saved
**When** viewing key points (start, peak, landing)
**Then** key points for each trajectory SHALL be marked
**And** markers SHALL use the same color as the trajectory
**And** markers SHALL be visually distinct from each other
**And** comparison SHALL be intuitive (e.g., landing distances side-by-side)

#### Scenario: Export trajectory data (optional enhancement)
**Given** one or more trajectories are saved
**When** the user clicks "Export"
**Then** trajectory data SHALL be exported in a usable format (JSON, CSV)
**And** the file SHALL contain all trajectory information
**And** the download SHALL trigger automatically

### Requirement: Trajectory Color Assignment

The application SHALL assign colors to trajectories automatically.

#### Scenario: Automatic color assignment
**Given** a trajectory is saved
**When** assigning a color
**Then** the application SHALL select a color from a predefined palette
**And** the color SHALL be different from existing trajectories
**And** colors SHALL cycle through the palette when exhausted
**And** the palette SHALL contain at least 10 distinct colors

#### Scenario: Custom color selection (optional)
**Given** a trajectory is saved
**When** the user wants to change the color
**Then** a color picker SHALL be available
**And** the user MAY select a custom color
**And** the trajectory SHALL update with the new color
**And** the preference SHALL be saved

## MODIFIED Requirements

### Requirement: Animation Completion Behavior

The application's animation completion behavior SHALL be enhanced to promote trajectory saving and comparison features.

**Before**: Animation simply stops when the ball lands.

**After**: When animation completes, a "Save" button becomes prominent, encouraging users to save interesting trajectories for comparison.

#### Scenario: Post-animation save prompt
**Given** the animation has completed (ball landed)
**When** the animation stops
**Then** the "Save" button SHALL highlight or pulse
**And** the button SHALL be easily accessible
**And** the button SHALL show its current state (Save/Cancel)

## Cross-Reference

- Enhances: Educational value (comparative analysis)
- Related to: Environment Simulation (compare different gravity/drag settings)
- Related to: Auto-Scaling (canvas adjusts for all trajectories)
- Related to: Stroboscopic Effect (markers on saved trajectories)
- Enables: Experimental validation and parameter exploration
