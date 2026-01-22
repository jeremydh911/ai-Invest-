/**
 * AGENTIC EMPIRE - Complete Branding Replacement
 * 
 * Replace all "Agentic Empire" and "Luca" references with "Agentic Empire"
 * across all source files, documentation, and configuration files
 */

const fs = require('fs');
const path = require('path');

class BrandingUpdater {
  constructor() {
    this.replacements = [
      { old: /Agentic Empire/gi, new: 'Agentic Empire' },
      { old: /agentic-empire/gi, new: 'agentic-empire' },
      { old: /agentic_empire/gi, new: 'agentic_empire' },
      { old: /AgenticEmpire/gi, new: 'AgenticEmpire' },
      { old: /AgenticEmpire/gi, new: 'agenticempire' },
      // Preserve proper "Luca" where it's part of comments about "Luca" the person
      // but replace most other instances
    ];
    this.stats = {
      filesProcessed: 0,
      replacementsMade: 0,
      filesChanged: [],
      errors: []
    };
  }

  /**
   * Process all files in the workspace
   */
  async rebrandAll() {
    console.log('\n' + '='.repeat(80));
    console.log('🏷️  AGENTIC EMPIRE - COMPLETE REBRANDING');
    console.log('='.repeat(80) + '\n');

    const rootDir = path.join(__dirname);
    
    // File patterns to process
    const patterns = [
      '**/*.js',
      '**/*.json',
      '**/*.md',
      '**/*.html',
      '**/*.css',
      '**/*.yaml',
      '**/*.yml',
      '**/*.ts'
    ];

    // Directories to scan
    const dirsToScan = [
      path.join(rootDir, 'services'),
      path.join(rootDir, 'api'),
      path.join(rootDir, 'workflows'),
      path.join(rootDir, 'k8s'),
      path.join(rootDir, 'prisma'),
      rootDir // Root directory for markdown files
    ];

    console.log('📁 Processing files...\n');

    for (const dir of dirsToScan) {
      if (fs.existsSync(dir)) {
        this.processDirectory(dir);
      }
    }

    this.generateReport();
  }

  /**
   * Recursively process directory
   */
  processDirectory(dir) {
    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        // Skip node_modules and hidden directories
        if (item.startsWith('.') || item === 'node_modules' || item === 'dist' || item === 'build') {
          continue;
        }

        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          this.processDirectory(fullPath);
        } else if (this.shouldProcess(fullPath)) {
          this.processFile(fullPath);
        }
      }
    } catch (error) {
      this.stats.errors.push(`Directory error ${dir}: ${error.message}`);
    }
  }

  /**
   * Check if file should be processed
   */
  shouldProcess(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const processableExtensions = [
      '.js', '.json', '.md', '.html', '.css', 
      '.yaml', '.yml', '.ts', '.ps1', '.sh'
    ];
    return processableExtensions.includes(ext);
  }

  /**
   * Process single file
   */
  processFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;

      // Apply all replacements
      for (const replacement of this.replacements) {
        const matches = (content.match(replacement.old) || []).length;
        if (matches > 0) {
          content = content.replace(replacement.old, replacement.new);
          this.stats.replacementsMade += matches;
        }
      }

      // Write if changes were made
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        const relativePath = path.relative(path.join(__dirname), filePath);
        const changeCount = (originalContent.match(/Luca|luca/g) || []).length;
        this.stats.filesChanged.push({
          file: relativePath,
          changes: changeCount
        });
        console.log(`  ✅ ${relativePath} - ${changeCount} replacements`);
      }

      this.stats.filesProcessed++;
    } catch (error) {
      const relativePath = path.relative(path.join(__dirname), filePath);
      this.stats.errors.push(`File error ${relativePath}: ${error.message}`);
      console.log(`  ❌ ${relativePath} - Error: ${error.message}`);
    }
  }

  /**
   * Generate report
   */
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 REBRANDING REPORT');
    console.log('='.repeat(80));

    console.log(`\n📈 Statistics:`);
    console.log(`  Files Processed: ${this.stats.filesProcessed}`);
    console.log(`  Files Changed: ${this.stats.filesChanged.length}`);
    console.log(`  Total Replacements: ${this.stats.replacementsMade}`);
    console.log(`  Errors: ${this.stats.errors.length}`);

    if (this.stats.filesChanged.length > 0) {
      console.log(`\n📝 Changed Files:`);
      this.stats.filesChanged.forEach(file => {
        console.log(`  • ${file.file} (${file.changes} changes)`);
      });
    }

    if (this.stats.errors.length > 0) {
      console.log(`\n⚠️  Errors:`);
      this.stats.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ REBRANDING COMPLETE');
    console.log('   All "Agentic Empire" references replaced with "Agentic Empire"');
    console.log('='.repeat(80) + '\n');

    // Save report
    const reportPath = path.join(__dirname, 'REBRANDING_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.stats, null, 2));
    console.log(`📄 Report saved to: REBRANDING_REPORT.json\n`);
  }
}

// Run rebranding
const updater = new BrandingUpdater();
updater.rebrandAll().catch(error => {
  console.error('Rebranding error:', error);
  process.exit(1);
});

module.exports = BrandingUpdater;
