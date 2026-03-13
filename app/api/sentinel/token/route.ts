import { NextResponse } from 'next/server';

export async function POST() {
  const clientId = process.env.SH_CLIENT_ID;
  const clientSecret = process.env.SH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'Sentinel Hub credentials not configured' },
      { status: 500 }
    );
  }

  const res = await fetch(
    'https://services.sentinel-hub.com/auth/realms/main/protocol/openid-connect/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    }
  );

  if (!res.ok) {
    return NextResponse.json({ error: 'Token fetch failed' }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json({ access_token: data.access_token });
}
