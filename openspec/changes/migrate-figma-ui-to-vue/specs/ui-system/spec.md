# UI System Specification

## ADDED Requirements

### Requirement: Tailwind CSS Integration
The system SHALL use Tailwind CSS as the primary styling solution, replacing all hand-written CSS files.

#### Scenario: Tailwind configuration
- **WHEN** the project is built
- **THEN** Tailwind CSS processes all utility classes
- **AND** unused styles are tree-shaken from the bundle
- **AND** CSS variables from theme.css are accessible via Tailwind utilities

#### Scenario: Design token usage
- **WHEN** a component needs styling
- **THEN** it uses Tailwind utility classes (e.g., `bg-primary`, `text-foreground`)
- **AND** colors reference CSS variables defined in theme.css
- **AND** spacing, border-radius, and typography follow Tailwind's design system

### Requirement: shadcn-vue Component Library
The system SHALL integrate shadcn-vue components for all UI elements, providing a consistent and accessible design system.

#### Scenario: Component availability
- **WHEN** a developer needs a UI component
- **THEN** they can import it from `@/components/ui/`
- **AND** the component is based on Radix Vue primitives
- **AND** the component supports Tailwind CSS customization

#### Scenario: Button component usage
- **WHEN** a button is needed in the interface
- **THEN** the Button component from shadcn-vue is used
- **AND** it supports variants (default, destructive, outline, secondary, ghost, link)
- **AND** it supports sizes (default, sm, lg, icon)
- **AND** it handles disabled states automatically

#### Scenario: ScrollArea component usage
- **WHEN** a scrollable container is needed
- **THEN** the ScrollArea component from shadcn-vue is used
- **AND** it provides custom scrollbar styling
- **AND** it maintains smooth scrolling behavior

#### Scenario: Card component usage
- **WHEN** a content container is needed
- **THEN** the Card component from shadcn-vue is used
- **AND** it provides consistent padding, borders, and shadows
- **AND** it supports CardHeader, CardContent, and CardFooter sub-components

### Requirement: Design System Consistency
The system SHALL maintain visual consistency across all components using a centralized design token system.

#### Scenario: Color system
- **WHEN** any component needs colors
- **THEN** it uses CSS variables defined in theme.css
- **AND** colors include: background, foreground, primary, secondary, muted, accent, destructive, border, input, ring
- **AND** each color has a corresponding foreground color for text contrast

#### Scenario: Typography system
- **WHEN** text is displayed
- **THEN** it uses consistent font sizes (text-sm, text-base, text-lg, text-xl, text-2xl)
- **AND** it uses consistent font weights (font-normal: 400, font-medium: 500)
- **AND** it uses consistent line heights (1.5 for body text)

#### Scenario: Spacing system
- **WHEN** components need spacing
- **THEN** they use Tailwind's spacing scale (p-2, p-4, p-6, gap-2, gap-4, etc.)
- **AND** spacing is consistent across similar UI patterns

#### Scenario: Border radius system
- **WHEN** components need rounded corners
- **THEN** they use the radius token (--radius: 0.625rem)
- **AND** variants include: rounded-sm, rounded-md, rounded-lg, rounded-xl

### Requirement: Responsive Layout System
The system SHALL use Tailwind Flexbox utilities to implement the dual-pane layout.

#### Scenario: Main layout structure
- **WHEN** the application loads
- **THEN** the layout displays as a horizontal flex container
- **AND** the container has 100vh height with overflow hidden
- **AND** the left pane (ChatBox) occupies 30% width
- **AND** the right pane (VisualCanvas) occupies 70% width
- **AND** a vertical border separates the two panes

#### Scenario: Layout classes
- **WHEN** the App.vue component renders
- **THEN** it uses `flex h-screen overflow-hidden` on the container
- **AND** it uses `w-[30%] border-r border-border` on the left pane
- **AND** it uses `flex-1` on the right pane

### Requirement: Component Utility Functions
The system SHALL provide utility functions for component styling and class management.

#### Scenario: cn utility function
- **WHEN** a component needs to merge Tailwind classes
- **THEN** it uses the `cn()` utility function
- **AND** the function merges classes using tailwind-merge
- **AND** the function handles conditional classes using clsx
- **AND** later classes override earlier conflicting classes

#### Scenario: Variant management
- **WHEN** a component supports multiple variants
- **THEN** it uses class-variance-authority (cva) for variant definitions
- **AND** variants are type-safe with TypeScript/JSDoc
- **AND** default variants are clearly specified

### Requirement: Accessibility Support
The system SHALL ensure all UI components meet basic accessibility standards through Radix Vue primitives.

#### Scenario: Keyboard navigation
- **WHEN** a user navigates with keyboard
- **THEN** all interactive elements are focusable
- **AND** focus indicators are visible (ring-2 ring-ring)
- **AND** tab order is logical

#### Scenario: ARIA attributes
- **WHEN** a component renders
- **THEN** appropriate ARIA attributes are automatically applied by Radix Vue
- **AND** screen readers can interpret the component's purpose
- **AND** state changes are announced appropriately

### Requirement: Theme Configuration
The system SHALL support theme customization through CSS variables defined in theme.css.

#### Scenario: Light theme
- **WHEN** the application loads in light mode
- **THEN** CSS variables use light theme values
- **AND** background is white (#ffffff)
- **AND** foreground is dark (oklch(0.145 0 0))
- **AND** primary is dark (#030213)

#### Scenario: Dark theme support (future)
- **WHEN** dark mode is enabled (future feature)
- **THEN** CSS variables switch to dark theme values
- **AND** the .dark class is applied to the root element
- **AND** all components automatically adapt to dark colors

### Requirement: Icon System
The system SHALL use lucide-vue-next for all icons, providing consistent iconography.

#### Scenario: Icon usage
- **WHEN** an icon is needed
- **THEN** it is imported from lucide-vue-next
- **AND** it uses consistent sizing (w-4 h-4 for small, w-5 h-5 for medium)
- **AND** it inherits text color from parent

#### Scenario: Icon in buttons
- **WHEN** a button contains an icon
- **THEN** the icon is properly aligned with text
- **AND** spacing is handled by the Button component's gap utility
