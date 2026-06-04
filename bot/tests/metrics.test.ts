import { describe, it, expect, beforeEach } from 'vitest'
import { MetricsRegistry } from '../src/infrastructure/metrics/registry.js'

describe('MetricsRegistry', () => {
  let registry: MetricsRegistry

  beforeEach(() => {
    registry = new MetricsRegistry()
  })

  it('renders prometheus counters with labels', () => {
    registry.inc('tracker_http_requests_total', { route: '/healthz', status: '200' })
    registry.inc('tracker_http_requests_total', { route: '/healthz', status: '200' })
    registry.inc('tracker_webhook_updates_total', { result: 'ok' })

    const text = registry.renderPrometheus()
    expect(text).toContain('# TYPE tracker_http_requests_total counter')
    expect(text).toContain('tracker_http_requests_total{route="/healthz",status="200"} 2')
    expect(text).toContain('tracker_webhook_updates_total{result="ok"} 1')
  })
})
