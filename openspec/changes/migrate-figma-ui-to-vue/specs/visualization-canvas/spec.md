# Visualization Canvas Specification

## MODIFIED Requirements

### Requirement: Visualization Canvas Layout
The system SHALL display a visualization canvas in the right pane using modern UI components from shadcn-vue.

#### Scenario: Container structure
- **WHEN** the VisualCanvas component renders
- **THEN** it uses a Card component or div as the main container
- **AND** the container has full height (h-full)
- **AND** the container uses flex column layout (flex flex-col)
- **AND** the container has appropriate background (bg-background or bg-card)

#### Scenario: Status bar
- **WHEN** the visualization area displays
- **THEN** it shows a status bar at the top
- **AND** the status bar uses CardHeader or div with border-b
- **AND** the status bar displays current mode text
- **AND** the status bar has consistent padding (p-4)
- **AND** the status bar has muted background (bg-muted/50 or similar)

#### Scenario: Canvas area
- **WHEN** the canvas renders
- **THEN** it occupies the flex-1 space (fills available height)
- **AND** it has centered content when empty (flex items-center justify-center)
- **AND** it has appropriate padding (p-4 or p-6)
- **AND** it provides a mount point for p5.js or visualization libraries

#### Scenario: Control area
- **WHEN** controls are displayed
- **THEN** they appear in a CardFooter or div with border-t
- **AND** they use Button components from shadcn-vue
- **AND** they have consistent spacing (gap-2 or gap-4)
- **AND** they have consistent padding (p-4)

### Requirement: Projectile Motion Visualization
The system SHALL display the projectile motion visualization with modern styling while preserving all p5.js logic.

#### Scenario: Visualization container
- **WHEN** ProjectileMotion component renders
- **THEN** it uses a Card or div container with full dimensions
- **AND** the container has appropriate background (bg-background)
- **AND** the container has rounded corners (rounded-lg)
- **AND** the p5.js canvas is mounted inside the container

#### Scenario: Control panel styling
- **WHEN** the control panel renders
- **THEN** it uses Card or div with border
- **AND** it has muted background (bg-muted/30 or bg-card)
- **AND** it has padding (p-4)
- **AND** it has rounded corners (rounded-lg)
- **AND** it uses Separator components between sections

#### Scenario: Control buttons
- **WHEN** control buttons render (play, pause, reset, step)
- **THEN** they use Button components from shadcn-vue
- **AND** they have appropriate variants (default, outline, secondary)
- **AND** they have consistent sizing (size="sm" or size="default")
- **AND** they have icons from lucide-vue-next (Play, Pause, RotateCcw, SkipForward)
- **AND** they have proper spacing (gap-2)

#### Scenario: Parameter display
- **WHEN** parameters are displayed (v0, g, h, theta)
- **THEN** they use consistent typography (text-sm, font-medium)
- **AND** they use muted color for labels (text-muted-foreground)
- **AND** they use foreground color for values (text-foreground)
- **AND** they have proper spacing (space-y-2)

#### Scenario: Animation preservation
- **WHEN** the visualization runs
- **THEN** all p5.js animation logic remains unchanged
- **AND** the canvas size adapts to container dimensions
- **AND** the frame rate and physics calculations are preserved
- **AND** the trajectory rendering is preserved

### Requirement: Empty State Display
The system SHALL display a placeholder when no visualization is active.

#### Scenario: Placeholder content
- **WHEN** no visualization type is selected
- **THEN** a placeholder message is displayed
- **AND** the message is centered (flex items-center justify-center)
- **AND** the message uses muted color (text-muted-foreground)
- **AND** the message uses appropriate text size (text-lg or text-xl)
- **AND** the message may include an icon from lucide-vue-next

#### Scenario: Reset button
- **WHEN** the reset button is displayed
- **THEN** it uses Button component with outline or secondary variant
- **AND** it displays "重置画布" text
- **AND** it has an icon (RotateCcw from lucide-vue-next)
- **AND** it clears the current visualization when clicked

### Requirement: Visualization State Management
The system SHALL maintain visualization state and respond to updates from the chat interface.

#### Scenario: Visualization type switching
- **WHEN** currentVisualType changes to 'PROJECTILE'
- **THEN** the ProjectileMotion component is rendered
- **AND** the status bar updates to "当前模式 - 平抛运动"
- **AND** the empty state is hidden
- **AND** the transition is smooth

#### Scenario: Parameter updates
- **WHEN** projectile parameters are updated from chat
- **THEN** the ProjectileMotion component receives new props
- **AND** the visualization updates immediately
- **AND** the animation restarts with new parameters
- **AND** the control panel displays updated values

#### Scenario: Component reference exposure
- **WHEN** the parent component needs to control the canvas
- **THEN** VisualCanvas exposes updateCanvas method via defineExpose
- **AND** VisualCanvas exposes projectileMotionRef via defineExpose
- **AND** the parent can call methods on ProjectileMotion through the ref

### Requirement: Responsive Canvas Sizing
The system SHALL ensure the visualization canvas adapts to the available space.

#### Scenario: Canvas dimensions
- **WHEN** the canvas is rendered
- **THEN** it fills the available width and height
- **AND** it maintains aspect ratio if needed
- **AND** it responds to window resize events
- **AND** p5.js canvas is resized accordingly

#### Scenario: Control panel positioning
- **WHEN** the control panel is displayed
- **THEN** it is positioned appropriately (absolute or relative)
- **AND** it doesn't overlap critical visualization content
- **AND** it has semi-transparent background if overlaying (bg-background/80 backdrop-blur)
- **AND** it has proper z-index (z-10 or z-20)

### Requirement: Visual Consistency
The system SHALL maintain consistent styling with the chat interface.

#### Scenario: Color scheme
- **WHEN** the visualization area renders
- **THEN** it uses the same color tokens as chat interface
- **AND** backgrounds use bg-background or bg-card
- **AND** text uses text-foreground or text-muted-foreground
- **AND** borders use border-border

#### Scenario: Typography
- **WHEN** text is displayed in the visualization area
- **THEN** it uses consistent font sizes (text-sm, text-base, text-lg)
- **AND** it uses consistent font weights (font-normal, font-medium)
- **AND** it uses consistent line heights

#### Scenario: Spacing
- **WHEN** elements are laid out
- **THEN** they use consistent spacing scale (p-2, p-4, gap-2, gap-4)
- **AND** they align with the overall design system
- **AND** they maintain visual hierarchy

### Requirement: Accessibility
The system SHALL ensure the visualization area is accessible.

#### Scenario: Keyboard controls
- **WHEN** a user navigates with keyboard
- **THEN** all control buttons are focusable
- **AND** focus indicators are visible
- **AND** keyboard shortcuts work (Space for play/pause, R for reset, etc.)

#### Scenario: Screen reader support
- **WHEN** a screen reader is used
- **THEN** the current visualization mode is announced
- **AND** control buttons have descriptive labels
- **AND** parameter values are announced when changed
- **AND** the canvas has an appropriate aria-label

#### Scenario: Visual feedback
- **WHEN** controls are interacted with
- **THEN** visual feedback is provided (hover, active states)
- **AND** disabled states are clearly indicated
- **AND** loading states are shown when applicable
