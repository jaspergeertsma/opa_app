
import type { Handler } from '@netlify/functions'
import { schedule } from '@netlify/functions'
import { supabaseAdmin } from './lib/supabase-admin'
import { sendReminderEmail } from './lib/email'
import { nextSaturday, startOfDay, format } from 'date-fns'
import { nl } from 'date-fns/locale'

const reminderHandler: Handler = async (event, _context) => {
  try {
    // Debug: Check Vars (Safe log, don't log keys)
    const hasUrl = !!(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)
    const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    console.log('Environment Check:', { hasUrl, hasKey })

    if (!hasUrl || !hasKey) {
      throw new Error('Missing configuration: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is empty.')
    }

    const manualTriggerDate = event.queryStringParameters?.date // Allow manual trigger via ?date=YYYY-MM-DD
    console.log('Running reminder check...', manualTriggerDate ? `(Manual: ${manualTriggerDate})` : '(Scheduled)')

    // 1. Determine Target Date
    let targetDateStr: string
    let targetDate: Date

    if (manualTriggerDate) {
      targetDateStr = manualTriggerDate
      targetDate = new Date(manualTriggerDate)
    } else {
      // Default: Next Saturday
      const today = startOfDay(new Date())
      targetDate = nextSaturday(today)
      targetDateStr = format(targetDate, 'yyyy-MM-dd')
    }

    console.log(`Checking for collection on ${targetDateStr}`)

    // 2. Fetch Settings
    const { data: settingsData } = await supabaseAdmin.from('app_settings').select('*')
    const settings: any = {}
    if (settingsData) {
      settingsData.forEach((row: any) => settings[row.key] = row.value)
    }

    const adminEmail = settings.admin_email || process.env.ADMIN_EMAIL || 'admin@school.nl'
    const adminName = settings.admin_name || 'Jasper Geertsma' // Fallback
    const ccs = [adminEmail]
    if (settings.cc_email_1) ccs.push(settings.cc_email_1)

    // 3. Fetch Schedule & ALL Assignments for that day
    const { data: dateRows, error: dError } = await supabaseAdmin
      .from('schedule_dates')
      .select(`
      *,
      schedule:schedules!inner(is_active),
      assignments(
        role,
        volunteer:volunteers(id, name, email, notes)
      )
    `)
      .eq('date', targetDateStr)
    // .eq('schedule.is_active', true) // Remove strict check for manual testing flexibility

    if (dError || !dateRows || dateRows.length === 0) {
      console.log('No collection found for date:', targetDateStr)
      return { statusCode: 200, body: 'No collection found' }
    }

    const schDate = dateRows[0]

    // Anti-spam check (only for scheduled runs, allow manual override)
    if (!manualTriggerDate && schDate.reminder_sent_at) {
      console.log('Reminder already sent.')
      return { statusCode: 200, body: 'Already sent' }
    }

    // 4. Data Preparation helpers
    const assignments = schDate.assignments || []

    // Helper to parse phone from notes
    const getPhone = (notes: string | null) => {
      if (!notes) return ''
      const match = notes.match(/(?:06|0|\+31)[-\s0-9]{8,}/)
      return match ? `(${match[0]})` : ''
    }

    // Format Times
    const times: Record<string, string> = {
      'V1': '09:00 – 09:45 uur', 'V2': '09:45 – 10:30 uur',
      'L1': '10:30 – 11:15 uur', 'L2': '11:15 – 12:00 uur',
      'R1': '09:00 – 12:00 uur (Stand-by)', 'R2': '09:00 – 12:00 uur (Stand-by)'
    }

    // Build "All Services List"
    // Order: V1, V2, L1, L2
    const roleOrder = ['V1', 'V2', 'L1', 'L2']
    const serviceLines = roleOrder.map(role => {
      const people = assignments.filter((a: any) => a.role === role)
      if (people.length === 0) return `- Dienst ${role}: (Nog niet ingevuld)`

      return people.map((p: any) => {
        const phone = getPhone(p.volunteer?.notes)
        return `- Dienst ${role} van ${times[role] || ''}: ${p.volunteer?.name} ${phone}`
      }).join('\n')
    }).join('\n')

    // Build "Reserves List"
    const reserveLines = assignments
      .filter((a: any) => ['R1', 'R2'].includes(a.role))
      .map((p: any) => {
        const phone = getPhone(p.volunteer?.notes)
        return `- ${p.volunteer?.name} (E-mail: ${p.volunteer?.email}) ${phone}`
      }).join('\n')


    // 5. Send Loop
    let sentCount = 0

    for (const assignment of assignments) {
      if (!assignment.volunteer?.email) continue
      if (['R1', 'R2'].includes(assignment.role)) {
        // Reserves get same email? Or separate? Assuming same for now but indicated as reserve.
        // User prompt implied general template works for active roles. 
        // We'll send to everyone.
      }

      const vol = assignment.volunteer
      const role = assignment.role

      // Personalize
      const rawSubject = settings.subject_template || 'Oud papier – planning voor zaterdag {DATE}'
      const rawBody = settings.text_template || '...'

      const placeholders: Record<string, string> = {
        '{SALUTATION}': vol.name.split(' ')[0],
        '{DATE}': format(targetDate, 'd MMMM', { locale: nl }),
        '{ROLE}': role,
        '{TIME_START}': (times[role] || '').split(' – ')[0] || '',
        '{TIME_END}': (times[role] || '').split(' – ')[1]?.replace(' uur', '') || '',
        '{ALL_SERVICES_LIST}': serviceLines,
        '{RESERVES_LIST}': reserveLines || '(Geen reserves ingepland)',
        '{ADMIN_NAME}': adminName,
        '{ADMIN_EMAIL}': adminEmail
      }

      let subject = rawSubject
      let body = rawBody

      Object.entries(placeholders).forEach(([k, v]) => {
        subject = subject.replace(new RegExp(k, 'g'), v)
        body = body.replace(new RegExp(k, 'g'), v)
      })

      const htmlBody = body.replace(/\n/g, '<br/>')

      // Determine recipient: Redirect to admin if testing (manual trigger)
      const isTest = !!manualTriggerDate
      const recipientEmail = isTest ? adminEmail : vol.email

      let finalSubject = subject
      let finalHtmlBody = htmlBody

      if (isTest) {
        finalSubject = `[TEST] ${subject}`
        finalHtmlBody = `<p style="color: red; font-weight: bold;">⚠️ TEST MODUS: Dit bericht zou verzonden zijn naar ${vol.name} (${vol.email})</p><hr>${htmlBody}`
      }

      console.log(`Sending ${isTest ? 'TEST' : ''} to ${recipientEmail} (originally for ${vol.email})...`)

      // Actual Send
      const sendResult = await sendReminderEmail(recipientEmail, finalSubject, finalHtmlBody, isTest ? [] : ccs)

      const msgId = sendResult.id
      const error = sendResult.error

      // Log
      const status = error ? 'failed' : 'sent'
      if (!error) sentCount++

      await supabaseAdmin.from('notification_logs').insert({
        volunteer_id: vol.id,
        schedule_date_id: schDate.id,
        sent_at: new Date().toISOString(),
        to_email: vol.email,
        subject,
        body_text: body,
        status,
        error: error ? JSON.stringify(error) : null,
        provider_message_id: msgId ? (typeof msgId === 'string' ? msgId : JSON.stringify(msgId)) : null
      })
    }

    // Update "Sent" status if not manual
    if (sentCount > 0 && !manualTriggerDate) {
      await supabaseAdmin.from('schedule_dates').update({ reminder_sent_at: new Date().toISOString() }).eq('id', schDate.id)
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Process finished', sent: sentCount, success: true })
    }

  } catch (err: any) {
    console.error('CRITICAL HANDLER ERROR:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message,
        stack: err.stack,
        hint: 'Check Netlify Function Logs for more details.'
      })
    }
  }
}

export const handler = schedule('0 8 * * 1', reminderHandler)
