# Auto-Scaling Coordinate System Specification

## ADDED Requirements

### Requirement: Dynamic Coordinate Scaling

The application SHALL automatically adjust the coordinate system scale to keep trajectories optimally framed within the canvas.

#### Scenario: Auto-scaling during animation
**Given** auto-scaling is enabled
**When** the animation plays
**Then** the coordinate system SHALL smoothly adjust to frame the trajectory
**And** the ball SHALL remain visible at all times
**And** the trajectory SHALL use most of the available canvas space
**And** adjustments SHALL be smooth (no jarring jumps)

#### Scenario: Tracking trajectory bounds
**Given** auto-scaling is enabled
**When** the animation plays
**Then** the system SHALL track:
  - Maximum x value (horizontal distance)
  - Maximum y value (peak height)
  - Minimum x value (typically 0)
  - Minimum y value (typically 0)
**And** bounds SHALL update in real-time as ball moves
**And** bounds SHALL include a margin factor (e.g., 15% padding)

#### Scenario: Smooth scale interpolation
**Given** the target scale changes
**When** the coordinate system updates
**Then** scale SHALL use linear interpolation (lerp)
**And** interpolation factor SHALL be 0.05 to 0.1 per frame
**And** transitions SHALL complete within 1-2 seconds
**And** no oscillation SHALL occur

### Requirement: Auto-Scaling Toggle and Controls

The application SHALL provide user control over auto-scaling behavior.

#### Scenario: Enable auto-scaling
**Given** auto-scaling is disabled
**When** the user enables the auto-scaling toggle
**Then** the coordinate system SHALL immediately start adjusting
**And** the toggle state SHALL persist for the session
**And** no other visualization features SHALL be affected

#### Scenario: Disable auto-scaling
**Given** auto-scaling is enabled
**When** the user disables the auto-scaling toggle
**Then** the coordinate system SHALL freeze at current scale
**And** scale SHALL remain constant until manually adjusted
**And** a manual zoom control MAY appear (optional)

#### Scenario: Manual scale override (optional)
**Given** auto-scaling is disabled
**When** the user wants to adjust scale manually
**Then** zoom controls SHALL be available (slider or buttons)
**And** scale factor SHALL be displayed
**And** adjustments SHALL be immediate
**And** re-enabling auto-scaling SHALL restore automatic behavior

### Requirement: Scale Factor Display

The application SHALL display current scale information to users.

#### Scenario: Scale factor indication
**Given** auto-scaling is enabled or manual mode is active
**When** viewing the canvas
**Then** current scale factor SHALL be displayed
**And** display SHALL show:
  - Horizontal scale: pixels per meter
  - Vertical scale: pixels per meter
**And** values SHALL update in real-time when auto-scaling
**And** display SHALL be unobtrusive but readable

#### Scenario: Coordinate grid adaptation
**Given** auto-scaling adjusts the scale
**When** the coordinate grid is displayed
**Then** grid lines SHALL adjust to new scale
**And** tick intervals SHALL remain reasonable (not too dense/sparse)
**And** axis labels SHALL remain legible
**And** grid SHALL maintain visual clarity

### Requirement: Multi-Trajectory Auto-Scaling

The application SHALL consider all trajectories when auto-scaling (if multi-trajectory feature is enabled).

#### Scenario: Scale for multiple trajectories
**Given** multiple trajectories are saved
**When** auto-scaling is enabled
**Then** the scale SHALL frame all trajectories
**And** the widest trajectory SHALL determine horizontal scale
**And** the highest trajectory SHALL determine vertical scale
**And** all trajectories SHALL be visible simultaneously

#### Scenario: Dynamic scale with trajectory comparison
**Given** the user adds a new trajectory
**When** the new trajectory exceeds current bounds
**Then** the scale SHALL adjust to include the new trajectory
**And** adjustment SHALL be smooth
**And** all trajectories SHALL remain visible
**And** previous trajectories SHALL not be cut off

### Requirement: Auto-Scaling Stability

The application SHALL maintain stable auto-scaling behavior without oscillation or jitter.

#### Scenario: Stable scale at rest
**Given** the animation is paused
**When** auto-scaling is enabled
**Then** the scale SHALL settle at the optimal value
**And** no continuous adjustments SHALL occur
**And** scale SHALL remain constant when parameters don't change

#### Scenario: Predictable scale on parameter change
**Given** the user changes a parameter (e.g., increases v0)
**When** the animation resets and plays
**Then** the scale SHALL predictably adjust to new trajectory size
**And** adjustment SHALL begin immediately
**And** final scale SHALL be appropriate for new parameters
**And** no over-shooting or under-shooting SHALL occur

#### Scenario: Oscillation prevention
**Given** the target scale is reached
**When** interpolation continues
**Then** the scale SHALL not oscillate around the target
**And** interpolation SHALL dampen as it approaches target
**And** once at target, scale SHALL stabilize
**And** no hunting behavior SHALL occur

### Requirement: Boundary Handling

The application SHALL handle edge cases where trajectories approach or exceed canvas boundaries.

#### Scenario: Trajectory near edge
**Given** the ball approaches the canvas edge
**When** auto-scaling is enabled
**Then** scale SHALL start adjusting before ball reaches edge
**And** adjustment SHALL be proactive (anticipatory)
**And** ball SHALL never visibly touch canvas edge
**And** margin SHALL be maintained

#### Scenario: Extreme parameters
**Given** the user sets extreme parameters (e.g., v0 = 50 m/s, h = 200 m)
**When** the animation plays
**Then** auto-scaling SHALL adjust to accommodate
**And** trajectory SHALL remain fully visible
**And** scale factor SHALL be reasonable (not too small)
**And** visualization SHALL remain useful

#### Scenario: Minimum scale limit
**Given** parameters are very small (e.g., v0 = 1 m/s, h = 10 m)
**When** auto-scaling adjusts
**Then** scale SHALL not become so large that trajectory is pixelated
**And** a minimum useful scale SHALL be maintained
**And** visualization SHALL remain clear

### Requirement: Performance Optimization

The application SHALL implement auto-scaling efficiently without degrading performance.

#### Scenario: Efficient bounds calculation
**Given** auto-scaling is enabled
**When** tracking trajectory bounds
**Then** calculations SHALL be optimized (O(1) per frame)
**And** no expensive searches SHALL be performed
**And** current maximum SHALL be tracked incrementally
**And** performance SHALL remain at 60fps

#### Scenario: Minimal redraw overhead
**Given** auto-scaling adjusts the scale
**When** the canvas is redrawn
**Then** coordinate transformation overhead SHALL be minimal
**And** all drawing functions SHALL use new scale efficiently
**And** no duplicate calculations SHALL occur
**And** frame time SHALL remain within budget

## MODIFIED Requirements

### Requirement: Coordinate Transformation

The application's coordinate transformation system SHALL support both fixed and dynamic scaling modes to accommodate different use cases.

**Before**: Coordinate transformation uses fixed scale based on initial parameters.

**After**: Coordinate transformation uses dynamic scale that adjusts smoothly during animation (when auto-scaling is enabled).

#### Scenario: Dynamic scale integration
**Given** auto-scaling is enabled
**When** converting physics coordinates to canvas coordinates
**Then** transformation SHALL use current scale values
**And** scale values SHALL update each frame (if needed)
**And** transformation SHALL remain accurate and consistent
**And** visual output SHALL remain smooth

#### Scenario: Manual scale mode
**Given** auto-scaling is disabled
**When** converting coordinates
**Then** transformation SHALL use fixed scale values
**And** scale SHALL only change with manual adjustment
**And** behavior SHALL match original implementation

## Cross-Reference

- Enhances: User experience (always optimally framed)
- Related to: Multi-Trajectory Comparison (scales for all trajectories)
- Related to: Vector Visualization (vectors scale with canvas)
- Related to: Stroboscopic Effect (markers scale with canvas)
- Related to: Environment Simulation (scales for different ranges)
- Improves: Visualization clarity and professionalism
