type Labels = Record<string, string>

function labelKey(labels: Labels): string {
  const entries = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b))
  return entries.map(([k, v]) => `${k}="${v}"`).join(',')
}

/** Минимальный in-process реестр счётчиков (Prometheus text format). */
export class MetricsRegistry {
  private readonly counters = new Map<string, number>()

  inc(name: string, labels: Labels = {}, delta = 1): void {
    const key = `${name}|${labelKey(labels)}`
    this.counters.set(key, (this.counters.get(key) ?? 0) + delta)
  }

  renderPrometheus(): string {
    const byName = new Map<string, Array<{ labels: Labels; value: number }>>()

    for (const [key, value] of this.counters) {
      const sep = key.indexOf('|')
      const name = sep >= 0 ? key.slice(0, sep) : key
      const labelStr = sep >= 0 ? key.slice(sep + 1) : ''
      const labels: Labels = {}
      if (labelStr) {
        for (const part of labelStr.split(',')) {
          const eq = part.indexOf('=')
          if (eq > 0) {
            labels[part.slice(0, eq)] = part.slice(eq + 2, -1)
          }
        }
      }
      const list = byName.get(name) ?? []
      list.push({ labels, value })
      byName.set(name, list)
    }

    const lines: string[] = []
    for (const [name, series] of [...byName.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      lines.push(`# TYPE ${name} counter`)
      for (const { labels, value } of series) {
        const labelPart = labelKey(labels)
        lines.push(labelPart ? `${name}{${labelPart}} ${value}` : `${name} ${value}`)
      }
    }
    return `${lines.join('\n')}\n`
  }

  resetForTests(): void {
    this.counters.clear()
  }
}

export const metrics = new MetricsRegistry()

export const MetricNames = {
  httpRequests: 'tracker_http_requests_total',
  webhookUpdates: 'tracker_webhook_updates_total',
  remindersSent: 'tracker_reminders_sent_total',
  digestsSent: 'tracker_digests_sent_total',
  workerJobs: 'tracker_worker_jobs_total',
} as const
