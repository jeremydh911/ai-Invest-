/**
 * Automated Data Handling & Retention Service
 * Manages data cleanup, archiving, and retention policies
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

class DataHandlingService {
  constructor(dbPath = 'data/app.db') {
    this.dbPath = dbPath;
    this.db = new sqlite3.Database(dbPath);
    this.retentionPolicies = this.getDefaultPolicies();
    this.archiveDir = path.join(process.cwd(), 'data', 'archives');
    this.ensureArchiveDir();
  }

  /**
   * Get default data retention policies
   */
  getDefaultPolicies() {
    return {
      logs: {
        retention: '30 days',
        days: 30,
        action: 'delete',
        priority: 'low'
      },
      failedJobs: {
        retention: '7 days',
        days: 7,
        action: 'delete',
        priority: 'medium'
      },
      tempFiles: {
        retention: '1 day',
        days: 1,
        action: 'delete',
        priority: 'high'
      },
      sessionData: {
        retention: '90 days',
        days: 90,
        action: 'archive',
        priority: 'low'
      },
      tradeHistory: {
        retention: '1 year',
        days: 365,
        action: 'archive',
        priority: 'high'
      },
      auditLogs: {
        retention: '2 years',
        days: 730,
        action: 'archive',
        priority: 'critical'
      },
      backups: {
        retention: '30 days',
        days: 30,
        action: 'delete',
        priority: 'medium'
      },
      cacheData: {
        retention: '7 days',
        days: 7,
        action: 'delete',
        priority: 'low'
      }
    };
  }

  /**
   * Ensure archive directory exists
   */
  ensureArchiveDir() {
    if (!fs.existsSync(this.archiveDir)) {
      fs.mkdirSync(this.archiveDir, { recursive: true });
    }
  }

  /**
   * Clean up old logs
   */
  async cleanupLogs() {
    console.log('[DATA CLEANUP] Starting log cleanup...');

    return new Promise((resolve, reject) => {
      const policy = this.retentionPolicies.logs;
      const cutoffDate = new Date(Date.now() - policy.days * 24 * 60 * 60 * 1000);

      this.db.run(
        `DELETE FROM logs WHERE timestamp < datetime(?)`,
        [cutoffDate.toISOString()],
        (err) => {
          if (err) {
            console.error('[DATA CLEANUP] Log cleanup failed:', err.message);
            reject(err);
          } else {
            console.log('[DATA CLEANUP] Logs older than ' + policy.retention + ' deleted');
            resolve();
          }
        }
      );
    });
  }

  /**
   * Clean up failed jobs
   */
  async cleanupFailedJobs() {
    console.log('[DATA CLEANUP] Starting failed job cleanup...');

    return new Promise((resolve, reject) => {
      const policy = this.retentionPolicies.failedJobs;
      const cutoffDate = new Date(Date.now() - policy.days * 24 * 60 * 60 * 1000);

      this.db.run(
        `DELETE FROM job_logs WHERE status = 'failed' AND timestamp < datetime(?)`,
        [cutoffDate.toISOString()],
        (err) => {
          if (err) {
            console.error('[DATA CLEANUP] Failed job cleanup error:', err.message);
            reject(err);
          } else {
            console.log('[DATA CLEANUP] Failed jobs older than ' + policy.retention + ' deleted');
            resolve();
          }
        }
      );
    });
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles() {
    console.log('[DATA CLEANUP] Starting temporary file cleanup...');

    const tempDirs = [
      path.join(process.cwd(), 'tmp'),
      path.join(process.cwd(), 'uploads', 'temp'),
      path.join(process.cwd(), 'audio')
    ];

    const policy = this.retentionPolicies.tempFiles;
    const cutoffTime = Date.now() - policy.days * 24 * 60 * 60 * 1000;

    let deletedCount = 0;

    for (const dir of tempDirs) {
      if (!fs.existsSync(dir)) continue;

      try {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const filepath = path.join(dir, file);
          const stats = fs.statSync(filepath);

          if (stats.mtimeMs < cutoffTime) {
            fs.unlinkSync(filepath);
            deletedCount++;
          }
        }
      } catch (err) {
        console.warn(`[DATA CLEANUP] Error cleaning ${dir}:`, err.message);
      }
    }

    console.log(`[DATA CLEANUP] Deleted ${deletedCount} temporary files`);
  }

  /**
   * Archive old session data
   */
  async archiveSessionData() {
    console.log('[DATA CLEANUP] Starting session data archival...');

    return new Promise((resolve, reject) => {
      const policy = this.retentionPolicies.sessionData;
      const cutoffDate = new Date(Date.now() - policy.days * 24 * 60 * 60 * 1000);

      // Export to archive
      this.db.all(
        `SELECT * FROM sessions WHERE last_activity < datetime(?)`,
        [cutoffDate.toISOString()],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          if (rows && rows.length > 0) {
            const archiveFile = path.join(
              this.archiveDir,
              `sessions_${Date.now()}.json.gz`
            );

            // Save archive (simplified - in production use gzip)
            fs.writeFileSync(archiveFile, JSON.stringify(rows, null, 2));

            // Delete archived data
            this.db.run(
              `DELETE FROM sessions WHERE last_activity < datetime(?)`,
              [cutoffDate.toISOString()],
              (err) => {
                if (err) {
                  reject(err);
                } else {
                  console.log(`[DATA CLEANUP] Archived ${rows.length} sessions`);
                  resolve();
                }
              }
            );
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Archive old trade history
   */
  async archiveTradeHistory() {
    console.log('[DATA CLEANUP] Starting trade history archival...');

    return new Promise((resolve, reject) => {
      const policy = this.retentionPolicies.tradeHistory;
      const cutoffDate = new Date(Date.now() - policy.days * 24 * 60 * 60 * 1000);

      this.db.all(
        `SELECT * FROM trades WHERE created_at < datetime(?) AND status = 'completed'`,
        [cutoffDate.toISOString()],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          if (rows && rows.length > 0) {
            const archiveFile = path.join(
              this.archiveDir,
              `trades_${Date.now()}.json.gz`
            );

            fs.writeFileSync(archiveFile, JSON.stringify(rows, null, 2));

            // Move to archived_trades table or delete
            this.db.run(
              `DELETE FROM trades WHERE created_at < datetime(?) AND status = 'completed'`,
              [cutoffDate.toISOString()],
              (err) => {
                if (err) {
                  reject(err);
                } else {
                  console.log(`[DATA CLEANUP] Archived ${rows.length} trades`);
                  resolve();
                }
              }
            );
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Archive audit logs (never delete these)
   */
  async archiveAuditLogs() {
    console.log('[DATA CLEANUP] Starting audit log archival...');

    return new Promise((resolve, reject) => {
      const policy = this.retentionPolicies.auditLogs;
      const cutoffDate = new Date(Date.now() - policy.days * 24 * 60 * 60 * 1000);

      this.db.all(
        `SELECT * FROM audit_logs WHERE timestamp < datetime(?)`,
        [cutoffDate.toISOString()],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          if (rows && rows.length > 0) {
            const archiveFile = path.join(
              this.archiveDir,
              `audit_${Date.now()}.json.gz`
            );

            fs.writeFileSync(archiveFile, JSON.stringify(rows, null, 2));
            console.log(`[DATA CLEANUP] Archived ${rows.length} audit logs`);
          }

          resolve();
        }
      );
    });
  }

  /**
   * Clean up old cache data
   */
  async cleanupCacheData() {
    console.log('[DATA CLEANUP] Starting cache cleanup...');

    return new Promise((resolve, reject) => {
      const policy = this.retentionPolicies.cacheData;
      const cutoffDate = new Date(Date.now() - policy.days * 24 * 60 * 60 * 1000);

      this.db.run(
        `DELETE FROM cache WHERE created_at < datetime(?) OR expires_at < datetime('now')`,
        [cutoffDate.toISOString()],
        (err) => {
          if (err) {
            console.error('[DATA CLEANUP] Cache cleanup error:', err.message);
            reject(err);
          } else {
            console.log('[DATA CLEANUP] Cache cleaned');
            resolve();
          }
        }
      );
    });
  }

  /**
   * Optimize database
   */
  async optimizeDatabase() {
    console.log('[DATA CLEANUP] Starting database optimization...');

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Analyze query performance
        this.db.run('ANALYZE', (err) => {
          if (err) console.error('[DB] ANALYZE error:', err);
        });

        // Rebuild indices
        this.db.run('REINDEX', (err) => {
          if (err) console.error('[DB] REINDEX error:', err);
        });

        // Reclaim space
        this.db.run('VACUUM', (err) => {
          if (err) {
            reject(err);
          } else {
            console.log('[DATA CLEANUP] Database optimized');
            resolve();
          }
        });
      });
    });
  }

  /**
   * Clean up old backup files
   */
  async cleanupOldBackups() {
    console.log('[DATA CLEANUP] Starting backup cleanup...');

    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) return;

    const policy = this.retentionPolicies.backups;
    const cutoffTime = Date.now() - policy.days * 24 * 60 * 60 * 1000;

    let deletedCount = 0;

    try {
      const files = fs.readdirSync(backupDir);
      
      for (const file of files) {
        const filepath = path.join(backupDir, file);
        const stats = fs.statSync(filepath);

        if (stats.mtimeMs < cutoffTime) {
          fs.unlinkSync(filepath);
          deletedCount++;
        }
      }

      console.log(`[DATA CLEANUP] Deleted ${deletedCount} old backups`);
    } catch (err) {
      console.error('[DATA CLEANUP] Backup cleanup error:', err.message);
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        let stats = { tables: {} };

        this.db.all(
          `SELECT name FROM sqlite_master WHERE type='table'`,
          (err, tables) => {
            if (err) return reject(err);

            let completed = 0;

            tables.forEach(table => {
              this.db.get(
                `SELECT COUNT(*) as count FROM ${table.name}`,
                (err, row) => {
                  if (!err) {
                    stats.tables[table.name] = row.count;
                  }

                  completed++;
                  if (completed === tables.length) {
                    resolve(stats);
                  }
                }
              );
            });
          }
        );
      });
    });
  }

  /**
   * Run all cleanup operations
   */
  async runAllCleanup() {
    console.log('\n' + '='.repeat(60));
    console.log('[DATA CLEANUP] Starting comprehensive data cleanup');
    console.log('='.repeat(60));

    const startTime = Date.now();

    try {
      await this.cleanupLogs();
      await this.cleanupFailedJobs();
      await this.cleanupTempFiles();
      await this.cleanupCacheData();
      await this.archiveSessionData();
      await this.archiveTradeHistory();
      await this.archiveAuditLogs();
      await this.cleanupOldBackups();
      await this.optimizeDatabase();

      const duration = Date.now() - startTime;
      const stats = await this.getDatabaseStats();

      console.log('\n[DATA CLEANUP] Cleanup completed successfully');
      console.log(`[DATA CLEANUP] Duration: ${duration}ms`);
      console.log('[DATA CLEANUP] Database statistics:', stats);
      console.log('='.repeat(60));

      return {
        success: true,
        duration,
        stats,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      console.error('[DATA CLEANUP] Cleanup failed:', err.message);
      throw err;
    }
  }

  /**
   * Schedule automatic cleanup
   */
  scheduleAutomaticCleanup(cronTime = '0 3 * * *') { // 3 AM daily
    const schedule = require('node-schedule');

    schedule.scheduleJob(cronTime, async () => {
      console.log('[SCHEDULER] Running scheduled data cleanup');
      
      try {
        await this.runAllCleanup();
      } catch (err) {
        console.error('[SCHEDULER] Scheduled cleanup failed:', err.message);
      }
    });

    console.log(`[SCHEDULER] Data cleanup scheduled for: ${cronTime}`);
  }

  /**
   * Get cleanup status
   */
  async getStatus() {
    const stats = await this.getDatabaseStats();
    const archiveFiles = fs.readdirSync(this.archiveDir);

    return {
      policies: this.retentionPolicies,
      databaseStats: stats,
      archives: {
        count: archiveFiles.length,
        location: this.archiveDir,
        files: archiveFiles
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Close database connection
   */
  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = DataHandlingService;
