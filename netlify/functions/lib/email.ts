
import nodemailer from 'nodemailer'

const smtpHost = process.env.SMTP_HOST
const smtpPort = parseInt(process.env.SMTP_PORT || '465')
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS

export const sendReminderEmail = async (
    to: string,
    subject: string,
    html: string,
    cc: string[] = []
) => {
    // Fail-safe if env vars are missing
    if (!smtpHost || !smtpUser || !smtpPass) {
        console.log('⚠️ Mock Email (Missing SMTP Config):', { to, subject, cc })
        console.log('Please configure SMTP_HOST, SMTP_USER, SMTP_PASS in Netlify.')
        return { id: 'mock-missing-config', error: 'Missing SMTP Config' }
    }

    try {
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465, // true for 465, false for other ports
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        })

        const info = await transporter.sendMail({
            from: `"Oud Papier Planner" <${smtpUser}>`, // Sender identity
            to,
            cc,
            subject,
            html,
        })

        console.log(`Email sent: ${info.messageId}`)
        return { id: info.messageId, error: null }
    } catch (error) {
        console.error('SMTP Email Error:', error)
        return { id: null, error }
    }
}
