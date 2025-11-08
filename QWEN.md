# WebSPC Frontend - Project Context

## Project Overview

WebSPC is a web-based implementation of SPC (Statistical Process Control) - a method widely used in production-quality management to monitor and control process variation, and to provide early warnings of abnormal conditions. The project uses a front-end/back-end separation architecture and is free & open source.

**Repository**: https://gitee.com/valleyfo/webspc-frontend
**Live Demo**: https://webspc.top (Username: admin, Password: contact author)

## Technology Stack

- **Framework**: Vue 3 + Vite + Pinia
- **UI Library**: Element-Plus
- **Charting Library**: Plotly.js
- **Language**: TypeScript
- **Build Tool**: Vite
- **Package Manager**: npm

## Project Architecture

The frontend follows a modern Vue 3 architecture with:
- Vue 3 Composition API
- Pinia for state management (with persisted state plugin)
- Vue Router for navigation
- Element-Plus for UI components
- Axios for API communications
- Plotly.js for data visualization
- TypeScript for type safety

### Directory Structure
```
src/
├── api/                 # API services
├── assets/              # Static assets (images, styles)
├── components/          # Reusable Vue components
├── config/              # Configuration files
├── router/              # Vue Router configuration
├── store/               # Pinia stores
├── utils/               # Utility functions
├── views/               # Page components
├── App.vue              # Root component
├── main.ts              # Application entry point
```

## Development Setup

### Prerequisites
- Node.js (version compatible with the project)
- npm package manager

### Installation
1. Clone the repository:
   ```bash
   git clone https://gitee.com/valleyfo/webspc-frontend.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Project
- **Development**: `npm run dev`
- **Build for Production**: `npm run build`
- **Preview Build**: `npm run preview`
- **Type Check**: `npm run type-check`

## Key Features

1. **Statistical Process Control**: Core SPC functionality for monitoring and controlling process variation
2. **Data Visualization**: Charts and graphs using Plotly.js for data analysis
3. **User Management**: Login system with role-based menu access
4. **Data Management**: Tools for data collection and analysis
5. **Responsive Design**: Using Element-Plus for consistent UI/UX

## Building and Deployment

### Development Build
```bash
npm run dev
```

### Production Build
```bash
set MODE=production  # On Windows
npm run build
```

### Docker Deployment
The project includes a Dockerfile that:
1. Uses nginx:alpine as the base image
2. Copies the built dist folder to nginx html directory
3. Exposes port 80

To build and run with Docker:
```bash
# After building the project with npm run build
docker build -t webspc-frontend .
docker run -p 80:80 webspc-frontend
```

## Development Conventions

- **Code Style**: TypeScript with Vue 3 Composition API
- **Component Naming**: PascalCase for components
- **File Structure**: Feature-based organization in the src directory
- **State Management**: Pinia with stores located in src/store/
- **API Calls**: Centralized in src/api/ directory
- **Routing**: Vue Router with programmatic route generation

## Main Dependencies

**Core Dependencies:**
- `vue`: ^3.5.13
- `vue-router`: ^4.5.0
- `pinia`: ^2.2.6
- `element-plus`: ^2.3.8
- `axios`: ^1.7.9
- `plotly.js-dist-min`: ^2.35.3

**Dev Dependencies:**
- `vite`: ^6.0.1
- `typescript`: ^5.9.3
- `@vitejs/plugin-vue`: ^5.2.1
- `vue-tsc`: ^2.1.10
- `less`: ^4.2.1

## Configuration Files

- **vite.config.ts**: Vite build configuration with Vue plugin, auto-import, and component resolution
- **tsconfig.json**: TypeScript configuration with app and node references
- **package.json**: Project metadata, dependencies, and scripts
- **Dockerfile**: Production deployment configuration

## Special Notes

- The project includes automatic route restoration functionality that fetches menus from the API and dynamically adds routes
- The application uses pinia-plugin-persistedstate to persist store data
- Icons from @element-plus/icons-vue are globally registered
- The project uses LESS for styling

## Technical Support

- **Author**: Yu Wang (valleyfo)
- **Email**: wynmamtf@163.com
- **QQ**: 271989251
- **WeChat**: valleyfo

## License

The project is distributed under the MIT license (as indicated in the copyright notice in main.ts).