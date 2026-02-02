
import type { Handler } from '@netlify/functions'
import { schedule } from '@netlify/functions'
import { supabaseAdmin } from './lib/supabase-admin'
import { sendReminderEmail } from './lib/email'
import { nextSaturday, startOfDay, format } from 'date-fns'
import { nl } from 'date-fns/locale'

const reminderHandler: Handler = async (_event, context) => {
  console.log('Running scheduled reminder check...')

  // 1. Determine "Next Saturday"
  const today = startOfDay(new Date())
  const targetDate = nextSaturday(today)
  const targetDateStr = format(targetDate, 'yyyy-MM-dd')

  console.log(`Checking for collection on ${targetDateStr}`)

  // 2. Fetch Settings 
  const { data: settingsData } = await supabaseAdmin.from('app_settings').select('*')
  const settings: any = {}
  if (settingsData) {
    settingsData.forEach((row: any) => settings[row.key] = row.value)
  }

  // Defaults
  const adminEmail = settings.admin_email || process.env.ADMIN_EMAIL || 'admin@school.nl'
  const adminName = settings.admin_name || 'Admin'
  const ccs = [adminEmail]
  if (settings.cc_email_1) ccs.push(settings.cc_email_1)
  if (settings.cc_email_2) ccs.push(settings.cc_email_2)

  // 3. Check Schedule
  const { data: dateRows, error: dError } = await supabaseAdmin
    .from('schedule_dates')
    .select(`
      *,
      schedule:schedules!inner(is_active),
       assignments(
        role,
        volunteer:volunteers(id, name, email)
      )
    `)
    .eq('date', targetDateStr)
    .eq('schedule.is_active', true)

  if (dError) {
    console.error('Error fetching date:', dError)
    return { statusCode: 500 }
  }

  if (!dateRows || dateRows.length === 0) {
    console.log('No active collection found for this Saturday.')
    return { statusCode: 200 }
  }

  const schDate = dateRows[0]

  if (schDate.reminder_sent_at) {
    console.log('Reminder already sent for this date.')
    // Could log "skipped" if we wanted granular daily logs, but day-level check is usually sufficient
    return { statusCode: 200 }
  }

  // 4. Send Emails
  const startTimes = {
    'V1': '08:30', 'V2': '08:30',
    'L1': '08:30', 'L2': '08:30',
    'R1': '09:00', 'R2': '09:00'
  }
  const endTimes = {
    'V1': '12:00', 'V2': '12:00',
    'L1': '12:00', 'L2': '12:00',
    'R1': '12:00', 'R2': '12:00'
  }

  // Prepare Template Replacer
  const replaceTags = (text: string, vol: any, role: string) => {
    let res = text
    const map: Record<string, string> = {
      '{SALUTATION}': vol.name.split(' ')[0], // First name guess
      '{DATE}': format(targetDate, 'd MMMM', { locale: nl }),
      '{ROLE}': role,
      '{TIME_START}': startTimes[role as keyof typeof startTimes] || '08:30',
      '{TIME_END}': endTimes[role as keyof typeof endTimes] || '12:00',
      '{ADMIN_NAME}': adminName,
      '{ADMIN_EMAIL}': adminEmail
    }

    Object.entries(map).forEach(([k, v]) => {
      res = res.replace(new RegExp(k, 'g'), v)
    })
    return res
  }

  let successCount = 0
  let failCount = 0

  for (const assignment of schDate.assignments) {
    if (!assignment.volunteer?.email) continue

    const role = assignment.role
    const vol = assignment.volunteer

    // @ts-ignore
    const subject = replaceTags(settings.subject_template || 'Oud papier – planning voor zaterdag {DATE}', vol, role)
    // @ts-ignore
    const body = replaceTags(settings.text_template || 'Hallo {SALUTATION},\n\nJouw rol: {ROLE}\nTijd: {TIME_START}\n\nTot zaterdag!', vol, role)
    const htmlBody = body.replace(/\n/g, '<br/>')

    // Send
    const { id: msgId, error } = await sendReminderEmail(vol.email, subject, htmlBody, ccs)

    // Log
    const status = error ? 'failed' : 'sent'
    if (error) failCount++
    else successCount++

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

  // 5. Update status ONLY if at least one sent? Or if attempted?
  // If mixed success, we might want to flag date as "processed" but maybe with errors?
  // Simple logic: if anyone was handled, mark as sent so we don't spam. Admin can check logs.
  if (successCount > 0) {
    await supabaseAdmin
      .from('schedule_dates')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', schDate.id)
  }

  console.log(`Finished. Sent: ${successCount}. Failed: ${failCount}`)
  return { statusCode: 200 }
}

// Netlify Schedule: Every Monday at 08:00 UTC
export const handler = schedule('0 8 * * 1', reminderHandler)
