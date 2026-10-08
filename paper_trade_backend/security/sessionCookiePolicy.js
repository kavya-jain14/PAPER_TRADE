const ACCESS_TTL_MS = 15 * 60 * 1000;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function sessionCookiePolicy(nodeEnv = process.env.NODE_ENV) {
  const production = nodeEnv === 'production';
  const base = {
    httpOnly: true,
    secure: production,
    sameSite: 'lax',
    path: '/',
  };

  return {
    accessName: production ? '__Host-pt_at' : 'pt_at',
    refreshName: production ? '__Host-pt_rt' : 'pt_rt',
    accessOptions: { ...base, maxAge: ACCESS_TTL_MS },
    refreshOptions: { ...base, maxAge: REFRESH_TTL_MS },
    clearOptions: base,
  };
}

module.exports = { ACCESS_TTL_MS, REFRESH_TTL_MS, sessionCookiePolicy };
