# Design Document: Physics Visualization Enhancement

## Architecture Overview

This enhancement maintains the existing Vue 3 + p5.js architecture while extending the rendering pipeline and state management system. The design prioritizes performance, maintainability, and user experience.

## System Architecture

### Component Structure

```
App.vue
├── ChatBox.vue (enhanced with glassmorphism)
│   └── Message display (16px typography)
│
└── VisualCanvas.vue
    └── ProjectileMotion.vue (extended)
        ├── ParameterControls (glassmorphism + new toggles)
        ├── p5.js Canvas (enhanced rendering)
        ├── AnimationControls (new environment selector)
        ├── FormulaDisplay (transformed into Dashboard)
        └── Tooltip (extended with energy info)
```

### State Management Extension

```javascript
// New state additions to store/index.js
const state = reactive({
  // ... existing state

  // Visualization toggles
  showVectors: false,
  showEnergy: false,
  showStroboscopic: false,
  autoScaling: true,

  // Environment
  environmentMode: 'earth', // 'earth' | 'moon' | 'mars' | 'custom'
  airResistanceEnabled: false,
  dragCoefficient: 0.1,

  // Multi-trajectory
  trajectoryHistory: [],

  // Stroboscopic
  stroboscopicInterval: 10, // frames
  stroboscopicMarkers: []
});
```

## Key Design Decisions

### 1. Rendering Pipeline Architecture

**Decision**: Extend existing p5.js draw loop rather than creating separate renderers

**Rationale**:
- Maintains single source of truth for physics state
- Simplifies synchronization between animations
- Reduces memory overhead
- Easier to debug and maintain

**Trade-offs**:
- Larger draw loop function (mitigated by helper functions)
- Single responsibility principle less strict (acceptable for this scale)

### 2. Vector Visualization Approach

**Decision**: Draw vectors directly on main canvas using p5.js primitives

**Rationale**:
- Native p5.js performance (60fps)
- Consistent coordinate system with trajectory
- Easy to scale and position relative to ball
- No additional library dependencies

**Alternatives considered**:
- SVG overlay: More complex positioning, sync issues
- Canvas layer: Additional overhead, complexity

### 3. Energy Visualization Strategy

**Decision**: Vertical bars on canvas side, not separate chart

**Rationale**:
- Direct visual correlation with ball position
- Immediate feedback during animation
- Simpler implementation
- Better performance (no DOM manipulation)

**Trade-offs**:
- Less precise than separate chart (acceptable for educational visualization)
- Canvas space consumption (mitigated by compact design)

### 4. Multi-Trajectory Storage

**Decision**: Store full trajectory arrays in component memory

**Rationale**:
- Fast rendering (no recalculation)
- Simple implementation
- Sufficient memory (typical use: < 10 trajectories)
- Easy to export/clear

**Memory considerations**:
- Each trajectory: ~1000 points × 3 floats (x, y, t) = ~12KB
- 10 trajectories: ~120KB (negligible)

**Alternatives considered**:
- Store only key points: Loss of detail
- Re-calculate on render: Performance penalty
- IndexedDB: Overkill for this use case

### 5. Environment Simulation Implementation

**Decision**: Modify physics calculations in-place with conditional drag

**Rationale**:
- Maintains existing API structure
- Minimal code changes
- Easy to toggle drag on/off
- Preserves analytical solutions when drag is off

**Physics model**:
```javascript
// When drag is enabled: F_drag = -k * v
// When drag is disabled: standard projectile motion
if (dragEnabled) {
  ax = -(k * vx) / m;
  ay = -g - (k * vy) / m;
} else {
  ax = 0;
  ay = -g;
}
```

**Trade-offs**:
- Numerical integration required when drag is on (Euler method)
- Slight performance penalty (acceptable)

### 6. Auto-Scaling Algorithm

**Decision**: Use p5.js lerp() for smooth interpolation

**Rationale**:
- Prevents jarring visual jumps
- Native p5.js function
- Configurable smoothing factor
- Computationally inexpensive

**Algorithm**:
```javascript
// Track max extents
currentMaxX = lerp(currentMaxX, targetMaxX, 0.05);
currentMaxY = lerp(currentMaxY, targetMaxY, 0.05);

// Update scale
scaleX = availableWidth / currentMaxX;
scaleY = availableHeight / currentMaxY;
```

**Trade-offs**:
- Slight delay in reaching optimal scale (acceptable for smoothness)
- May undershoot on rapid parameter changes (acceptable)

### 7. Glassmorphism Implementation

**Decision**: CSS backdrop-filter with Tailwind utilities

**Rationale**:
- Modern CSS feature with good browser support
- Hardware accelerated performance
- Maintains layout compatibility
- Easy to implement with Tailwind

**Fallback strategy**:
```css
.glass {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.7);
}
@supports not (backdrop-filter: blur(12px)) {
  .glass {
    background: rgba(255, 255, 255, 0.95);
  }
}
```

### 8. Dashboard Design

**Decision**: SVG gauges + card layout within FormulaDisplay

**Rationale**:
- Visual continuity with existing layout
- SVG provides crisp rendering at any scale
- Card layout organizes information clearly
- Reuses existing KaTeX rendering for formulas

**Components**:
- Velocity gauge (semi-circle with needle)
- Energy gauge (vertical bar with gradient)
- Position indicators (circular progress)

## Performance Considerations

### Rendering Budget
- Target: 60fps (16.67ms per frame)
- Current baseline: ~8ms per frame
- Available overhead: ~8ms

### Performance Targets by Feature
- Vector rendering: < 1ms
- Energy bars: < 1ms
- Historical trajectories: < 2ms (up to 10)
- Stroboscopic markers: < 0.5ms
- Auto-scaling calculation: < 0.5ms

**Total estimated overhead: ~5ms (within budget)**

### Optimization Strategies
1. **Batch rendering**: Draw all vectors in single pass
2. **Level of detail**: Reduce trajectory points when zoomed out
3. **Dirty flags**: Only recalculate when parameters change
4. **RequestAnimationFrame**: Let browser optimize frame timing

## Testing Strategy

### Unit Testing
- Physics calculations with and without drag
- Energy conservation verification
- Vector component calculations
- Coordinate transformations

### Integration Testing
- Toggle states persist correctly
- Multi-trajectory save/load operations
- Environment mode switching
- Auto-scaling stability

### Visual Regression Testing
- Screenshot comparison for each feature
- Cross-browser rendering consistency
- Responsive layout behavior

### Performance Testing
- Frame rate monitoring with all features enabled
- Memory usage with maximum trajectory history
- Rendering time profiling

## Migration Path

### Phase 1: Foundation (No breaking changes)
1. Extend state management
2. Add new UI components
3. Implement rendering helpers

### Phase 2: Feature Integration (Additive)
4. Add each feature independently
5. Include feature toggles
6. Test in isolation

### Phase 3: Polish (Refinement)
7. Optimize performance
8. Enhance visual design
9. Improve user feedback

### Rollback Strategy
- All features are toggleable
- Can disable individually if issues arise
- Original functionality preserved
- No database or backend changes

## Future Extensibility

### Designed for Future Features
1. **Additional vector types**: Angular momentum, force vectors
2. **More environments**: Fluid resistance, varying gravity fields
3. **Export capabilities**: Trajectory data export, image capture
4. **Collaboration**: Shared trajectory comparison sessions

### Extension Points
- Custom vector renderers (plugin architecture)
- Additional energy types (thermal, sound)
- Environmental condition presets (user-defined)
- Analysis tools (curve fitting, data export)

## Security and Privacy

### Considerations
- No user data collection
- No external API calls for physics calculations
- All computation client-side
- No authentication required

### Validation
- Parameter bounds checking
- Safe numerical operations (NaN, Infinity handling)
- XSS prevention in formula rendering (KaTeX auto-escapes)

## Accessibility

### Visual Design
- Color-blind friendly palettes (consider in vector colors)
- Sufficient contrast ratios (WCAG AA compliant)
- Keyboard navigation for all controls

### Screen Reader Support
- ARIA labels for all toggles
- Alt text for canvas content (challenging, consider text summary)
- Live regions for real-time updates

### Motor Impairment
- Large click targets (minimum 44×44px)
- No time-based interactions (unless stroboscopic, which is opt-in)
- Adjustable animation speeds

## Conclusion

This design maintains simplicity while adding powerful visualization capabilities. The incremental approach allows for validation at each stage, and the toggle-based features ensure backward compatibility. Performance should remain excellent with the allocated rendering budget, and the architecture supports future extensions without major refactoring.
