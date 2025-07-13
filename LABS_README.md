# Labs Page Documentation

The `/labs` page is a showcase for visual experiments and creative coding projects. It provides a grid-based layout for embedding HTML canvases and other interactive experiments.

## Structure

### Current Experiments

1. **Particle System** - Interactive particle system using HTML5 Canvas
   - Click and drag to create colorful particles
   - Pause/resume animation
   - Reset functionality

2. **Generative Art** - Algorithmic art generation
   - Mathematical functions and randomness
   - Generate new patterns
   - Save images to disk

3. **Data Visualization** - Placeholder for D3.js visualizations
   - Interactive charts and graphs
   - Smooth animations and hover effects

4. **3D Rendering** - WebGL experiments placeholder
   - Hardware-accelerated 3D graphics
   - Shader experiments

## Adding New Experiments

To add a new experiment to the labs page:

1. **Add HTML Structure**:
   ```html
   <div class="lab-item">
     <div class="lab-header">
       <h3>Experiment Name</h3>
       <div class="lab-meta">
         <span class="lab-tag">Technology</span>
         <span class="lab-tag">Category</span>
       </div>
     </div>
     <div class="lab-canvas-container">
       <canvas id="yourCanvas" width="400" height="300"></canvas>
     </div>
     <div class="lab-description">
       <p>Description of your experiment.</p>
       <div class="lab-controls">
         <button id="yourButton">Action</button>
       </div>
     </div>
   </div>
   ```

2. **Add JavaScript/TypeScript**:
   ```javascript
   // Your experiment logic
   const canvas = document.getElementById('yourCanvas') as HTMLCanvasElement;
   const ctx = canvas.getContext('2d');
   
   // Initialize your experiment
   function init() {
     // Setup code
   }
   
   // Add event listeners
   document.getElementById('yourButton')?.addEventListener('click', () => {
     // Button functionality
   });
   ```

3. **Style Considerations**:
   - The existing CSS handles the grid layout and card styling
   - Canvas elements are automatically responsive
   - Use CSS custom properties for theming consistency

## Design Inspiration

The labs page draws inspiration from:
- **diagram.engineer** - Clean, professional experiment showcase
- **calmcode.io/labs** - Educational focus with practical examples
- **Observable notebooks** - Interactive coding environment

## Technical Notes

- Built with Astro for static site generation
- Uses CSS Grid for responsive layout
- HTML5 Canvas for 2D graphics
- TypeScript for type safety
- Supports both light and dark themes

## Future Enhancements

- Add more advanced WebGL experiments
- Integrate with external libraries (Three.js, D3.js, p5.js)
- Add experiment sharing functionality
- Include code snippets or explanations
- Add performance metrics for experiments