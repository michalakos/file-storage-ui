<template>
  <div class="admin-logs">
    <header class="logs-header">
      <div class="header-content">
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.logs-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.dashboard-btn {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.page-title {
  margin: 0;
  color: #2d3748;
  font-size: 2rem;
}

.pause-btn {
  background: #48bb78;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.pause-btn.paused {
  background: #f56565;
}

.logs-controls {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.log-slider {
  flex: 1;
  max-width: 300px;
}

.log-desc {
  margin: 0 0 0.5rem 0;
  color: #4a5568;
  line-height: 1.5;
  word-break: break-word;
  max-height: 3.6em; /* Roughly 3 lines */
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.log-desc.expanded {
  max-height: none;
}

.expand-indicator {
  font-size: 0.75rem;
  color: #667eea;
  font-weight: 600;
  margin-top: 0.25rem;
  user-select: none;
}

.log-content {
  flex: 1;
}

.log-item {
  display: flex;
  align-items: flex-start;
  padding: 1.5rem;
  background: #f7fafc;
  border-radius: 8px;
  border-left: 4px solid #e2e8f0;
  transition: all 0.3s ease;
}

.log-item.expandable {
  cursor: pointer;
}

.log-item.expandable:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: rgba(68, 29, 120, 0.2);
}

.logs-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-height: 70vh;
  overflow-y: auto;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.log-item {
  display: flex;
  align-items: flex-start;
  padding: 1.5rem;
  background: #f7fafc;
  border-radius: 8px;
  border-left: 4px solid #e2e8f0;
}

.log-item.error {
  border-left-color: #f56565;
  background: #fed7d7;
}

.log-item.warning {
  border-left-color: #ed8936;
  background: #feebc8;
}

.log-item.info {
  border-left-color: #4299e1;
  background: #bee3f8;
}

.log-item.debug {
  border-left-color: #9f7aea;
  background: #e9d8fd;
}

.log-icon {
  font-size: 1.5rem;
  margin-right: 1rem;
  flex-shrink: 0;
}

.log-content {
  flex: 1;
}

.log-content h4 {
  margin: 0 0 0.5rem 0;
  color: #2d3748;
  font-size: 1.1rem;
  font-weight: 600;
}

.log-desc {
  margin: 0 0 0.5rem 0;
  color: #4a5568;
  line-height: 1.5;
  word-break: break-word;
}

.log-time {
  margin: 0;
  color: #718096;
  font-size: 0.875rem;
}

.log-status {
  margin-left: 1rem;
  flex-shrink: 0;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.error {
  background: #f56565;
  color: white;
}

.status-badge.warning {
  background: #ed8936;
  color: white;
}

.status-badge.info {
  background: #4299e1;
  color: white;
}

.status-badge.debug {
  background: #9f7aea;
  color: white;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 3rem;
  color: white;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.btn-outline {
  background: transparent;
  color: white;
  border: 2px solid white;
}

.button-group {
  display: flex;
  gap: 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #d1d5db;
  margin-left: 1rem;
}

.count-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: white;
  color: #374151;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  border-right: 1px solid #d1d5db;
  min-width: 50px;
}

.count-btn:last-child {
  border-right: none;
}

.count-btn:hover {
  background: #f3f4f6;
}

.count-btn.active {
  background: #667eea;
  color: white;
}

.count-btn.active:hover {
  background: #5a67d8;
}
</style>
