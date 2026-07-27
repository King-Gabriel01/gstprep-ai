// Verifies a Google Identity Services ID token by calling Google's tokeninfo
// endpoint, avoiding an extra SDK dependency (google-auth-library).

async function verifyGoogleIdToken(idToken) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID is not set in the environment.');
  }

  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );

  if (!response.ok) {
    throw new Error('Invalid Google token.');
  }

  const payload = await response.json();

  if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
    throw new Error('Google token was not issued for this application.');
  }

  if (!payload.email_verified || payload.email_verified === 'false') {
    throw new Error('Google account email is not verified.');
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    firstName: payload.given_name || '',
    lastName: payload.family_name || '',
    profilePictureUrl: payload.picture || '',
  };
}

module.exports = { verifyGoogleIdToken };
