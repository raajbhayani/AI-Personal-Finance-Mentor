import { logger } from '../logging/structuredLogger';

export interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunks: ChunkInfo[];
  assets: AssetInfo[];
  dependencies: DependencyInfo[];
  recommendations: string[];
}

export interface ChunkInfo {
  name: string;
  size: number;
  gzippedSize: number;
  modules: ModuleInfo[];
  isInitial: boolean;
  isAsync: boolean;
}

export interface ModuleInfo {
  name: string;
  size: number;
  reasons: string[];
}

export interface AssetInfo {
  name: string;
  size: number;
  type: 'js' | 'css' | 'image' | 'font' | 'other';
  optimized: boolean;
}

export interface DependencyInfo {
  name: string;
  version: string;
  size: number;
  treeshakeable: boolean;
  duplicates: string[];
}

export class BundleAnalyzer {
  private static instance: BundleAnalyzer;
  private analysisData: BundleAnalysis | null = null;

  static getInstance(): BundleAnalyzer {
    if (!BundleAnalyzer.instance) {
      BundleAnalyzer.instance = new BundleAnalyzer();
    }
    return BundleAnalyzer.instance;
  }

  async analyzeBundleSize(): Promise<BundleAnalysis> {
    try {
      // In a real implementation, this would parse webpack stats
      // For now, we'll simulate the analysis
      const analysis: BundleAnalysis = {
        totalSize: 0,
        gzippedSize: 0,
        chunks: [],
        assets: [],
        dependencies: [],
        recommendations: [],
      };

      // Analyze chunks
      analysis.chunks = await this.analyzeChunks();
      analysis.totalSize = analysis.chunks.reduce((sum, chunk) => sum + chunk.size, 0);
      analysis.gzippedSize = analysis.chunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0);

      // Analyze assets
      analysis.assets = await this.analyzeAssets();

      // Analyze dependencies
      analysis.dependencies = await this.analyzeDependencies();

      // Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis);

      this.analysisData = analysis;
      logger.info('Bundle analysis completed', {
        metadata: {
          totalSize: analysis.totalSize,
          gzippedSize: analysis.gzippedSize,
          chunksCount: analysis.chunks.length,
          assetsCount: analysis.assets.length,
        },
      });

      return analysis;
    } catch (error) {
      logger.error('Bundle analysis failed', error as Error);
      throw error;
    }
  }

  private async analyzeChunks(): Promise<ChunkInfo[]> {
    // Simulate chunk analysis - in real implementation, parse webpack stats
    return [
      {
        name: 'main',
        size: 250000,
        gzippedSize: 75000,
        modules: [
          { name: 'src/pages/_app.tsx', size: 15000, reasons: ['entry'] },
          { name: 'src/components/Layout.tsx', size: 20000, reasons: ['import'] },
        ],
        isInitial: true,
        isAsync: false,
      },
      {
        name: 'vendors',
        size: 800000,
        gzippedSize: 200000,
        modules: [
          { name: 'node_modules/react/index.js', size: 50000, reasons: ['import'] },
          { name: 'node_modules/next/dist/client/index.js', size: 100000, reasons: ['import'] },
        ],
        isInitial: true,
        isAsync: false,
      },
      {
        name: 'dashboard',
        size: 120000,
        gzippedSize: 35000,
        modules: [
          { name: 'src/pages/dashboard.tsx', size: 25000, reasons: ['dynamic import'] },
          { name: 'src/components/Dashboard/', size: 95000, reasons: ['import'] },
        ],
        isInitial: false,
        isAsync: true,
      },
    ];
  }

  private async analyzeAssets(): Promise<AssetInfo[]> {
    return [
      {
        name: 'main.js',
        size: 250000,
        type: 'js',
        optimized: true,
      },
      {
        name: 'vendors.js',
        size: 800000,
        type: 'js',
        optimized: true,
      },
      {
        name: 'styles.css',
        size: 45000,
        type: 'css',
        optimized: true,
      },
    ];
  }

  private async analyzeDependencies(): Promise<DependencyInfo[]> {
    return [
      {
        name: 'react',
        version: '18.2.0',
        size: 50000,
        treeshakeable: true,
        duplicates: [],
      },
      {
        name: 'lodash',
        version: '4.17.21',
        size: 70000,
        treeshakeable: false,
        duplicates: [],
      },
      {
        name: 'chart.js',
        version: '4.2.1',
        size: 120000,
        treeshakeable: true,
        duplicates: [],
      },
    ];
  }

  private generateRecommendations(analysis: BundleAnalysis): string[] {
    const recommendations: string[] = [];

    // Check for large dependencies
    const largeDeps = analysis.dependencies.filter(dep => dep.size > 100000);
    if (largeDeps.length > 0) {
      recommendations.push(
        `Consider alternatives for large dependencies: ${largeDeps.map(d => d.name).join(', ')}`
      );
    }

    // Check for non-treeshakeable dependencies
    const nonTreeshakeable = analysis.dependencies.filter(dep => !dep.treeshakeable);
    if (nonTreeshakeable.length > 0) {
      recommendations.push(
        `Replace non-treeshakeable dependencies: ${nonTreeshakeable.map(d => d.name).join(', ')}`
      );
    }

    // Check for large chunks
    const largeChunks = analysis.chunks.filter(chunk => chunk.size > 300000);
    if (largeChunks.length > 0) {
      recommendations.push(
        `Split large chunks: ${largeChunks.map(c => c.name).join(', ')}`
      );
    }

    // Check bundle size
    if (analysis.totalSize > 1000000) {
      recommendations.push('Total bundle size is large (>1MB). Consider code splitting.');
    }

    // Check gzip ratio
    const gzipRatio = analysis.gzippedSize / analysis.totalSize;
    if (gzipRatio > 0.4) {
      recommendations.push('Poor gzip compression ratio. Check for repeated code or large assets.');
    }

    return recommendations;
  }

  formatSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  generateReport(analysis?: BundleAnalysis): string {
    const data = analysis || this.analysisData;
    if (!data) return 'No analysis data available';

    let report = '# Bundle Analysis Report\n\n';

    report += `## Summary\n`;
    report += `- Total Size: ${this.formatSize(data.totalSize)}\n`;
    report += `- Gzipped Size: ${this.formatSize(data.gzippedSize)}\n`;
    report += `- Compression Ratio: ${((data.gzippedSize / data.totalSize) * 100).toFixed(1)}%\n`;
    report += `- Chunks: ${data.chunks.length}\n\n`;

    report += `## Chunks\n`;
    data.chunks.forEach(chunk => {
      report += `### ${chunk.name}\n`;
      report += `- Size: ${this.formatSize(chunk.size)}\n`;
      report += `- Gzipped: ${this.formatSize(chunk.gzippedSize)}\n`;
      report += `- Type: ${chunk.isInitial ? 'Initial' : 'Async'}\n`;
      report += `- Modules: ${chunk.modules.length}\n\n`;
    });

    report += `## Dependencies\n`;
    data.dependencies.forEach(dep => {
      report += `### ${dep.name} (${dep.version})\n`;
      report += `- Size: ${this.formatSize(dep.size)}\n`;
      report += `- Tree-shakeable: ${dep.treeshakeable ? 'Yes' : 'No'}\n`;
      if (dep.duplicates.length > 0) {
        report += `- Duplicates: ${dep.duplicates.join(', ')}\n`;
      }
      report += '\n';
    });

    if (data.recommendations.length > 0) {
      report += `## Recommendations\n`;
      data.recommendations.forEach(rec => {
        report += `- ${rec}\n`;
      });
    }

    return report;
  }

  async optimizeBundleSize(): Promise<string[]> {
    const optimizations: string[] = [];

    try {
      // Check for webpack-bundle-analyzer
      const hasAnalyzer = await this.checkForBundleAnalyzer();
      if (!hasAnalyzer) {
        optimizations.push('Install webpack-bundle-analyzer for detailed analysis');
      }

      // Check for duplicate dependencies
      const duplicates = await this.findDuplicateDependencies();
      if (duplicates.length > 0) {
        optimizations.push(`Remove duplicate dependencies: ${duplicates.join(', ')}`);
      }

      // Check for unused dependencies
      const unused = await this.findUnusedDependencies();
      if (unused.length > 0) {
        optimizations.push(`Remove unused dependencies: ${unused.join(', ')}`);
      }

      logger.info('Bundle optimization suggestions generated', {
        metadata: { suggestionsCount: optimizations.length },
      });

      return optimizations;
    } catch (error) {
      logger.error('Bundle optimization analysis failed', error as Error);
      return [];
    }
  }

  private async checkForBundleAnalyzer(): Promise<boolean> {
    try {
      require('@next/bundle-analyzer');
      return true;
    } catch {
      return false;
    }
  }

  private async findDuplicateDependencies(): Promise<string[]> {
    // In a real implementation, this would analyze node_modules
    // For now, return common duplicates
    return ['lodash', 'moment'];
  }

  private async findUnusedDependencies(): Promise<string[]> {
    // In a real implementation, this would analyze imports vs package.json
    return [];
  }
}

export const bundleAnalyzer = BundleAnalyzer.getInstance();

export async function generateBundleReport(): Promise<void> {
  try {
    const analysis = await bundleAnalyzer.analyzeBundleSize();
    const report = bundleAnalyzer.generateReport(analysis);

    // Write report to file
    const fs = require('fs').promises;
    await fs.writeFile('bundle-analysis.md', report);

    logger.info('Bundle analysis report generated', {
      metadata: { reportPath: 'bundle-analysis.md' },
    });
  } catch (error) {
    logger.error('Failed to generate bundle report', error as Error);
  }
}

export default bundleAnalyzer;