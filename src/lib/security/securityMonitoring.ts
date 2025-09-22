import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  risk_score: number;
  geo_location?: {
    country: string;
    region: string;
    city: string;
  };
}

export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  MFA_VERIFICATION_FAILED = 'mfa_verification_failed',

  // Authorization events
  ACCESS_DENIED = 'access_denied',
  PRIVILEGE_ESCALATION_ATTEMPT = 'privilege_escalation_attempt',
  UNAUTHORIZED_RESOURCE_ACCESS = 'unauthorized_resource_access',

  // Input validation events
  XSS_ATTEMPT = 'xss_attempt',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  NOSQL_INJECTION_ATTEMPT = 'nosql_injection_attempt',
  CSRF_VIOLATION = 'csrf_violation',
  INPUT_VALIDATION_FAILURE = 'input_validation_failure',

  // Rate limiting events
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  DDOS_ATTEMPT = 'ddos_attempt',
  BOT_DETECTED = 'bot_detected',

  // Data access events
  SENSITIVE_DATA_ACCESS = 'sensitive_data_access',
  BULK_DATA_EXPORT = 'bulk_data_export',
  SUSPICIOUS_QUERY = 'suspicious_query',

  // System events
  SYSTEM_ERROR = 'system_error',
  CONFIGURATION_CHANGE = 'configuration_change',
  SECURITY_POLICY_VIOLATION = 'security_policy_violation',

  // Financial events
  LARGE_TRANSACTION = 'large_transaction',
  UNUSUAL_SPENDING_PATTERN = 'unusual_spending_pattern',
  MULTIPLE_FAILED_PAYMENTS = 'multiple_failed_payments',
}

export interface SecurityAlert {
  id: string;
  timestamp: Date;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  events: SecurityEvent[];
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assignee?: string;
  resolution?: string;
}

export interface SecurityMetrics {
  total_events: number;
  events_by_severity: Record<string, number>;
  events_by_type: Record<string, number>;
  top_risk_ips: Array<{ ip: string; risk_score: number; event_count: number }>;
  geographical_distribution: Record<string, number>;
  recent_trends: {
    hourly: number[];
    daily: number[];
  };
}

export class SecurityMonitoringService {
  private events: SecurityEvent[] = [];
  private alerts: SecurityAlert[] = [];
  private riskScores: Map<string, number> = new Map();
  private behaviorBaselines: Map<string, any> = new Map();

  private readonly MAX_EVENTS = 10000; // Keep last 10k events in memory
  private readonly RISK_THRESHOLDS = {
    low: 25,
    medium: 50,
    high: 75,
    critical: 90,
  };

  logSecurityEvent(
    type: SecurityEventType,
    req: NextApiRequest,
    details: Record<string, any> = {},
    userId?: string,
    sessionId?: string
  ): SecurityEvent {
    const event: SecurityEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type,
      severity: this.calculateSeverity(type, details),
      source: req.url || 'unknown',
      userId,
      sessionId,
      ipAddress: this.getClientIP(req),
      userAgent: req.headers['user-agent'] || '',
      details,
      risk_score: this.calculateRiskScore(type, details, req),
      geo_location: this.getGeoLocation(req),
    };

    this.events.push(event);

    // Maintain event limit
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Update risk scores
    this.updateRiskScore(event.ipAddress, event.risk_score);
    if (userId) {
      this.updateRiskScore(`user:${userId}`, event.risk_score);
    }

    // Check for alert conditions
    this.evaluateAlertConditions(event);

    // Log to console/external system
    this.writeToLog(event);

    return event;
  }

  createAlert(
    title: string,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    triggerEvents: SecurityEvent[]
  ): SecurityAlert {
    const alert: SecurityAlert = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      title,
      description,
      severity,
      events: triggerEvents,
      status: 'open',
    };

    this.alerts.push(alert);

    // Send notifications for high/critical alerts
    if (severity === 'high' || severity === 'critical') {
      this.sendSecurityNotification(alert);
    }

    return alert;
  }

  detectAnomalousActivity(userId: string): {
    isAnomalous: boolean;
    anomalies: string[];
    riskScore: number;
  } {
    const userEvents = this.events.filter(e => e.userId === userId);
    const baseline = this.behaviorBaselines.get(userId);
    const anomalies: string[] = [];

    if (!baseline || userEvents.length < 10) {
      return { isAnomalous: false, anomalies, riskScore: 0 };
    }

    const recent = userEvents.slice(-24); // Last 24 events

    // Check for unusual activity patterns
    const avgEventsPerHour = baseline.avgEventsPerHour || 5;
    const currentRate = recent.length / 24; // Events per hour

    if (currentRate > avgEventsPerHour * 3) {
      anomalies.push('Unusual activity frequency');
    }

    // Check for geographic anomalies
    const recentCountries = new Set(
      recent.map(e => e.geo_location?.country).filter(Boolean)
    );
    const baselineCountries = new Set(baseline.commonCountries || []);

    const newCountries = [...recentCountries].filter(c => !baselineCountries.has(c));
    if (newCountries.length > 0) {
      anomalies.push(`Activity from new countries: ${newCountries.join(', ')}`);
    }

    // Check for unusual transaction patterns (financial app specific)
    const financialEvents = recent.filter(e =>
      [SecurityEventType.LARGE_TRANSACTION, SecurityEventType.UNUSUAL_SPENDING_PATTERN]
        .includes(e.type)
    );

    if (financialEvents.length > 5) {
      anomalies.push('Multiple unusual financial activities');
    }

    // Calculate overall risk score
    const riskScore = this.calculateUserRiskScore(userId, anomalies);

    return {
      isAnomalous: anomalies.length > 0,
      anomalies,
      riskScore,
    };
  }

  generateSecurityReport(
    startDate: Date,
    endDate: Date
  ): {
    summary: SecurityMetrics;
    topThreats: SecurityEvent[];
    activeAlerts: SecurityAlert[];
    recommendations: string[];
  } {
    const filteredEvents = this.events.filter(
      e => e.timestamp >= startDate && e.timestamp <= endDate
    );

    const summary = this.calculateMetrics(filteredEvents);
    const topThreats = filteredEvents
      .filter(e => e.risk_score > this.RISK_THRESHOLDS.high)
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 10);

    const activeAlerts = this.alerts.filter(
      a => a.status === 'open' || a.status === 'investigating'
    );

    const recommendations = this.generateRecommendations(summary, topThreats);

    return {
      summary,
      topThreats,
      activeAlerts,
      recommendations,
    };
  }

  // Real-time threat detection
  detectImmediateThreats(event: SecurityEvent): {
    threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
    actions: string[];
    shouldBlock: boolean;
  } {
    const actions: string[] = [];
    let threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none';
    let shouldBlock = false;

    // Check for critical events
    const criticalEvents = [
      SecurityEventType.SQL_INJECTION_ATTEMPT,
      SecurityEventType.NOSQL_INJECTION_ATTEMPT,
      SecurityEventType.PRIVILEGE_ESCALATION_ATTEMPT,
      SecurityEventType.DDOS_ATTEMPT,
    ];

    if (criticalEvents.includes(event.type)) {
      threatLevel = 'critical';
      shouldBlock = true;
      actions.push('Block IP immediately');
      actions.push('Alert security team');
    }

    // Check for repeated failures
    const recentFailures = this.events.filter(
      e => e.ipAddress === event.ipAddress &&
           e.type === SecurityEventType.LOGIN_FAILURE &&
           Date.now() - e.timestamp.getTime() < 15 * 60 * 1000 // Last 15 minutes
    );

    if (recentFailures.length >= 5) {
      threatLevel = 'high';
      shouldBlock = true;
      actions.push('Block IP for 1 hour');
    }

    // Check accumulated risk score
    const ipRiskScore = this.riskScores.get(event.ipAddress) || 0;
    if (ipRiskScore > this.RISK_THRESHOLDS.critical) {
      threatLevel = 'critical';
      shouldBlock = true;
      actions.push('Block IP and investigate');
    }

    return { threatLevel, actions, shouldBlock };
  }

  // Security middleware for automatic monitoring
  createMonitoringMiddleware() {
    return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
      const startTime = Date.now();

      // Log request start
      const requestEvent = this.logSecurityEvent(
        SecurityEventType.SENSITIVE_DATA_ACCESS,
        req,
        {
          method: req.method,
          endpoint: req.url,
          contentLength: req.headers['content-length'],
        }
      );

      // Override res.json to log responses
      const originalJson = res.json.bind(res);
      res.json = (data: any) => {
        const duration = Date.now() - startTime;

        // Log response
        this.logSecurityEvent(
          SecurityEventType.SENSITIVE_DATA_ACCESS,
          req,
          {
            responseTime: duration,
            statusCode: res.statusCode,
            success: data?.success !== false,
          }
        );

        return originalJson(data);
      };

      // Check for immediate threats
      const threatAnalysis = this.detectImmediateThreats(requestEvent);
      if (threatAnalysis.shouldBlock) {
        return res.status(403).json({
          success: false,
          error: 'Request blocked due to security policy',
          code: 'SECURITY_BLOCK',
        });
      }

      next();
    };
  }

  // Get security dashboard data
  getDashboardData(): {
    currentRiskLevel: 'low' | 'medium' | 'high' | 'critical';
    recentEvents: SecurityEvent[];
    activeAlerts: SecurityAlert[];
    topRiskyIPs: Array<{ ip: string; score: number }>;
    systemHealth: 'healthy' | 'warning' | 'critical';
  } {
    const recentEvents = this.events.slice(-50);
    const activeAlerts = this.alerts.filter(a => a.status === 'open');

    const riskScoreEntries = Array.from(this.riskScores.entries())
      .filter(([key]) => !key.startsWith('user:'))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, score]) => ({ ip, score }));

    const avgRiskScore = riskScoreEntries.length > 0
      ? riskScoreEntries.reduce((sum, item) => sum + item.score, 0) / riskScoreEntries.length
      : 0;

    const currentRiskLevel = this.getRiskLevel(avgRiskScore);
    const systemHealth = this.assessSystemHealth();

    return {
      currentRiskLevel,
      recentEvents,
      activeAlerts,
      topRiskyIPs: riskScoreEntries,
      systemHealth,
    };
  }

  private calculateSeverity(
    type: SecurityEventType,
    details: Record<string, any>
  ): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<SecurityEventType, 'low' | 'medium' | 'high' | 'critical'> = {
      [SecurityEventType.LOGIN_SUCCESS]: 'low',
      [SecurityEventType.LOGIN_FAILURE]: 'medium',
      [SecurityEventType.SQL_INJECTION_ATTEMPT]: 'critical',
      [SecurityEventType.NOSQL_INJECTION_ATTEMPT]: 'critical',
      [SecurityEventType.XSS_ATTEMPT]: 'high',
      [SecurityEventType.DDOS_ATTEMPT]: 'critical',
      [SecurityEventType.PRIVILEGE_ESCALATION_ATTEMPT]: 'critical',
      [SecurityEventType.RATE_LIMIT_EXCEEDED]: 'medium',
      [SecurityEventType.LARGE_TRANSACTION]: 'medium',
      // Add more mappings...
    } as any;

    return severityMap[type] || 'low';
  }

  private calculateRiskScore(
    type: SecurityEventType,
    details: Record<string, any>,
    req: NextApiRequest
  ): number {
    let score = 0;

    // Base score by event type
    const typeScores = {
      [SecurityEventType.SQL_INJECTION_ATTEMPT]: 90,
      [SecurityEventType.NOSQL_INJECTION_ATTEMPT]: 90,
      [SecurityEventType.XSS_ATTEMPT]: 70,
      [SecurityEventType.LOGIN_FAILURE]: 20,
      [SecurityEventType.RATE_LIMIT_EXCEEDED]: 40,
      [SecurityEventType.DDOS_ATTEMPT]: 95,
    } as any;

    score = typeScores[type] || 10;

    // Adjust based on factors
    const userAgent = req.headers['user-agent'] || '';
    if (this.isSuspiciousUserAgent(userAgent)) {
      score += 15;
    }

    if (!req.headers.referer && !req.headers.origin) {
      score += 10;
    }

    // Geographic risk (if available)
    const geoLocation = this.getGeoLocation(req);
    if (geoLocation && this.isHighRiskCountry(geoLocation.country)) {
      score += 20;
    }

    return Math.min(100, score);
  }

  private updateRiskScore(identifier: string, score: number): void {
    const currentScore = this.riskScores.get(identifier) || 0;
    const newScore = Math.min(100, currentScore + score * 0.1); // Gradual increase
    this.riskScores.set(identifier, newScore);

    // Decay risk scores over time
    setTimeout(() => {
      const decayedScore = Math.max(0, newScore * 0.95);
      this.riskScores.set(identifier, decayedScore);
    }, 60 * 60 * 1000); // Decay after 1 hour
  }

  private evaluateAlertConditions(event: SecurityEvent): void {
    // Multiple failed logins
    if (event.type === SecurityEventType.LOGIN_FAILURE) {
      const recentFailures = this.events.filter(
        e => e.ipAddress === event.ipAddress &&
             e.type === SecurityEventType.LOGIN_FAILURE &&
             Date.now() - e.timestamp.getTime() < 15 * 60 * 1000
      );

      if (recentFailures.length >= 5) {
        this.createAlert(
          'Potential Brute Force Attack',
          `Multiple failed login attempts from IP ${event.ipAddress}`,
          'high',
          recentFailures
        );
      }
    }

    // SQL/NoSQL injection attempts
    if ([SecurityEventType.SQL_INJECTION_ATTEMPT, SecurityEventType.NOSQL_INJECTION_ATTEMPT].includes(event.type)) {
      this.createAlert(
        'Injection Attack Detected',
        `Potential injection attack from IP ${event.ipAddress}`,
        'critical',
        [event]
      );
    }
  }

  private calculateMetrics(events: SecurityEvent[]): SecurityMetrics {
    const metrics: SecurityMetrics = {
      total_events: events.length,
      events_by_severity: {},
      events_by_type: {},
      top_risk_ips: [],
      geographical_distribution: {},
      recent_trends: {
        hourly: [],
        daily: [],
      },
    };

    // Calculate distributions
    events.forEach(event => {
      metrics.events_by_severity[event.severity] = (metrics.events_by_severity[event.severity] || 0) + 1;
      metrics.events_by_type[event.type] = (metrics.events_by_type[event.type] || 0) + 1;

      if (event.geo_location?.country) {
        metrics.geographical_distribution[event.geo_location.country] =
          (metrics.geographical_distribution[event.geo_location.country] || 0) + 1;
      }
    });

    return metrics;
  }

  private generateRecommendations(
    metrics: SecurityMetrics,
    threats: SecurityEvent[]
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.events_by_severity.critical > 0) {
      recommendations.push('Immediate investigation required for critical security events');
    }

    if (metrics.events_by_type[SecurityEventType.LOGIN_FAILURE] > 50) {
      recommendations.push('Consider implementing stronger password policies');
    }

    if (threats.length > 5) {
      recommendations.push('Consider implementing additional DDoS protection');
    }

    return recommendations;
  }

  private calculateUserRiskScore(userId: string, anomalies: string[]): number {
    const baseScore = 30;
    const anomalyScore = anomalies.length * 15;
    return Math.min(100, baseScore + anomalyScore);
  }

  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= this.RISK_THRESHOLDS.critical) return 'critical';
    if (score >= this.RISK_THRESHOLDS.high) return 'high';
    if (score >= this.RISK_THRESHOLDS.medium) return 'medium';
    return 'low';
  }

  private assessSystemHealth(): 'healthy' | 'warning' | 'critical' {
    const recentCriticalEvents = this.events.filter(
      e => e.severity === 'critical' &&
           Date.now() - e.timestamp.getTime() < 60 * 60 * 1000 // Last hour
    );

    if (recentCriticalEvents.length > 5) return 'critical';
    if (recentCriticalEvents.length > 0) return 'warning';
    return 'healthy';
  }

  private getClientIP(req: NextApiRequest): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection?.remoteAddress ||
      'unknown'
    );
  }

  private getGeoLocation(req: NextApiRequest): { country: string; region: string; city: string } | undefined {
    // Extract from headers if available (Cloudflare, etc.)
    const country = req.headers['cf-ipcountry'] as string;
    const region = req.headers['cf-region'] as string;
    const city = req.headers['cf-ipcity'] as string;

    if (country) {
      return { country, region: region || '', city: city || '' };
    }

    return undefined;
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /python/i, /java/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  private isHighRiskCountry(country: string): boolean {
    // This would be configurable based on your risk assessment
    const highRiskCountries = process.env.HIGH_RISK_COUNTRIES?.split(',') || [];
    return highRiskCountries.includes(country.toUpperCase());
  }

  private writeToLog(event: SecurityEvent): void {
    // In production, this would write to external logging systems
    if (event.severity === 'critical' || event.severity === 'high') {
      console.error('SECURITY EVENT:', JSON.stringify(event, null, 2));
    } else {
      console.log('Security event:', event.type, event.ipAddress);
    }
  }

  private sendSecurityNotification(alert: SecurityAlert): void {
    // In production, this would send notifications via email, Slack, etc.
    console.warn('SECURITY ALERT:', alert.title, alert.severity);
  }
}

// Global security monitoring service
export const securityMonitor = new SecurityMonitoringService();

// Convenience function for logging security events
export function logSecurityEvent(
  type: SecurityEventType,
  req: NextApiRequest,
  details?: Record<string, any>,
  userId?: string,
  sessionId?: string
): SecurityEvent {
  return securityMonitor.logSecurityEvent(type, req, details, userId, sessionId);
}

// Security monitoring middleware
export const securityMonitoringMiddleware = securityMonitor.createMonitoringMiddleware();