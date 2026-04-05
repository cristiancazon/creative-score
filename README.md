# 🏆 Creative Score

**Transform Any Screen into a Professional Digital Scoreboard.**

Creative Score is a real-time, fully configurable digital scoreboard platform designed for elite performance. It turns any display—from classroom projectors to 4K courtside LED walls—into a professional, modern sports experience with zero lag.

---

## 🖥️ Optimized for Logitech MX Creative
Creative Score is built specifically to integrate with the **Logitech Creative Console MX**. This partnership provides the "Elite Standard" for match operation:
- **Precise Control**: Update scores instantly with the dedicated tactile dial.
- **Tactile Feedback**: Haptic response for confident, eyes-free control during intense action.
- **Custom Mapping**: Native support for professional-grade tactile operations.
- **Low Latency**: Optimized Bluetooth connectivity for professional production environments.

---

## ✨ Key Features

- **⚡ Real-Time Synchronization**: Every score, timer, and event updates instantly across all connected displays via WebSocket.
- **🎨 Fully Customizable Boards**: Design your layouts, colors, and branding to match any sport or team identity.
- **🏆 Multi-Sport Ready**: Native support for Basketball, Soccer, Volleyball, and more—one platform for every court.
- **👥 Team & Player Management**: Manage rosters, track statistics, and handle substitutions from an intuitive dashboard.
- **📅 Match Scheduling**: Organize tournaments and keep your league calendar synchronized.
- **🌍 Internationalization**: Native support for **English**, **Spanish**, **German**, **Portuguese**, and **French**.

---

## 🛠️ Technology Stack

Creative Score is built with a cutting-edge frontend stack for maximum performance and reliability:

- **Framework**: [Next.js 16 (Turbopack)](https://nextjs.org/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Backend API**: [Directus SDK v21](https://directus.io/)
- **Real-time**: WebSocket integration for instant cross-device updates.
- **Language**: TypeScript

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/cristiancazon/creative-score.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables:
   Create a `.env.local` file with your Directus and WebSocket credentials.

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📊 Deployment

The project is optimized for production deployment via Docker:
- `docker-compose.prod.yml` included for easy containerized deployment.
- Optimized for high-concurrency match environments.

---

## 📄 License
© 2026 Creative Score. All rights reserved.
Professional digital scoreboards for every court.
