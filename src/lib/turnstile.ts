export const verifyTurnstile = async (token: string, ip?: string): Promise<boolean> => {
  const secretKey = process.env.TURNSTILEKEY;
  if (!secretKey) {
    console.warn('TURNSTILEKEY not set in environment variables');
    return true; // Bypass in dev if key is missing (up to user)
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (ip) {
      formData.append('remoteip', ip);
    }

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      body: formData,
      method: 'POST',
    });

    const outcome = await result.json();
    return outcome.success;
  } catch (error) {
    console.error('Error verifying Turnstile token:', error);
    return false;
  }
};
