export const maxDuration = 60

import { NextResponse } from 'next/server'
import { z } from 'zod'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium-min'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateAuditReport } from '@/lib/pdf/generate-report'

const requestSchema = z.object({
  auditRunId: z.string().uuid(),
})

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { data: profile } = await supabase
    .from('users')
    .select('agency_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json(
      { success: false, error: 'User profile not found.' },
      { status: 403 }
    )
  }

  const body = await request.json()
  const parsed = requestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid request data.' },
      { status: 400 }
    )
  }

  const { auditRunId } = parsed.data
  const agencyId = profile.agency_id

  // Generate HTML report
  const { data: reportData, error: reportError } = await generateAuditReport(
    auditRunId,
    agencyId
  )

  if (reportError || !reportData) {
    return NextResponse.json(
      { success: false, error: reportError ?? 'Failed to generate report.' },
      { status: 500 }
    )
  }

  // Convert HTML to PDF with Puppeteer
  let pdfBuffer: Buffer
  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 720 },
      executablePath: await chromium.executablePath(
        'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
      ),
      headless: true,
    })
    const page = await browser.newPage()
    await page.setContent(reportData.html, { waitUntil: 'networkidle0' })
    const pdfUint8 = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
    pdfBuffer = Buffer.from(pdfUint8)
    await browser.close()
  } catch {
    return NextResponse.json(
      { success: false, error: 'PDF generation failed.' },
      { status: 500 }
    )
  }

  // Upload to Supabase Storage
  const storagePath = `${agencyId}/${reportData.clientId}/${auditRunId}.pdf`
  const admin = createAdminClient()

  const { error: uploadError } = await admin.storage
    .from('reports')
    .upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json(
      { success: false, error: 'Failed to upload PDF.' },
      { status: 500 }
    )
  }

  // Get signed URL (valid for 1 hour)
  const { data: signedUrlData } = await admin.storage
    .from('reports')
    .createSignedUrl(storagePath, 3600)

  const pdfUrl = signedUrlData?.signedUrl ?? ''

  // Insert report_exports row
  const { data: reportExport, error: insertError } = await admin
    .from('report_exports')
    .insert({
      client_id: reportData.clientId,
      agency_id: agencyId,
      audit_run_id: auditRunId,
      title: `Marketing Audit Report - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      pdf_url: pdfUrl,
      storage_path: storagePath,
    })
    .select('id')
    .single()

  if (insertError || !reportExport) {
    return NextResponse.json(
      { success: false, error: 'Failed to save report record.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      reportId: reportExport.id,
      pdfUrl,
    },
  })
}
