# ⚡ Six-7 — Speed Math Survival

<p align="center">
  <a href="https://play.google.com/store/apps/details?id=com.harrycheese.sixseven&hl=en-US">
    <img alt="Get it on Google Play" height="80" src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" />
  </a>
</p>

<p align="center">
  <strong>Fast-paced mental math reflex game. Match tiles, trigger combos, beat the clock!</strong><br>
  🎮 <strong>Play on Web:</strong> <a href="https://six-seven-game.web.app">six-seven-game.web.app</a> | 📱 <strong>Get on Android:</strong> <a href="https://play.google.com/store/apps/details?id=com.harrycheese.sixseven&hl=en-US">Google Play Store</a>
</p>

---

Six-7 is a fast-paced speed math game where players race against the clock to select tiles that combine to reach dynamic target numbers. Built as a high-performance Progressive Web App (PWA) packaged as an Android Trusted Web Activity (TWA).

## 🎮 Game Modes

### ⏱️ Survival Mode (Core Mode)
Race against the clock! Start with 60 seconds and earn bonus seconds with each correct equation. Chain rapid combos for extra score multipliers and time boosts (+5s). Features power-ups (Hint, 50/50, Remix, Reroll) and Easter eggs!

### 🏆 Campaign Mode
Progress through **100 levels** of increasing difficulty. Unlock new operators (+, -, ×, ÷), earn stars, and master your math skills.

### 🧘 Zen Mode
No timer, no pressure. Pure mental math practice at your own pace.

## ✨ Features

- **Rapid Equation Matching** - Combine tiles using Addition, Subtraction, Multiplication, and Division
- **Dynamic Power-Ups** - Hint (solvable tile highlight), 50/50 (gravity halve), Remix (shuffle), Reroll (target reset)
- **Combo & Multiplier Engine** - Chain matches under 3.5s for scaling combo multipliers
- **Hardware Lifecycle & Pause** - Auto-pauses on Android back button/gesture or app backgrounding with a 3-2-1 resume countdown
- **Career Analytics** - Track equations solved, total time played, and operator mastery in Firestore
- **Account Linking** - Seamless guest play with optional email/Google account linking
- **Automated Testing** - 146 deterministic Vitest tests gating every build and deployment
- **Native Android Feel** - Fullscreen immersive Trusted Web Activity with Digital Asset Links verification

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| React 19 | UI Framework |
| TypeScript | Type Safety |
| Vite 7 | High-performance bundler |
| Tailwind CSS v4 | Modern styling |
| Framer Motion | Smooth game animations & transitions |
| Vitest | Fast in-memory deterministic testing suite |
| Firebase Auth & Firestore | Cloud authentication & user statistics |
| Android TWA | Google Play Store distribution |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/harrycheese/MathGame.git
cd MathGame

# Install dependencies
npm install

# Create .env file with your Firebase config
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## 📱 Screenshots

### Gameplay

| Campaign Mode | Survival Mode | Zen Mode |
|:-------------:|:-------------:|:--------:|
| ![campaign](screenshots/campaign.png) | ![survival](screenshots/survival.png) | ![zen](screenshots/zen.png) |

### Screens

| Level Select | Profile | Login |
|:------------:|:-------:|:-----:|
| ![levels](screenshots/levels.png) | ![profile](screenshots/profile.png) | ![login](screenshots/login.png) |

## 🗺️ Roadmap

- [x] Player stats & analytics (Career stats, operator mastery, session tracking)
- [ ] Sound effects & haptic feedback
- [ ] Daily challenges
- [ ] Leaderboards
- [ ] More game modes

## 📄 License

MIT License - feel free to use this project for learning or your own apps!

---

Made with ❤️ and lots of ☕
