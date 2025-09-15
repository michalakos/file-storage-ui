<template>
  <div class="admin-logs container">
    <header class="logs-header">
      <div class="header header-content">
        <button @click="goToDashboard" class="dashboard-btn">← Back to Dashboard</button>
        <h1 class="page-title">System Logs</h1>
        <div class="header-controls">
          <button @click="toggleAutoRefresh" :class="['pause-btn', { paused: !isAutoRefreshing }]">
            {{ isAutoRefreshing ? 'Pause' : 'Resume' }}
          </button>
        </div>
      </div>
    </header>

    <div class="logs-controls">
      <span>Number of logs:</span>
      <div class="button-group">
        <button
          v-for="count in [10, 25, 50, 100, 200]"
          :key="count"
          @click="setLogCount(count)"
          :class="['count-btn', { active: logCount == count }]"
        >
          {{ count }}
        </button>
      </div>
    </div>

    <main class="logs-main">
      <div v-if="loading && logs.length === 0" class="loading-state">
        <p>Loading logs...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="loadLogs" class="btn btn-outline">Try Again</button>
      </div>

      <div v-else class="logs-content">
        <div class="logs-list">
          <div
            v-for="log in logs"
            :key="log.id"
            class="log-item"
            :class="[log.type, { expandable: isLogExpandable(log) }]"
            @click="isLogExpandable(log) ? toggleLogExpansion(log.id) : null"
          >
            <div class="log-icon" :class="log.type">
              {{ getLogIcon(log.type) }}
            </div>
            <div class="log-content">
              <h4>{{ log.level }} - {{ log.className }}</h4>
              <p
                class="log-desc"
                :class="{ expanded: isLogExpanded(log.id) }"
                style="white-space: pre-line"
              >
                {{ log.message }}
              </p>
              <p class="log-time">{{ formatTimestamp(log.timestamp) }}</p>
              <div class="expand-indicator" v-if="isLogExpandable(log)">
                {{ isLogExpanded(log.id) ? '▲ Click to collapse' : '▼ Click to expand' }}
              </div>
            </div>
            <div class="log-status">
              <span class="status-badge" :class="log.type">
                {{ log.level }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { getAuthService } from '@/services/authService'
import { getAdminApiService } from '@/services/adminService'

export default {
  name: 'AdminLogs',
  data() {
    return {
      maxLogSize: 200,
      logs: [],
      logCount: 10,
      expandedLogs: new Set(),
      loading: false,
      error: null,
      refreshInterval: null,
      isAutoRefreshing: true,
    }
  },

  async mounted() {
    const authService = getAuthService()

    if (!authService.isAuthenticated() || !authService.isAdmin()) {
      this.$router.push('/dashboard')
      return
    }

    await this.loadLogs()
    this.startAutoRefresh()
  },

  beforeUnmount() {
    this.stopAutoRefresh()
  },

  methods: {
    async loadLogs() {
      try {
        this.loading = true
        this.error = null
        const adminService = getAdminApiService()
        const logsString = await adminService.getLogs(this.logCount)
        this.logs = this.parseLogsToObjects(logsString)
      } catch (error) {
        console.error('Failed to load logs:', error)
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    isLogExpandable(log) {
      return log.message.length > this.maxLogSize || log.message.includes('\n')
    },

    toggleLogExpansion(logId) {
      const log = this.logs.find((l) => l.id === logId)

      if (log && log.message.length <= this.maxLogSize && !log.message.includes('\n')) {
        return
      }

      if (this.expandedLogs.has(logId)) {
        this.expandedLogs.delete(logId)
      } else {
        this.expandedLogs.add(logId)
      }

      if (this.expandedLogs.size == 0) {
        this.startAutoRefresh()
      } else {
        this.stopAutoRefresh()
      }
    },

    isLogExpanded(logId) {
      return this.expandedLogs.has(logId)
    },

    parseLogsToObjects(logString) {
      const lines = logString.split('\n').filter((line) => line.trim())
      const logEntries = []
      let currentLog = null

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const logMatch = line.match(
          /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[([^\]]+)\] (\w+)\s+(.+?) - (.+)$/,
        )

        if (logMatch) {
          // Start of new log entry
          if (currentLog) {
            logEntries.push(this.createLogObject(currentLog))
          }

          const [, timestamp, , level, className, message] = logMatch
          currentLog = {
            timestamp,
            level,
            className,
            message: message.trim(),
          }
        } else if (currentLog && line.trim()) {
          // Continuation of previous log entry
          currentLog.message += '\n' + line.trim()
        }
      }

      // Don't forget the last log entry
      if (currentLog) {
        logEntries.push(this.createLogObject(currentLog))
      }

      return logEntries
    },

    createLogObject(log) {
      return {
        id: Date.now() + Math.random(),
        timestamp: log.timestamp,
        level: log.level,
        className: this.getShortClassName(log.className),
        message: log.message,
        type: this.mapLogLevelToType(log.level.toLowerCase()),
      }
    },

    getShortClassName(className) {
      if (className.includes('.')) {
        return className.split('.').pop()
      }
      return className
    },

    mapLogLevelToType(level) {
      const mapping = {
        error: 'error',
        warn: 'warning',
        info: 'info',
        debug: 'debug',
        trace: 'debug',
      }
      return mapping[level] || 'info'
    },

    getLogIcon(type) {
      const icons = {
        error: '🚨',
        warning: '⚠️',
        info: 'ℹ️',
        debug: '🔍',
      }
      return icons[type] || 'ℹ️'
    },

    formatTimestamp(timestamp) {
      const logTime = new Date(timestamp)
      const now = new Date()
      const diffMs = now - logTime
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMins / 60)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins} minutes ago`
      if (diffHours < 24) return `${diffHours} hours ago`
      return logTime.toLocaleDateString() + ' ' + logTime.toLocaleTimeString()
    },

    async updateLogCount() {
      await this.loadLogs()
    },

    startAutoRefresh() {
      if (!this.refreshInterval) {
        this.refreshInterval = setInterval(() => {
          this.loadLogs()
        }, 1000)
        this.isAutoRefreshing = true
      }
    },

    stopAutoRefresh() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval)
        this.refreshInterval = null
        this.isAutoRefreshing = false
      }
    },

    toggleAutoRefresh() {
      if (this.isAutoRefreshing) {
        this.stopAutoRefresh()
      } else {
        this.startAutoRefresh()
      }
    },

    setLogCount(count) {
      this.logCount = count
      this.updateLogCount()
    },

    goToDashboard() {
      this.$router.push('/dashboard')
    },
  },
}
</script>

<style scoped>
.admin-logs {
  min-height: 100vh;
  background: var(--color-cream-light);
  padding: var(--space-xl);
}

.logs-header {
  margin-bottom: var(--space-xl);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.dashboard-btn {
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 600;
  font-family: var(--font-system);
  transition: background-color var(--transition-base);
}

.dashboard-btn:hover {
  background: var(--color-brown);
}

.page-title {
  margin: 0;
  color: var(--color-brown-dark);
  font-size: var(--text-3xl);
}

.pause-btn {
  background: var(--color-success);
  color: var(--color-white);
  border: none;
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 600;
  font-family: var(--font-system);
  width: 100px;
  transition: background-color var(--transition-base);
}

.pause-btn.paused {
  background: var(--color-error);
}

.logs-controls {
  background: var(--color-white);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-xl);
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.logs-content {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  box-shadow: var(--shadow-md);
  max-height: 70vh;
  overflow-y: auto;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.log-item {
  display: flex;
  align-items: flex-start;
  padding: var(--space-lg);
  background: var(--color-gray-50);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--color-gray-300);
  transition: all var(--transition-base);
}

.log-item.expandable {
  cursor: pointer;
}

.log-item.expandable:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-lg);
  background: var(--color-cream-light);
}

.log-item.error {
  border-left-color: var(--color-error);
  background: var(--color-error-bg);
}

.log-item.warning {
  border-left-color: var(--color-warning);
  background: var(--color-warning-bg);
}

.log-item.info {
  border-left-color: var(--color-info);
  background: var(--color-info-bg);
}

.log-item.debug {
  border-left-color: var(--color-secondary);
  background: var(--color-sage-light);
}

.log-icon {
  font-size: var(--text-xl);
  margin-right: var(--space-md);
  flex-shrink: 0;
}

.log-content {
  flex: 1;
}

.log-content h4 {
  margin: 0 0 var(--space-sm) 0;
  color: var(--color-text-primary);
  font-size: var(--text-lg);
  font-weight: 600;
}

.log-desc {
  margin: 0 0 var(--space-sm) 0;
  color: var(--color-text-secondary);
  line-height: 1.5;
  word-break: break-word;
  max-height: 3.6em;
  overflow: hidden;
  transition: max-height var(--transition-slow);
}

.log-desc.expanded {
  max-height: none;
}

.log-time {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.expand-indicator {
  font-size: var(--text-xs);
  color: var(--color-primary);
  font-weight: 600;
  margin-top: var(--space-xs);
  user-select: none;
}

.log-status {
  margin-left: var(--space-md);
  flex-shrink: 0;
}

.status-badge {
  padding: var(--space-xs) var(--space-sm);
  border-radius: 20px;
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.error {
  background: var(--color-error);
  color: var(--color-white);
}

.status-badge.warning {
  background: var(--color-warning);
  color: var(--color-white);
}

.status-badge.info {
  background: var(--color-info);
  color: var(--color-white);
}

.status-badge.debug {
  background: var(--color-secondary);
  color: var(--color-white);
}

.loading-state,
.error-state {
  text-align: center;
  padding: var(--space-3xl);
  color: var(--color-text-primary);
}

.button-group {
  display: flex;
  gap: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-gray-300);
  margin-left: var(--space-md);
}

.count-btn {
  padding: var(--space-sm) var(--space-md);
  border: none;
  background: var(--color-white);
  color: var(--color-text-primary);
  cursor: pointer;
  font-weight: 500;
  font-family: var(--font-system);
  transition: all var(--transition-base);
  border-right: 1px solid var(--color-gray-300);
  min-width: 50px;
}

.count-btn:last-child {
  border-right: none;
}

.count-btn:hover {
  background: var(--color-gray-50);
}

.count-btn.active {
  background: var(--color-primary);
  color: var(--color-white);
}

.count-btn.active:hover {
  background: var(--color-brown);
}
</style>
