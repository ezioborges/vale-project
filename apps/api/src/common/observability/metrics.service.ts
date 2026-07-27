import { Injectable } from '@nestjs/common';

type HttpMetricKey = `${string}|${string}|${string}`;

const allowedMethods = new Set([
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
]);

@Injectable()
export class MetricsService {
  private readonly httpRequests = new Map<HttpMetricKey, number>();
  private readonly httpDurationMilliseconds = new Map<HttpMetricKey, number>();

  recordHttp(
    method: string,
    route: string,
    statusCode: number,
    durationMilliseconds: number,
  ): void {
    const safeMethod = allowedMethods.has(method) ? method : 'OTHER';
    const safeRoute = this.normalizeRoute(route);
    const statusClass = `${Math.floor(statusCode / 100)}xx`;
    const key: HttpMetricKey = `${safeMethod}|${safeRoute}|${statusClass}`;
    this.httpRequests.set(key, (this.httpRequests.get(key) ?? 0) + 1);
    this.httpDurationMilliseconds.set(
      key,
      (this.httpDurationMilliseconds.get(key) ?? 0) +
        Math.max(0, durationMilliseconds),
    );
  }

  renderPrometheus(): string {
    const lines = [
      '# HELP vale_http_requests_total HTTP requests completed by normalized route.',
      '# TYPE vale_http_requests_total counter',
    ];

    for (const [key, count] of this.httpRequests) {
      const [method, route, status] = key.split('|');
      lines.push(
        `vale_http_requests_total{method="${method}",route="${route}",status="${status}"} ${count}`,
      );
    }

    lines.push(
      '# HELP vale_http_request_duration_milliseconds_total Total HTTP duration by normalized route.',
      '# TYPE vale_http_request_duration_milliseconds_total counter',
    );
    for (const [key, duration] of this.httpDurationMilliseconds) {
      const [method, route, status] = key.split('|');
      lines.push(
        `vale_http_request_duration_milliseconds_total{method="${method}",route="${route}",status="${status}"} ${duration.toFixed(3)}`,
      );
    }

    return `${lines.join('\n')}\n`;
  }

  private normalizeRoute(route: string): string {
    if (!route || route.length > 180 || /[?@]/.test(route)) {
      return '/unmatched';
    }
    return route.replace(/[^A-Za-z0-9/_:.-]/g, '_');
  }
}
