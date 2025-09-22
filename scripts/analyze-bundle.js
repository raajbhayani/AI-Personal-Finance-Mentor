#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes webpack bundle size and provides optimization recommendations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class BundleAnalyzer {
  constructor() {
    this.outputDir = path.join(process.cwd(), '.next');
    this.statsFile = path.join(this.outputDir, 'webpack-stats.json');
    this.reportFile = path.join(process.cwd(), 'bundle-analysis.md');
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m',
    };

    const prefix = {
      info: 'ℹ',
      success: '✓',
      warning: '⚠',
      error: '✗',
    };

    console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`);
  }

  formatSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  async buildWithStats() {
    this.log('Building application with webpack stats...');

    try {
      // Build with webpack bundle analyzer
      execSync('ANALYZE=true npm run build', {
        stdio: 'inherit',
        env: { ...process.env, ANALYZE: 'true' }
      });

      this.log('Build completed with stats', 'success');
    } catch (error) {
      this.log('Build failed', 'error');
      throw error;
    }
  }

  analyzeBuildOutput() {
    this.log('Analyzing build output...');

    const buildDir = path.join(process.cwd(), '.next');
    const staticDir = path.join(buildDir, 'static');

    if (!fs.existsSync(buildDir)) {
      throw new Error('Build directory not found. Run build first.');
    }

    const analysis = {
      chunks: [],
      assets: [],
      totalSize: 0,
      gzippedSize: 0,
      recommendations: [],
    };

    // Analyze JavaScript chunks
    if (fs.existsSync(staticDir)) {
      this.analyzeStaticAssets(staticDir, analysis);
    }

    // Read build manifest
    const manifestPath = path.join(buildDir, 'build-manifest.json');
    if (fs.existsSync(manifestPath)) {
      this.analyzeBuildManifest(manifestPath, analysis);
    }

    // Analyze package.json dependencies
    this.analyzeDependencies(analysis);

    return analysis;
  }

  analyzeStaticAssets(staticDir, analysis) {
    const walkDir = (dir, fileList = []) => {
      const files = fs.readdirSync(dir);

      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          walkDir(filePath, fileList);
        } else {
          const relativePath = path.relative(staticDir, filePath);
          const size = stat.size;

          fileList.push({
            path: relativePath,
            size,
            type: this.getAssetType(file),
          });

          analysis.totalSize += size;
        }
      });

      return fileList;
    };

    analysis.assets = walkDir(staticDir);

    // Sort by size
    analysis.assets.sort((a, b) => b.size - a.size);
  }

  getAssetType(filename) {
    const ext = path.extname(filename).toLowerCase();
    if (['.js', '.mjs'].includes(ext)) return 'javascript';
    if (['.css'].includes(ext)) return 'css';
    if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) return 'image';
    if (['.woff', '.woff2', '.ttf', '.eot'].includes(ext)) return 'font';
    return 'other';
  }

  analyzeBuildManifest(manifestPath, analysis) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

      // Analyze pages
      Object.entries(manifest.pages).forEach(([page, files]) => {
        const chunk = {
          name: page,
          files: files,
          size: 0,
          type: 'page',
        };

        // Calculate total size for this chunk
        files.forEach(file => {
          const assetPath = path.join(process.cwd(), '.next', file);
          if (fs.existsSync(assetPath)) {
            chunk.size += fs.statSync(assetPath).size;
          }
        });

        analysis.chunks.push(chunk);
      });

      analysis.chunks.sort((a, b) => b.size - a.size);
    } catch (error) {
      this.log('Failed to analyze build manifest', 'warning');
    }
  }

  analyzeDependencies(analysis) {
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
      );

      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Analyze large dependencies
      const largeDeps = [];
      Object.keys(dependencies).forEach(dep => {
        const depPath = path.join(process.cwd(), 'node_modules', dep);
        if (fs.existsSync(depPath)) {
          try {
            const depPackageJson = JSON.parse(
              fs.readFileSync(path.join(depPath, 'package.json'), 'utf8')
            );

            // Estimate size (rough calculation)
            const size = this.estimatePackageSize(depPath);
            largeDeps.push({
              name: dep,
              version: depPackageJson.version,
              size,
            });
          } catch {
            // Ignore errors reading individual packages
          }
        }
      });

      largeDeps.sort((a, b) => b.size - a.size);
      analysis.dependencies = largeDeps.slice(0, 20); // Top 20 largest
    } catch (error) {
      this.log('Failed to analyze dependencies', 'warning');
    }
  }

  estimatePackageSize(packagePath) {
    let totalSize = 0;

    const walkDir = (dir) => {
      try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);

          if (stat.isDirectory()) {
            // Skip certain directories
            if (!['node_modules', '.git', 'test', 'tests', '__tests__'].includes(file)) {
              walkDir(filePath);
            }
          } else {
            totalSize += stat.size;
          }
        });
      } catch {
        // Ignore errors
      }
    };

    walkDir(packagePath);
    return totalSize;
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    // Check for large chunks
    const largeChunks = analysis.chunks.filter(chunk => chunk.size > 300000); // 300KB
    if (largeChunks.length > 0) {
      recommendations.push(
        `Large chunks detected (${largeChunks.length}): Consider code splitting for ${largeChunks.map(c => c.name).join(', ')}`
      );
    }

    // Check for large dependencies
    const largeDeps = analysis.dependencies.filter(dep => dep.size > 500000); // 500KB
    if (largeDeps.length > 0) {
      recommendations.push(
        `Large dependencies found: ${largeDeps.map(d => `${d.name} (${this.formatSize(d.size)})`).join(', ')}`
      );
    }

    // Check total bundle size
    if (analysis.totalSize > 2000000) { // 2MB
      recommendations.push(
        `Total bundle size is large (${this.formatSize(analysis.totalSize)}). Consider implementing more aggressive code splitting.`
      );
    }

    // Check for common optimization opportunities
    const jsAssets = analysis.assets.filter(asset => asset.type === 'javascript');
    const largeJsAssets = jsAssets.filter(asset => asset.size > 200000); // 200KB

    if (largeJsAssets.length > 0) {
      recommendations.push(
        'Large JavaScript assets detected. Consider tree shaking and dynamic imports.'
      );
    }

    // Check for image optimization
    const imageAssets = analysis.assets.filter(asset => asset.type === 'image');
    const largeImages = imageAssets.filter(asset => asset.size > 100000); // 100KB

    if (largeImages.length > 0) {
      recommendations.push(
        `Large images found (${largeImages.length}). Consider image optimization and modern formats (WebP, AVIF).`
      );
    }

    return recommendations;
  }

  generateReport(analysis) {
    const recommendations = this.generateRecommendations(analysis);

    let report = '# Bundle Analysis Report\\n\\n';
    report += `Generated on: ${new Date().toISOString()}\\n\\n`;

    // Summary
    report += '## Summary\\n\\n';
    report += `- **Total Size**: ${this.formatSize(analysis.totalSize)}\\n`;
    report += `- **Total Assets**: ${analysis.assets.length}\\n`;
    report += `- **Total Chunks**: ${analysis.chunks.length}\\n\\n`;

    // Largest chunks
    if (analysis.chunks.length > 0) {
      report += '## Largest Chunks\\n\\n';
      report += '| Chunk | Size | Files |\\n';
      report += '|-------|------|-------|\\n';

      analysis.chunks.slice(0, 10).forEach(chunk => {
        report += `| ${chunk.name} | ${this.formatSize(chunk.size)} | ${chunk.files ? chunk.files.length : 'N/A'} |\\n`;
      });
      report += '\\n';
    }

    // Largest assets
    if (analysis.assets.length > 0) {
      report += '## Largest Assets\\n\\n';
      report += '| Asset | Type | Size |\\n';
      report += '|-------|------|------|\\n';

      analysis.assets.slice(0, 15).forEach(asset => {
        report += `| ${asset.path} | ${asset.type} | ${this.formatSize(asset.size)} |\\n`;
      });
      report += '\\n';
    }

    // Dependencies
    if (analysis.dependencies.length > 0) {
      report += '## Largest Dependencies\\n\\n';
      report += '| Package | Version | Estimated Size |\\n';
      report += '|---------|---------|----------------|\\n';

      analysis.dependencies.slice(0, 10).forEach(dep => {
        report += `| ${dep.name} | ${dep.version} | ${this.formatSize(dep.size)} |\\n`;
      });
      report += '\\n';
    }

    // Asset breakdown by type
    const assetsByType = {};
    analysis.assets.forEach(asset => {
      if (!assetsByType[asset.type]) {
        assetsByType[asset.type] = { count: 0, size: 0 };
      }
      assetsByType[asset.type].count++;
      assetsByType[asset.type].size += asset.size;
    });

    report += '## Assets by Type\\n\\n';
    report += '| Type | Count | Total Size |\\n';
    report += '|------|-------|------------|\\n';

    Object.entries(assetsByType).forEach(([type, stats]) => {
      report += `| ${type} | ${stats.count} | ${this.formatSize(stats.size)} |\\n`;
    });
    report += '\\n';

    // Recommendations
    if (recommendations.length > 0) {
      report += '## Recommendations\\n\\n';
      recommendations.forEach((rec, index) => {
        report += `${index + 1}. ${rec}\\n`;
      });
      report += '\\n';
    }

    // Additional optimization tips
    report += '## Optimization Tips\\n\\n';
    report += '- Use dynamic imports for code splitting\\n';
    report += '- Implement tree shaking for unused code elimination\\n';
    report += '- Optimize images using Next.js Image component\\n';
    report += '- Consider using a CDN for static assets\\n';
    report += '- Enable gzip/brotli compression\\n';
    report += '- Use bundle analyzer regularly to monitor changes\\n';

    return report;
  }

  async run() {
    try {
      this.log('Starting bundle analysis...');

      // Check if build exists, if not create it
      if (!fs.existsSync(this.outputDir)) {
        await this.buildWithStats();
      } else {
        this.log('Using existing build. Run with --rebuild to force rebuild.');
      }

      const analysis = this.analyzeBuildOutput();
      const report = this.generateReport(analysis);

      // Write report to file
      fs.writeFileSync(this.reportFile, report);

      this.log(`Bundle analysis completed!`, 'success');
      this.log(`Report saved to: ${this.reportFile}`, 'success');
      this.log(`Total bundle size: ${this.formatSize(analysis.totalSize)}`, 'info');

      // Show top recommendations
      const recommendations = this.generateRecommendations(analysis);
      if (recommendations.length > 0) {
        this.log('Top recommendations:', 'warning');
        recommendations.slice(0, 3).forEach((rec, index) => {
          this.log(`  ${index + 1}. ${rec}`, 'warning');
        });
      }

    } catch (error) {
      this.log(`Bundle analysis failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  analyzer.run();
}

module.exports = BundleAnalyzer;