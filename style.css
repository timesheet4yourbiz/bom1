:root {
  --bg-color: #f8fafc;
  --card-bg: #ffffff;
  --text-main: #0f172a;
  --text-muted: #64748b;
  --border-color: #e2e8f0;
  --primary-color: #2563eb;
  --primary-hover: #1d4ed8;
  --code-color: #0284c7;
  --table-header-bg: #f1f5f9;
  --row-hover: #f8fafc;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

body {
  background-color: var(--bg-color);
  color: var(--text-main);
  padding: 24px 16px;
  line-height: 1.5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

/* Header */
.app-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 24px;
}

@media (min-width: 768px) {
  .app-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.header-title h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-main);
}

.header-title p {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.stats-container {
  display: flex;
  gap: 12px;
}

.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--primary-color);
}

/* Panel Kontrol */
.control-panel {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

@media (min-width: 768px) {
  .control-panel {
    grid-template-columns: 1fr 1fr;
  }
}

.control-group label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--text-main);
}

.control-group select,
.control-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.875rem;
  background-color: var(--card-bg);
  color: var(--text-main);
  outline: none;
  transition: border-color 0.2s;
}

.control-group select:focus,
.control-group input:focus {
  border-color: var(--primary-color);
}

.control-group input:disabled,
.control-group select:disabled {
  background-color: #f1f5f9;
  cursor: not-allowed;
}

/* Tabel Card */
.table-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.table-responsive {
  overflow-x: auto;
  width: 100%;
}

.bom-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.875rem;
}

.bom-table th {
  background-color: var(--table-header-bg);
  color: var(--text-muted);
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 12px 10px;
  border-bottom: 1px solid var(--border-color);
  white-space: nowrap;
}

.bom-table td {
  padding: 10px;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.bom-table tbody tr:hover {
  background-color: var(--row-hover);
}

.item-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: var(--code-color);
  font-weight: 600;
}

.font-num {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
}

.empty-state {
  text-align: center;
  color: var(--text-muted);
  padding: 48px 16px !important;
}

/* Footer Tabel */
.table-footer {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--table-header-bg);
  border-top: 1px solid var(--border-color);
  font-size: 0.875rem;
  color: var(--text-main);
}

.hidden {
  display: none !important;
}
