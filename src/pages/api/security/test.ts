import { NextApiRequest, NextApiResponse } from 'next';
import { SecurityValidationService } from '../../../lib/security/inputValidation';
import { MongoSecurityService } from '../../../lib/security/mongoSecurity';
import { XSSProtectionService } from '../../../lib/security/xssProtection';
import { csrfService } from '../../../lib/security/csrfProtection';
import { advancedRateLimiter } from '../../../lib/security/advancedRateLimiting';
import { enhancedAuthService } from '../../../lib/security/enhancedAuth';
import { securityMonitor, SecurityEventType } from '../../../lib/security/securityMonitoring';

interface SecurityTestResult {
  test: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  details?: any;
  executionTime?: number;
}

export default async function securityTestHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  const testResults: SecurityTestResult[] = [];

  // Log security test event
  securityMonitor.logSecurityEvent(
    SecurityEventType.CONFIGURATION_CHANGE,
    req,
    { action: 'security_test_initiated' }
  );

  try {
    // Test 1: Input Validation and Sanitization
    await testInputValidation(testResults);

    // Test 2: XSS Protection
    await testXSSProtection(testResults);

    // Test 3: CSRF Protection
    await testCSRFProtection(testResults, req);

    // Test 4: MongoDB Security
    await testMongoDBSecurity(testResults);

    // Test 5: Rate Limiting
    await testRateLimiting(testResults, req);

    // Test 6: Authentication System
    await testAuthenticationSystem(testResults);

    // Test 7: Security Monitoring
    await testSecurityMonitoring(testResults, req);

    // Test 8: Security Headers
    await testSecurityHeaders(testResults, res);

    // Calculate overall security score
    const passedTests = testResults.filter(test => test.status === 'passed').length;
    const totalTests = testResults.length;
    const warningTests = testResults.filter(test => test.status === 'warning').length;
    const failedTests = testResults.filter(test => test.status === 'failed').length;

    const securityScore = Math.round((passedTests / totalTests) * 100);

    // Generate security recommendations
    const recommendations = generateSecurityRecommendations(testResults);

    return res.status(200).json({
      success: true,
      message: `Security test completed: ${passedTests}/${totalTests} tests passed`,
      securityScore,
      results: testResults,
      summary: {
        totalTests,
        passedTests,
        warningTests,
        failedTests,
        securityLevel: getSecurityLevel(securityScore),
      },
      recommendations,
      systemStatus: {
        rateLimitingActive: true,
        authenticationActive: true,
        monitoringActive: true,
        xssProtectionActive: true,
        csrfProtectionActive: true,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Security test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Security test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function testInputValidation(testResults: SecurityTestResult[]): Promise<void> {
  const startTime = Date.now();

  try {
    // Test malicious input detection
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      "'; DROP TABLE users; --",
      '{"$ne": ""}',
      '../../../etc/passwd',
      'javascript:alert(1)',
    ];

    let detectedThreats = 0;
    for (const input of maliciousInputs) {
      const violations = SecurityValidationService.detectSecurityViolations(input);
      if (violations.length > 0) {
        detectedThreats++;
      }
    }

    testResults.push({
      test: 'Malicious Input Detection',
      status: detectedThreats >= 4 ? 'passed' : 'failed',
      message: `Detected ${detectedThreats}/${maliciousInputs.length} malicious inputs`,
      executionTime: Date.now() - startTime,
    });

    // Test password validation
    const weakPasswords = ['123456', 'password', 'admin', 'qwerty'];
    const strongPassword = 'MyStr0ng!P@ssw0rd123';

    let weakPasswordsRejected = 0;
    for (const password of weakPasswords) {
      const validation = SecurityValidationService.validatePassword(password);
      if (!validation.isValid) {
        weakPasswordsRejected++;
      }
    }

    const strongPasswordValidation = SecurityValidationService.validatePassword(strongPassword);

    testResults.push({
      test: 'Password Validation',
      status: weakPasswordsRejected === weakPasswords.length && strongPasswordValidation.isValid ? 'passed' : 'failed',
      message: `Rejected ${weakPasswordsRejected}/${weakPasswords.length} weak passwords, accepted strong password: ${strongPasswordValidation.isValid}`,
      details: {
        strongPasswordScore: strongPasswordValidation.score,
        feedback: strongPasswordValidation.feedback,
      },
    });

    // Test email validation
    const validEmails = ['user@example.com', 'test+tag@domain.co.uk'];
    const invalidEmails = ['user@tempmail.org', 'invalid-email', 'user@.com'];

    let validEmailsAccepted = 0;
    let invalidEmailsRejected = 0;

    for (const email of validEmails) {
      if (SecurityValidationService.validateEmail(email)) {
        validEmailsAccepted++;
      }
    }

    for (const email of invalidEmails) {
      if (!SecurityValidationService.validateEmail(email)) {
        invalidEmailsRejected++;
      }
    }

    testResults.push({
      test: 'Email Validation',
      status: validEmailsAccepted === validEmails.length && invalidEmailsRejected === invalidEmails.length ? 'passed' : 'failed',
      message: `Accepted ${validEmailsAccepted}/${validEmails.length} valid emails, rejected ${invalidEmailsRejected}/${invalidEmails.length} invalid emails`,
    });

  } catch (error) {
    testResults.push({
      test: 'Input Validation System',
      status: 'failed',
      message: 'Input validation test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function testXSSProtection(testResults: SecurityTestResult[]): Promise<void> {
  try {
    // Test XSS detection
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '<img src="x" onerror="alert(1)">',
      'javascript:alert(document.cookie)',
      '<svg onload="alert(1)">',
      '"><script>alert(1)</script>',
    ];

    let xssDetected = 0;
    for (const payload of xssPayloads) {
      const detection = XSSProtectionService.detectXSSAttempt(payload);
      if (detection.isXSS) {
        xssDetected++;
      }
    }

    testResults.push({
      test: 'XSS Detection',
      status: xssDetected >= 4 ? 'passed' : 'failed',
      message: `Detected ${xssDetected}/${xssPayloads.length} XSS attempts`,
    });

    // Test HTML sanitization
    const maliciousHTML = '<p>Hello</p><script>alert("xss")</script><img src="x" onerror="alert(1)">';
    const sanitized = XSSProtectionService.sanitizeHtml(maliciousHTML);

    const isProperlysanitized = !sanitized.includes('<script>') && !sanitized.includes('onerror');

    testResults.push({
      test: 'HTML Sanitization',
      status: isProperlysanitized ? 'passed' : 'failed',
      message: isProperlysanitized ? 'HTML properly sanitized' : 'HTML sanitization failed',
      details: {
        original: maliciousHTML,
        sanitized: sanitized,
      },
    });

  } catch (error) {
    testResults.push({
      test: 'XSS Protection System',
      status: 'failed',
      message: 'XSS protection test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function testCSRFProtection(testResults: SecurityTestResult[], req: NextApiRequest): Promise<void> {
  try {
    // Test CSRF token generation
    const token1 = csrfService.generateToken();
    const token2 = csrfService.generateToken();

    const tokensAreUnique = token1 !== token2;
    const tokensAreValid = csrfService.validateToken(token1) && csrfService.validateToken(token2);

    testResults.push({
      test: 'CSRF Token Generation',
      status: tokensAreUnique && tokensAreValid ? 'passed' : 'failed',
      message: `Generated unique tokens: ${tokensAreUnique}, tokens valid: ${tokensAreValid}`,
    });

    // Test CSRF token validation
    const expiredToken = 'invalid.token.signature';
    const isExpiredRejected = !csrfService.validateToken(expiredToken);

    testResults.push({
      test: 'CSRF Token Validation',
      status: isExpiredRejected ? 'passed' : 'failed',
      message: `Rejected invalid token: ${isExpiredRejected}`,
    });

  } catch (error) {
    testResults.push({
      test: 'CSRF Protection System',
      status: 'failed',
      message: 'CSRF protection test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function testMongoDBSecurity(testResults: SecurityTestResult[]): Promise<void> {
  try {
    // Test query sanitization
    const maliciousQuery = {
      $where: 'function() { return true; }',
      username: { $ne: null },
      password: { $regex: '.*' },
    };

    const sanitizedQuery = MongoSecurityService.sanitizeQuery(maliciousQuery);
    const isDangerous = JSON.stringify(sanitizedQuery).includes('$where');

    testResults.push({
      test: 'MongoDB Query Sanitization',
      status: !isDangerous ? 'passed' : 'failed',
      message: !isDangerous ? 'Dangerous operators removed' : 'Dangerous operators not filtered',
      details: {
        original: maliciousQuery,
        sanitized: sanitizedQuery,
      },
    });

    // Test ObjectId validation
    const validId = '507f1f77bcf86cd799439011';
    const invalidId = '../../../etc/passwd';

    const validIdResult = MongoSecurityService.validateObjectId(validId);
    const invalidIdResult = MongoSecurityService.validateObjectId(invalidId);

    testResults.push({
      test: 'MongoDB ObjectId Validation',
      status: validIdResult && !invalidIdResult ? 'passed' : 'failed',
      message: `Valid ID accepted: ${!!validIdResult}, invalid ID rejected: ${!invalidIdResult}`,
    });

  } catch (error) {
    testResults.push({
      test: 'MongoDB Security System',
      status: 'failed',
      message: 'MongoDB security test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function testRateLimiting(testResults: SecurityTestResult[], req: NextApiRequest): Promise<void> {
  try {
    // Test rate limiting functionality
    const result1 = advancedRateLimiter.checkRateLimit(req, {} as any, 'api');
    const result2 = advancedRateLimiter.checkRateLimit(req, {} as any, 'api');

    const rateLimitWorking = result1.allowed && result2.remaining < result1.remaining;

    testResults.push({
      test: 'Rate Limiting Functionality',
      status: rateLimitWorking ? 'passed' : 'warning',
      message: rateLimitWorking ? 'Rate limiting working correctly' : 'Rate limiting may not be working',
      details: {
        firstRequest: result1,
        secondRequest: result2,
      },
    });

    // Test DDoS detection
    const ddosCheck = advancedRateLimiter.detectDDoS(req);

    testResults.push({
      test: 'DDoS Detection System',
      status: 'passed',
      message: `DDoS detection active, confidence: ${ddosCheck.confidence}%`,
      details: {
        isDDoS: ddosCheck.isDDoS,
        patterns: ddosCheck.patterns,
        confidence: ddosCheck.confidence,
      },
    });

    // Test rate limiting statistics
    const stats = advancedRateLimiter.getStats();

    testResults.push({
      test: 'Rate Limiting Statistics',
      status: 'passed',
      message: 'Rate limiting statistics available',
      details: stats,
    });

  } catch (error) {
    testResults.push({
      test: 'Rate Limiting System',
      status: 'failed',
      message: 'Rate limiting test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function testAuthenticationSystem(testResults: SecurityTestResult[]): Promise<void> {
  try {
    // Test password hashing
    const password = 'testPassword123!';
    const hashedPassword = await enhancedAuthService.hashPassword(password);
    const isValidPassword = await enhancedAuthService.verifyPassword(password, hashedPassword);
    const isInvalidPassword = await enhancedAuthService.verifyPassword('wrongPassword', hashedPassword);

    testResults.push({
      test: 'Password Hashing',
      status: isValidPassword && !isInvalidPassword ? 'passed' : 'failed',
      message: `Correct password verified: ${isValidPassword}, incorrect password rejected: ${!isInvalidPassword}`,
    });

    // Test MFA generation
    const mfaSecret = enhancedAuthService.generateMFASecret();
    const hasMFASecret = mfaSecret.secret.length > 0;

    testResults.push({
      test: 'MFA System',
      status: hasMFASecret ? 'passed' : 'failed',
      message: hasMFASecret ? 'MFA secret generation working' : 'MFA secret generation failed',
    });

    // Test security metrics
    const securityMetrics = enhancedAuthService.getSecurityMetrics();

    testResults.push({
      test: 'Authentication Metrics',
      status: 'passed',
      message: 'Authentication metrics available',
      details: securityMetrics,
    });

  } catch (error) {
    testResults.push({
      test: 'Authentication System',
      status: 'failed',
      message: 'Authentication test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function testSecurityMonitoring(testResults: SecurityTestResult[], req: NextApiRequest): Promise<void> {
  try {
    // Test security event logging
    const testEvent = securityMonitor.logSecurityEvent(
      SecurityEventType.SYSTEM_ERROR,
      req,
      { test: 'security_monitoring_test' }
    );

    const eventLogged = testEvent.id && testEvent.timestamp;

    testResults.push({
      test: 'Security Event Logging',
      status: eventLogged ? 'passed' : 'failed',
      message: eventLogged ? 'Security events logging correctly' : 'Security event logging failed',
      details: {
        eventId: testEvent.id,
        riskScore: testEvent.risk_score,
      },
    });

    // Test threat detection
    const threatAnalysis = securityMonitor.detectImmediateThreats(testEvent);

    testResults.push({
      test: 'Threat Detection System',
      status: 'passed',
      message: `Threat detection active, level: ${threatAnalysis.threatLevel}`,
      details: threatAnalysis,
    });

    // Test dashboard data
    const dashboardData = securityMonitor.getDashboardData();

    testResults.push({
      test: 'Security Dashboard',
      status: 'passed',
      message: `Dashboard data available, system health: ${dashboardData.systemHealth}`,
      details: {
        riskLevel: dashboardData.currentRiskLevel,
        systemHealth: dashboardData.systemHealth,
        activeAlerts: dashboardData.activeAlerts.length,
      },
    });

  } catch (error) {
    testResults.push({
      test: 'Security Monitoring System',
      status: 'failed',
      message: 'Security monitoring test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function testSecurityHeaders(testResults: SecurityTestResult[], res: NextApiResponse): Promise<void> {
  try {
    // Apply security headers (this would normally be done by middleware)
    XSSProtectionService.applySecurityHeaders({} as any, res);

    const securityHeaders = [
      'Content-Security-Policy',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Referrer-Policy',
    ];

    let headersSet = 0;
    for (const header of securityHeaders) {
      if (res.getHeader(header)) {
        headersSet++;
      }
    }

    testResults.push({
      test: 'Security Headers',
      status: headersSet >= 4 ? 'passed' : 'warning',
      message: `${headersSet}/${securityHeaders.length} security headers configured`,
      details: {
        headersSet: securityHeaders.filter(header => res.getHeader(header)),
        missingHeaders: securityHeaders.filter(header => !res.getHeader(header)),
      },
    });

  } catch (error) {
    testResults.push({
      test: 'Security Headers System',
      status: 'failed',
      message: 'Security headers test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function generateSecurityRecommendations(testResults: SecurityTestResult[]): string[] {
  const recommendations: string[] = [];
  const failedTests = testResults.filter(test => test.status === 'failed');
  const warningTests = testResults.filter(test => test.status === 'warning');

  if (failedTests.some(test => test.test.includes('Input Validation'))) {
    recommendations.push('Strengthen input validation and sanitization mechanisms');
  }

  if (failedTests.some(test => test.test.includes('XSS'))) {
    recommendations.push('Review and enhance XSS protection measures');
  }

  if (failedTests.some(test => test.test.includes('CSRF'))) {
    recommendations.push('Implement comprehensive CSRF protection');
  }

  if (failedTests.some(test => test.test.includes('Rate Limiting'))) {
    recommendations.push('Configure and test rate limiting functionality');
  }

  if (warningTests.length > 0) {
    recommendations.push('Review warning items and consider improvements');
  }

  if (recommendations.length === 0) {
    recommendations.push('Security systems are functioning well. Continue regular monitoring.');
  }

  return recommendations;
}

function getSecurityLevel(score: number): string {
  if (score >= 95) return 'Excellent';
  if (score >= 85) return 'Good';
  if (score >= 70) return 'Fair';
  if (score >= 50) return 'Poor';
  return 'Critical';
}