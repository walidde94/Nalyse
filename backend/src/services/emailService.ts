/**
 * Email Notification Service
 *
 * Provides transactional email capabilities for:
 * - Password reset emails
 * - Report sharing notifications
 * - Team workspace invitations
 * - Alert notifications
 *
 * Uses Resend API when configured, falls back to console logging
 * in development mode.
 *
 * @module emailService
 */

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
}

interface EmailTemplate {
    subject: string;
    html: string;
    text: string;
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Nalyse <noreply@nalyse.io>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const APP_NAME = 'Nalyse';

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE ENGINE
// ═══════════════════════════════════════════════════════════════════

function wrapInLayout(content: string, preheader: string = ''): string {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a10; color: #e2e8f0; }
.container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
.card { background: #111118; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 32px; margin-bottom: 24px; }
.logo { font-size: 24px; font-weight: 900; background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 24px; }
h1 { font-size: 22px; font-weight: 800; margin: 0 0 12px 0; color: #f1f5f9; }
p { font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px 0; }
.btn { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; }
.btn:hover { opacity: 0.9; }
.footer { text-align: center; padding: 24px 0; font-size: 12px; color: #475569; }
.divider { height: 1px; background: rgba(255,255,255,0.06); margin: 24px 0; }
.code { font-family: 'SF Mono', Menlo, monospace; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); padding: 12px 16px; border-radius: 8px; font-size: 16px; font-weight: 700; color: #818cf8; text-align: center; letter-spacing: 0.1em; margin: 16px 0; }
.meta { font-size: 12px; color: #64748b; }
</style>
</head>
<body>
${preheader ? `<div style="display:none;max-height:0;overflow:hidden">${preheader}</div>` : ''}
<div class="container">
<div class="card">
<div class="logo">${APP_NAME}</div>
${content}
</div>
<div class="footer">
<p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
<p>You're receiving this because your email is associated with a ${APP_NAME} account.</p>
</div>
</div>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════════

export function passwordResetTemplate(resetToken: string, userName?: string): EmailTemplate {
    const resetUrl = `${FRONTEND_URL}?reset=${resetToken}`;
    const greeting = userName ? `Hi ${userName},` : 'Hi there,';

    return {
        subject: `${APP_NAME} — Reset Your Password`,
        html: wrapInLayout(`
<h1>Password Reset Request</h1>
<p>${greeting}</p>
<p>We received a request to reset your password. Click the button below to create a new one. This link expires in <strong>1 hour</strong>.</p>
<p style="text-align:center;margin:24px 0">
<a href="${resetUrl}" class="btn">Reset Password</a>
</p>
<div class="divider"></div>
<p class="meta">If you didn't request this, you can safely ignore this email. Your password won't change unless you click the link above.</p>
<p class="meta">Reset URL: ${resetUrl}</p>
`, 'Reset your Nalyse password'),
        text: `${greeting}\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.\n\n— ${APP_NAME}`
    };
}

export function shareReportTemplate(
    recipientEmail: string,
    senderName: string,
    reportTitle: string,
    shareUrl: string,
    password?: string
): EmailTemplate {
    return {
        subject: `${senderName} shared "${reportTitle}" with you on ${APP_NAME}`,
        html: wrapInLayout(`
<h1>Analysis Report Shared</h1>
<p><strong>${senderName}</strong> has shared an analysis report with you:</p>
<div style="background:rgba(99,102,241,0.05);border:1px solid rgba(99,102,241,0.15);border-radius:12px;padding:16px;margin:16px 0">
<p style="margin:0;font-size:16px;font-weight:700;color:#e2e8f0">${reportTitle}</p>
</div>
<p style="text-align:center;margin:24px 0">
<a href="${shareUrl}" class="btn">View Report</a>
</p>
${password ? `<div class="divider"></div><p>This report is password-protected:</p><div class="code">${password}</div>` : ''}
<div class="divider"></div>
<p class="meta">This link ${password ? 'is password-protected' : 'is publicly accessible'}. Contact ${senderName} if you have questions.</p>
`, `${senderName} shared a report with you`),
        text: `${senderName} shared "${reportTitle}" with you.\n\nView: ${shareUrl}${password ? `\nPassword: ${password}` : ''}\n\n— ${APP_NAME}`
    };
}

export function invitationTemplate(
    inviterName: string,
    organizationName: string,
    role: string,
    inviteToken: string
): EmailTemplate {
    const inviteUrl = `${FRONTEND_URL}?invite=${inviteToken}`;

    return {
        subject: `${inviterName} invited you to join ${organizationName} on ${APP_NAME}`,
        html: wrapInLayout(`
<h1>Workspace Invitation</h1>
<p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> as a <strong>${role}</strong>.</p>
<p>Join the team to collaborate on data analysis, share insights, and build intelligence together.</p>
<p style="text-align:center;margin:24px 0">
<a href="${inviteUrl}" class="btn">Accept Invitation</a>
</p>
<div class="divider"></div>
<p class="meta">This invitation expires in 7 days. If you don't have a ${APP_NAME} account, you'll be prompted to create one.</p>
`, `You've been invited to ${organizationName}`),
        text: `${inviterName} invited you to join ${organizationName} as a ${role}.\n\nAccept: ${inviteUrl}\n\nThis invitation expires in 7 days.\n\n— ${APP_NAME}`
    };
}

export function alertNotificationTemplate(
    userName: string,
    alertTitle: string,
    alertBody: string,
    actionUrl?: string
): EmailTemplate {
    return {
        subject: `${APP_NAME} Alert: ${alertTitle}`,
        html: wrapInLayout(`
<h1>${alertTitle}</h1>
<p>Hi ${userName},</p>
<p>${alertBody}</p>
${actionUrl ? `<p style="text-align:center;margin:24px 0"><a href="${actionUrl}" class="btn">View Details</a></p>` : ''}
<div class="divider"></div>
<p class="meta">You can manage your notification preferences in Settings → Notifications.</p>
`, alertTitle),
        text: `${alertTitle}\n\n${alertBody}${actionUrl ? `\n\nView: ${actionUrl}` : ''}\n\n— ${APP_NAME}`
    };
}

// ═══════════════════════════════════════════════════════════════════
// SEND ENGINE
// ═══════════════════════════════════════════════════════════════════

async function sendViaResend(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: [options.to],
                subject: options.subject,
                html: options.html,
                text: options.text,
                reply_to: options.replyTo,
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('📧 Resend API error:', err);
            return { success: false, error: err };
        }

        const data = await response.json();
        console.log(`📧 Email sent via Resend: ${options.subject} → ${options.to} (ID: ${data.id})`);
        return { success: true, id: data.id };
    } catch (e: any) {
        console.error('📧 Resend send error:', e.message);
        return { success: false, error: e.message };
    }
}

function logEmail(options: EmailOptions): { success: boolean } {
    console.log('═══════════════════════════════════════════');
    console.log(`📧 [DEV EMAIL] To: ${options.to}`);
    console.log(`   Subject: ${options.subject}`);
    console.log(`   Text: ${options.text?.substring(0, 200) || '(html only)'}...`);
    console.log('═══════════════════════════════════════════');
    return { success: true };
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
    if (RESEND_API_KEY) {
        return sendViaResend(options);
    }

    // Development fallback: log to console
    return logEmail(options);
}

// ═══════════════════════════════════════════════════════════════════
// CONVENIENCE METHODS
// ═══════════════════════════════════════════════════════════════════

export async function sendPasswordResetEmail(email: string, token: string, userName?: string) {
    const template = passwordResetTemplate(token, userName);
    return sendEmail({ to: email, subject: template.subject, html: template.html, text: template.text });
}

export async function sendShareNotification(recipientEmail: string, senderName: string, reportTitle: string, shareUrl: string, password?: string) {
    const template = shareReportTemplate(recipientEmail, senderName, reportTitle, shareUrl, password);
    return sendEmail({ to: recipientEmail, subject: template.subject, html: template.html, text: template.text });
}

export async function sendInvitation(recipientEmail: string, inviterName: string, orgName: string, role: string, inviteToken: string) {
    const template = invitationTemplate(inviterName, orgName, role, inviteToken);
    return sendEmail({ to: recipientEmail, subject: template.subject, html: template.html, text: template.text });
}

export async function sendAlertEmail(email: string, userName: string, title: string, body: string, actionUrl?: string) {
    const template = alertNotificationTemplate(userName, title, body, actionUrl);
    return sendEmail({ to: email, subject: template.subject, html: template.html, text: template.text });
}
