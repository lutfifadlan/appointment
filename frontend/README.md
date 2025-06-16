# Appointment UI - Frontend

A modern, responsive appointment management application built with Next.js 15, React 19, and TypeScript. This frontend provides an intuitive interface for managing appointments with real-time collaboration features and conflict prevention.

## 🚀 Features

### Core Functionality
- **Smart Appointment Scheduling** - Create, view, and manage appointments with an intuitive interface
- **Real-time Collaboration** - See live cursor positions and edits from other users
- **Conflict Prevention** - Intelligent locking system prevents double-bookings and editing conflicts
- **User Authentication** - Secure login and registration system
- **Dashboard** - Comprehensive overview of all appointments and scheduling activities

### UI/UX Features
- **Modern Design** - Clean, professional interface with dark/light mode support
- **Responsive Layout** - Optimized for desktop, tablet, and mobile devices
- **Interactive Animations** - Smooth transitions with Framer Motion
- **Real-time Notifications** - Toast notifications for important updates
- **Typewriter Effects** - Engaging landing page with animated text
- **Confetti Celebrations** - Delightful user feedback for successful actions

### Technical Features
- **Real-time Updates** - WebSocket integration for live collaboration
- **Form Validation** - Robust form handling with React Hook Form and Zod
- **Date Management** - Advanced date picking and formatting with date-fns
- **Theme Support** - Seamless dark/light mode switching
- **Component Library** - Custom UI components built on Radix UI primitives

## 🛠️ Tech Stack

### Core Technologies
- **Next.js 15.3.3** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first CSS framework

### UI & Components
- **Radix UI** - Accessible, unstyled UI primitives
  - Dialog, Dropdown, Select, Checkbox, and more
- **Lucide React** - Beautiful, customizable icons
- **Tabler Icons** - Additional icon set
- **Framer Motion** - Smooth animations and transitions
- **Canvas Confetti** - Celebration effects

### Forms & Validation
- **React Hook Form** - Performant forms with easy validation
- **Zod** - TypeScript-first schema validation
- **@hookform/resolvers** - Integration between React Hook Form and Zod

### Real-time & Networking
- **Socket.IO Client** - Real-time bidirectional communication
- **React Day Picker** - Advanced date selection component

### Styling & Theming
- **Next Themes** - Theme management (dark/light mode)
- **Class Variance Authority** - Component variant management
- **Tailwind Merge** - Smart Tailwind class merging
- **CLSX** - Conditional className utility

### Development Tools
- **ESLint** - Code linting and formatting
- **PostCSS** - CSS processing

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- Backend server running (see backend README)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd appointment/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment**
   ```bash
   # Create .env.local file with your backend URL
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_WS_URL=http://localhost:3001
   ```

4. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🚀 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Main dashboard page
│   ├── auth/              # Authentication pages
│   ├── api/               # API routes (if any)
│   ├── contact-us/        # Contact page
│   ├── privacy-policy/    # Privacy policy page
│   ├── terms-of-service/  # Terms of service page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   ├── globals.css        # Global styles
│   └── providers.tsx      # Context providers
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (Radix-based)
│   ├── custom-ui/        # Custom components
│   └── common-layout.tsx # Shared layout component
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configurations
├── constants/            # Application constants
└── types/               # TypeScript type definitions
```

## 🎨 UI Components

### Custom Components
- **GetStartedButton** - Call-to-action button with animations
- **LeftToRightArrow** - Animated directional indicator
- **TypewriterEffect** - Animated text typing effect
- **CommonLayout** - Shared page layout with navigation

### Base Components (Radix UI)
- Alert Dialog, Avatar, Checkbox, Dialog
- Dropdown Menu, Label, Popover, Select
- Separator, Tabs, and more

## 🔧 Configuration

### Tailwind CSS
The project uses Tailwind CSS 4 with custom configurations:
- Custom color palette
- Responsive breakpoints
- Animation utilities
- Dark mode support

### ESLint
Configured with Next.js recommended rules and TypeScript support.

### TypeScript
Strict type checking enabled with custom type definitions.

## 🌐 Environment Variables

```bash
# Required
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001

# Optional
NEXT_PUBLIC_APP_NAME="Appointment Manager"
```

## 🔄 Real-time Features

The application integrates with the backend WebSocket server to provide:
- Live cursor tracking during appointment editing
- Real-time lock status updates
- Instant notifications for appointment changes
- Collaborative editing indicators

## 🎯 Key Pages

### Landing Page (`/`)
- Hero section with typewriter effect
- Feature highlights
- Call-to-action buttons
- Responsive grid layout

### Dashboard (`/dashboard`)
- Appointment overview
- Real-time collaboration features
- Appointment creation and editing
- Lock status indicators

### Authentication (`/auth`)
- Login and registration forms
- Form validation with Zod
- Secure authentication flow

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Docker Deployment
```bash
# Build Docker image
docker build -t appointment-frontend .

# Run container
docker run -p 3000:3000 appointment-frontend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Related

- [Backend Repository](../backend) - The API server and WebSocket service
- [Live Demo](#) - See the application in action

---

Built with ❤️ using Next.js, React, and TypeScript 