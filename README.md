# Wave Superposition Interactive Lab

An interactive A-Level Edexcel Physics webpage for teaching wave phase, superposition, and interference.

## Features

- Clear core principle panel showing:
  - `When two waves meet, the resultant displacement at each point is the sum of the displacements caused by each wave.`
  - `y_resultant = y1 + y2`
- Two pulse superposition animation with controls for:
  - amplitude 1
  - amplitude 2
  - pulse width
  - speed
  - separation
  - play/pause and reset
- Continuous wave phase animation with:
  - phase difference slider from `0°` to `360°`
  - phase value displayed in degrees and radians
  - constructive/destructive interference labeling
- Wavefronts and rays diagram showing rays perpendicular to wavefronts
- Exam-language panel with A-Level style sentences

## How to Run Locally

1. Clone or download this repository.
2. Open `index.html` in a web browser.

No build process, package manager, or external dependency is required.

## Classroom Use

- Layout uses large, readable text for projection.
- The page is designed for laptop and iPad-sized screens.
- Sliders update the wave visuals immediately so students can see cause and effect.

## Deploy on GitHub Pages

1. Push this repository to GitHub.
2. In GitHub, go to **Settings → Pages**.
3. Under **Build and deployment**, choose:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main` (or your chosen default branch) and `/root`
4. Save settings and wait for deployment.
5. Open the published URL shown in Pages settings.

Because this project uses only static files (`index.html`, `style.css`, `script.js`), it works directly with GitHub Pages.
