export async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    // Skip verification in dev or if not configured
    return true
  }

  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret,
          response: token,
        }),
      }
    )
    const data = await response.json() as { success: boolean }
    return data.success === true
  } catch {
    // If Turnstile is down, don't block users
    return true
  }
}
