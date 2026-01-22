# Master Programming Guide - LucaExpress 2nd

## Core Principle: File Size & Performance Optimization

**PRIMARY RULE:** If a file exceeds **1000 lines of actual code** (excluding comments, blank lines, and documentation), the file shall be ended at the last function in that section and a new file shall be created for the next section, named after the primary function it will contain.

### File Splitting Standards

1. **Code Line Count Threshold: 1000 lines**
   - Count only actual executable code (not comments or whitespace)
   - Use `wc -l` or IDE line counter to verify
   - Split at logical function boundaries, never in the middle of a function

2. **File Naming Convention After Split**
   ```
   Original: services.js (1200 lines) → Split into:
   - services-db.js (database functions)
   - services-cache.js (cache functions)
   - services-auth.js (authentication functions)
   ```

3. **Module Re-export Pattern**
   ```javascript
   // Original services.js becomes services/index.js
   // Each split file exports its functions
   module.exports = {
     ...require('./services-db'),
     ...require('./services-cache'),
     ...require('./services-auth')
   };
   ```

4. **Import Strategy**
   - Always import from the split file directly for parallel processing
   - Multi-core processors can load and process separate files simultaneously
   - Node.js cluster mode can be utilized for CPU-intensive operations

### Exceptions to File Splitting

Files that should **NOT** be split:

1. **Pre-downloaded/External Packages**
   - Any file from npm_modules
   - Third-party libraries that require integrity
   - Vendor code

2. **Integrated System Files**
   - Database schemas (must remain atomic)
   - Configuration files (must load as single unit)
   - Files marked with `// @no-split` comment

3. **Architecture Files**
   - Entry points (server.js, main.js)
   - Router aggregators (routes.js, index.js)
   - These may exceed 1000 lines only if unavoidable

### File Splitting Validation Checklist

When splitting a file, verify:

- [ ] All imports are updated in both new files
- [ ] All exports from original file are exported from new files
- [ ] Run syntax check: `node -c filename.js`
- [ ] Run functional tests for that module
- [ ] Update module path references in other files
- [ ] No circular dependencies created
- [ ] Performance improvement verified (if CPU-bound)

### Multi-Core Processing Benefits

When files are properly split:

```
Single File (1500 lines):
├─ Main thread: Parse 1500 lines (3.2 seconds)
└─ Wait for single core

Split Files (3x 500 lines):
├─ Core 1: services-db.js parse (0.8 seconds)
├─ Core 2: services-cache.js parse (0.8 seconds)
└─ Core 3: services-auth.js parse (0.8 seconds)
└─ Total: ~1 second (70% faster)
```

### Current Project Structure Standards

**Backend Organization:**
```
backend/
├─ api/
│  ├─ main.js (entry point)
│  ├─ routes.js (router aggregation)
│  └─ endpoints-*.js (specific endpoint groups, if split needed)
├─ agents/
│  ├─ base.js
│  ├─ company.js
│  ├─ it.js
│  └─ lobbying.js
├─ core/
│  ├─ auth.js
│  ├─ config.js
│  └─ llm_tier.js
├─ services/
│  ├─ index.js (re-export all)
│  ├─ db.js (database operations)
│  ├─ dlp.js (data loss prevention)
│  ├─ ollama_service.js
│  └─ queue.js
└─ workflows/
   ├─ chat.js
   └─ lobbying.js
```

**Frontend Organization:**
```
frontend/
├─ index.html (main entry)
├─ [feature]-page.html (one page per major feature)
├─ [feature]-setup.html (setup/wizard pages)
├─ components/
│  └─ [component]-card.js (reusable components)
└─ styles/
   └─ [feature]-styles.css (scoped styles)
```

### Monitoring File Size

Add to your development workflow:

```bash
# Check all project files
find . -name "*.js" -exec wc -l {} + | sort -rn | head -20

# Check specific file
wc -l services/db.js
```

### Refactoring Process

1. **Identify** files exceeding 1000 lines
2. **Plan** logical split points (at function boundaries)
3. **Create** new files with appropriate names
4. **Move** related functions to new files
5. **Update** exports/imports
6. **Test** each split individually
7. **Verify** no circular dependencies
8. **Document** the split in file headers
9. **Benchmark** if performance-critical
10. **Merge** PR with refactoring complete

### Performance Targets

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Single file parse | < 3.2 sec | node -c file.js |
| Module load time | < 100 ms | require() duration |
| Full app startup | < 5 sec | server boot time |
| Request routing | < 50 ms | first function call |

### Documentation Standards

Every split file should have header documentation:

```javascript
/**
 * Database Operations Module
 * 
 * Handles all database operations including:
 * - User CRUD operations
 * - Company data management
 * - Settings persistence
 * 
 * Original file: services.js
 * Split from: services/index.js
 * Functions count: 12
 * Lines of code: 487
 */

const sqlite3 = require('sqlite3');
// ... rest of file
```

### Version Control & Splitting

When splitting files in version control:

1. Create a feature branch: `git checkout -b refactor/file-split-services`
2. Split the file completely
3. Update ALL references
4. Test thoroughly
5. Commit with descriptive message:
   ```
   Refactor: Split services.js into focused modules
   
   - services-db.js: Database operations (487 lines)
   - services-cache.js: Cache management (234 lines)
   - services-auth.js: Authentication (279 lines)
   
   Maintains backward compatibility via services/index.js
   All tests passing.
   ```

### Enforcement & Tooling

To enforce this standard:

```javascript
// scripts/check-file-sizes.js
const fs = require('fs');
const path = require('path');

function countCodeLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content.split('\n')
    .filter(line => line.trim() && !line.trim().startsWith('//'))
    .filter(line => line.trim() !== '')
    .length;
}

const threshold = 1000;
// Run this in pre-commit hooks
```

---

## Quick Reference

| Question | Answer |
|----------|--------|
| **When to split?** | File exceeds 1000 actual code lines |
| **Where to split?** | At function boundaries |
| **How to name?** | `service-function-name.js` |
| **How to test?** | `node -c file.js` then functional tests |
| **How to re-export?** | Via index.js with require() spreading |
| **What not to split?** | External packages, config files, entry points |

---

**Document Version:** 1.0  
**Last Updated:** January 20, 2026  
**Author:** LucaExpress Development Team  
**Status:** Active - All new code must comply
