# 💣 Bomboclat - Online Multiplayer Bomberman

A modern, web-based multiplayer Bomberman game built with Node.js, Socket.IO, and Phaser 3. Experience classic Bomberman gameplay with friends in real-time!

![Game Preview](https://img.shields.io/badge/Status-Active%20Development-green)
![Players](https://img.shields.io/badge/Players-2--4-blue)
![Platform](https://img.shields.io/badge/Platform-Web-orange)

## 🎮 Features

### Core Gameplay
- **Real-time multiplayer** for 2-4 players
- **Classic Bomberman mechanics** with bombs, explosions, and destructible walls
- **Multiple character skins**: Bombardinho, Filipek, and Guczo
- **Health system** with up to 4 HP per player
- **Respawn mechanics** with grave markers

### Power-ups System
- 🏃 **Speed Boost** - Temporary movement speed increase (7.5s)
- 🐌 **Slow Potion** - Slows down all other players (10s)
- 💣 **Extra Bombs** - Additional bomb charges (max 5)
- ❤️ **Health** - Restore HP (max 4)

### Maps
Choose from multiple themed battlegrounds:
- 🏖️ **Beach Map** - Tropical island setting
- ⛏️ **Gold Mine** - Underground mining facility
- 🇵🇹 **Portugal Map** - Portuguese-themed environment

### Game Mechanics
- **Smart bomb placement** with grid-based positioning
- **Explosion range system** with wall collision detection
- **Player collision detection** for accurate hit registration
- **Automatic powerup spawning** (max 5 active at once)
- **Reconnection support** for dropped connections

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/fmach24/Bomboclat.git
   cd Bomboclat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   node server.js
   ```

4. **Open your browser**
   Navigate to `http://localhost:5678`

### For Development
```bash
npm run dev    # Start development server with Vite
npm run build  # Build for production
```

## 🎯 How to Play

### Controls
- **Arrow Keys** (↑ ↓ ← →) - Move your character
- **SPACE** - Place bomb

### Objective
Be the last player standing! Use bombs strategically to eliminate opponents while collecting power-ups to gain advantages.

### Tips
- 💡 Bombs explode after 2.5 seconds
- 💡 Collect power-ups to gain temporary advantages
- 💡 Use walls strategically for cover
- 💡 Watch your HP - you can take multiple hits!

## 🛠️ Technical Stack

### Backend
- **Node.js** with Express.js
- **Socket.IO** for real-time communication
- **UUID** for unique player identification

### Frontend
- **Phaser 3** game framework
- **HTML5 Canvas** for rendering
- **CSS3** for UI styling
- **WebSocket** for real-time updates

### Assets
- Custom pixel art animations
- Tiled map editor integration (@rpgjs/tiled)
- Multiple character sprites and animations

## 🏗️ Project Structure

```
Bomboclat/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── public/                # Client-side files
│   ├── index.html        # Main HTML page
│   ├── index.js          # Game initialization
│   ├── GameScene.js      # Main game logic
│   ├── LobbyScene.js     # Lobby and matchmaking
│   ├── NetworkManager.js # Client-server communication
│   ├── styles.css        # Game styling
│   └── assets/           # Game assets
│       ├── animations/   # Character sprites
│       ├── fonts/        # Custom fonts
│       └── *.tmj         # Tiled map files
└── README.md
```

## 🔧 Configuration

### Server Settings
```javascript
const REQUIRED_PLAYERS = 2;    // Minimum players to start
const DETONATION_TIME = 2500;  // Bomb timer (ms)
const HP_MAX = 3;              // Starting health
const MAX_ACTIVE_POWERUPS = 5; // Max powerups on map
```

### Network
- Default port: `5678`
- Supports local network play (`0.0.0.0`)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Known Issues

- Map creation synchronization needs improvement
- Player reconnection could be more robust
- Need better error handling for network issues

## 📈 Future Enhancements

- [ ] Tournament mode
- [ ] More maps and themes
- [ ] Additional power-ups
- [ ] Spectator mode
- [ ] Leaderboards
- [ ] Mobile device support

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 Acknowledgments

- Inspired by the classic Bomberman series
- Built with love for retro gaming enthusiasts
- Thanks to the Phaser.js and Socket.IO communities

---

**Ready to bomb some friends?** 💣 Start the server and share the link!