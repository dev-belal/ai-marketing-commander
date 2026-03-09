import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

type SendInviteParams = {
  email: string
  name: string
  token: string
  accountType: string
}

type SendBetaInviteParams = {
  email: string
  token: string
  accountType: string
  personalMessage: string | null
}

export async function sendInviteEmail({
  email,
  name,
  token,
  accountType,
}: SendInviteParams): Promise<{ data: { id: string } | null; error: string | null }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const inviteLink = `${appUrl}/invite/${token}`

  const { data, error } = await resend.emails.send({
    from: 'AI Marketing Command Center <invite@mail.fourpielabs.com>',
    to: email,
    subject: "You're invited to AI Marketing Command Center",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">
          Welcome, ${name}!
        </h1>
        <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 8px;">
          Your request for a <strong>${accountType}</strong> account has been approved.
        </p>
        <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 24px;">
          Click the button below to create your account and get started.
        </p>
        <a
          href="${inviteLink}"
          style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 16px; font-weight: 500; padding: 12px 24px; border-radius: 8px; text-decoration: none;"
        >
          Accept Invite &amp; Create Account
        </a>
        <p style="font-size: 14px; color: #6b7280; margin-top: 24px; line-height: 1.5;">
          This invite link expires in 7 days. If you didn&rsquo;t request access,
          you can safely ignore this email.
        </p>
      </div>
    `,
  })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function sendBetaInviteEmail({
  email,
  token,
  accountType,
  personalMessage,
}: SendBetaInviteParams): Promise<{ data: { id: string } | null; error: string | null }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const inviteLink = `${appUrl}/invite/${token}`
  const accountLabel = accountType === 'team' ? 'Team' : 'Solo'

  const personalBlock = personalMessage
    ? `<div style="background-color: #f8fafc; border-left: 3px solid #3b82f6; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
        <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0; font-style: italic;">"${personalMessage}"</p>
       </div>`
    : ''

  const { data, error } = await resend.emails.send({
    from: 'AI Marketing Commander <invite@mail.fourpielabs.com>',
    to: email,
    subject: "You're invited to AI Marketing Commander Beta",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 14px; font-weight: 600; padding: 6px 14px; border-radius: 20px; letter-spacing: 0.5px;">
            BETA INVITE
          </div>
        </div>

        <h1 style="font-size: 26px; font-weight: 700; margin-bottom: 12px; color: #0f172a; text-align: center;">
          You&rsquo;re In.
        </h1>

        <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 8px; text-align: center;">
          You&rsquo;ve been personally invited to try <strong>AI Marketing Commander</strong> &mdash; the all-in-one AI platform built for marketing agencies.
        </p>

        <p style="font-size: 14px; color: #6b7280; line-height: 1.5; margin-bottom: 24px; text-align: center;">
          Account type: <strong>${accountLabel}</strong>
        </p>

        ${personalBlock}

        <div style="text-align: center; margin-bottom: 32px;">
          <a
            href="${inviteLink}"
            style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px; text-decoration: none;"
          >
            Accept Invite &amp; Get Started
          </a>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
          <p style="font-size: 13px; color: #9ca3af; line-height: 1.5; margin: 0;">
            This invite expires in 7 days. If you didn&rsquo;t expect this, you can safely ignore it.
          </p>
        </div>
      </div>
    `,
  })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}
