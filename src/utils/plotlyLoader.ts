/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

// Store the loaded plotly instance to avoid repeated imports
let plotlyInstance: any = null;
let loadingPromise: Promise<any> | null = null;

// Polyfill for global variable to fix issues with some Plotly dependencies
if (typeof window !== 'undefined' && typeof (window as any).global === 'undefined') {
  (window as any).global = window;
}

export interface PlotlyType {
  newPlot: (div: any, data: any, layout: any, config?: any) => Promise<any>;
  plot: (div: any, data: any, layout: any, config?: any) => Promise<any>;
  addTraces: (div: any, traces: any) => Promise<any>;
  deleteTraces: (div: any, traceIndices: any) => Promise<any>;
  restyle: (div: any, update: any, indices?: any) => Promise<any>;
  relayout: (div: any, update: any) => Promise<any>;
  redraw: (div: any) => Promise<any>;
  update: (div: any, traces: any, layout: any) => Promise<any>;
  toImage: (div: any, format: any) => Promise<any>;
  downloadImage: (div: any, format: any) => Promise<any>;
  Plots: {
    resize: (div: any) => Promise<any>;
  };
  [key: string]: any;
}

/**
 * Dynamically loads Plotly.js on demand from the dist-min version to avoid having it in the initial bundle
 * @returns Promise<PlotlyType> The Plotly instance
 */
export const loadPlotly = async (): Promise<PlotlyType> => {
  if (plotlyInstance) {
    return plotlyInstance;
  }
  
  // If a loading promise already exists, return it to avoid multiple parallel loads
  if (loadingPromise) {
    return loadingPromise;
  }
  
  // Create a new loading promise
  loadingPromise = import('plotly.js-dist-min').then(module => {
    plotlyInstance = module.default;
    loadingPromise = null; // Clear the loading promise
    return plotlyInstance;
  });
  
  return loadingPromise;
};

/**
 * Preload plotly when the app starts (optional)
 * This can be called at app startup if you want to preload plotly in the background
 */
export const preloadPlotly = () => {
  if (!plotlyInstance && !loadingPromise) {
    // Start loading plotly in the background
    loadPlotly().catch(error => {
      console.error('Failed to preload plotly:', error);
    });
  }
};

/**
 * Alternative approach: Load Plotly with a loading indicator
 */
export const loadPlotlyWithIndicator = async (onLoadProgress?: (progress: number) => void): Promise<PlotlyType> => {
  if (onLoadProgress) {
    onLoadProgress(0); // Start loading
  }

  if (!plotlyInstance) {
    // Simulate progress (since dynamic import is all-or-nothing)
    if (onLoadProgress) {
      onLoadProgress(50); // Halfway through conceptually
    }

    const plotlyModule = await import('plotly.js-dist-min');
    plotlyInstance = plotlyModule.default;

    if (onLoadProgress) {
      onLoadProgress(100); // Completed
    }
  }

  return plotlyInstance;
};