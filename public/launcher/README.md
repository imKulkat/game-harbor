# VesaStar Games Launcher

A cyberpunk-themed static games launcher for home servers and Docker environments.

## How It Works

The launcher loads games into an iframe when users click on game cards. It features:
- Pure HTML/CSS/JS with no dependencies
- Account system with localStorage fallback
- Quest/achievement system
- Playtime tracking

## Project Structure

```
launcher/
├── index.html          # Main HTML file
├── styles.css          # All CSS styles
├── script.js           # All JavaScript logic
├── games.json          # Game definitions
├── README.md           # This file
└── assets/
    ├── logo.svg        # Launcher logo
    ├── icons/          # UI icons (add your own)
    └── thumbnails/     # Game thumbnails (add your own)
```

## Adding New Games

1. Place your game at `https://games.vesastar.top/<game-folder>/`
2. Add an entry to `games.json`:

```json
{
  "id": "my-new-game",
  "name": "My New Game",
  "description": "Description of the game.",
  "thumbnail": "assets/thumbnails/my-game.png",
  "path": "/my-new-game/"
}
```

3. Add a thumbnail image to `assets/thumbnails/`

## Iframe Switching

When a game is selected:
1. A loading spinner appears
2. The iframe adds a "glitch" CSS animation
3. The iframe `src` is updated to the game path
4. On load, the spinner hides and playtime tracking starts

## Quests & Playtime Tracking

### Playtime Tracking
- Every 10 seconds while a game is loaded, the launcher:
  - Sends a POST to `/api/update-playtime` with `username`, `gameId`, `secondsPlayed`
  - Falls back to localStorage if API is unavailable

### Quests
- **Daily**: Reset each day (launch game, play 30 min, try 3 games)
- **Weekly**: Reset each week (5 hours total, play all games)
- **Achievements**: Permanent (reach levels, marathon playtime)

Quest progress updates automatically based on playtime data.

## Account System Integration

The launcher uses these API endpoints (implement on your backend):

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/api/signup` | POST | `{username, password}` | `{success, username}` |
| `/api/login` | POST | `{username, password}` | `{success, token, user}` |
| `/api/logout` | POST | - | `{success}` |
| `/api/quests` | GET | - | `{daily[], weekly[], achievements[]}` |
| `/api/update-playtime` | POST | `{username, gameId, secondsPlayed}` | - |

**Without a backend**, the launcher uses localStorage for demo functionality.

## Animation Structure

All animations are in `styles.css` using CSS keyframes:

- `launcherFadeIn` - Initial page load
- `logoGlow` - Logo pulsing glow
- `neonPulse` - Active game card glow
- `borderFlow` - Animated gradient borders
- `slideInLeft/Right` - Panel entry
- `glitch` - Game switching effect
- `modalAppear` - Auth modal entry
- `hologramFlicker` - Modal flicker effect
- `questComplete` - Quest completion flash
- `progressGlow` - Progress bar glow

To customize, modify the keyframe definitions and timing.

## Deployment

### Static Hosting
Just copy all files to your web server. Open `index.html`.

### Docker (Nginx)
```dockerfile
FROM nginx:alpine
COPY launcher/ /usr/share/nginx/html/launcher/
EXPOSE 80
```

```yaml
# docker-compose.yml
version: '3'
services:
  launcher:
    build: .
    ports:
      - "8080:80"
```

### Home Server
1. Copy files to `/var/www/launcher/`
2. Configure nginx/apache to serve the directory
3. Ensure games are accessible at the configured paths

## Customization

### Colors
Edit CSS variables at the top of `styles.css`:
```css
:root {
    --accent-cyan: #00f0ff;
    --accent-purple: #b000ff;
    /* etc */
}
```

### Fonts
Replace the font-family in `--font-main` variable. For custom fonts without CDN, add font files to `assets/fonts/` and use `@font-face`.

### Logo
Replace `assets/logo.svg` with your own SVG.

## Browser Support

Tested on modern browsers (Chrome, Firefox, Edge, Safari). Uses standard CSS features with no polyfills.
