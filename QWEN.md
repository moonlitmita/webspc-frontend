# WebSPC Frontend Project Context

## Project Overview

WebSPC is a web-based Statistical Process Control (SPC) system, which is widely used in production quality management to monitor and manage production process fluctuations and provide early warnings for abnormal conditions. The frontend is implemented as a separate component using modern web technologies.

### Key Technologies and Architecture
- **Framework**: Vue 3 with Vite and Pinia
- **UI Library**: Element-Plus
- **Charting Library**: Plotly.js
- **Language**: TypeScript
- **State Management**: Pinia with persisted state plugin
- **Routing**: Vue Router

## Project Structure

```
src/
├── api/                    # API service files
├── assets/                 # Static assets (images, styles)
├── components/             # Reusable Vue components
├── config/                 # Configuration files
├── router/                 # Routing configuration
├── store/                  # Pinia stores
├── utils/                  # Utility functions
├── views/                  # Page components
├── App.vue                 # Root application component
├── main.ts                 # Application entry point
└── axios.d.ts              # Axios type definitions
```

## Key Features

1. **Authentication**: Login system with token-based authentication
2. **Dynamic Routing**: Menu-driven navigation with route restoration
3. **State Management**: Persistent store using Pinia with persisted state
4. **Responsive UI**: Using Element-Plus component library
5. **Data Visualization**: Plotly.js for statistical charts and graphs

## Building and Running

### Development Environment
- Install dependencies: `npm install`
- Run development server: `npm run dev`
- Access the application via the local link shown in the terminal (Ctrl+click)

### Production Build
- Set environment variable: `set MODE=production`
- Build the project: `npm run build`
- The build output will be in the `dist/` directory

### Preview Production Build
- Run `npm run preview` to preview the built application locally

## Development Conventions

- TypeScript is used throughout the project
- Vue 3 Composition API with `<script setup>` syntax
- Component names and files follow PascalCase convention
- Code is organized in feature-based directories
- API calls are abstracted in the `api` directory
- State management uses Pinia with stores in the `store` directory
- Routing is handled by Vue Router with authentication guards
- LESS is used for styling as indicated by the import in main.ts

## Special Notes

- The application uses hash-based routing (`createWebHashHistory`)
- Authentication is required for most routes except login
- Menu items are dynamically loaded and routes are restored on initialization
- The project includes integration with WebSPC backend services
- Charting capabilities powered by Plotly.js for statistical analysis visualization

## Docker Deployment

The project includes a Dockerfile that builds an Nginx container serving the static build assets from the `dist/` directory. The container exposes port 80.

## Online Demo

There is a live demo available at https://webspc.top with admin credentials provided in the documentation.