import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { bbox, index, dateFrom, dateTo, token } = await req.json();

  const evalScripts: Record<string, string> = {
    NDVI: `//VERSION=3
function setup() { return { input: ["B04","B08","dataMask"], output: { bands: 4 } }; }
const viz = new ColorRampVisualizer([[-0.5,0x9b2226],[-0.2,0xe9c46a],[0.0,0xffffff],[0.2,0xb7e4c7],[0.5,0x40916c],[1.0,0x1b4332]]);
function evaluatePixel(s) { let v = index(s.B08,s.B04); let c = viz.process(v); return [...c, s.dataMask]; }`,

    NDWI: `//VERSION=3
function setup() { return { input: ["B03","B08","dataMask"], output: { bands: 4 } }; }
const viz = new ColorRampVisualizer([[-1,0xa52a2a],[-0.2,0xf4d03f],[0,0xffffff],[0.2,0x85c1e9],[1,0x1a5276]]);
function evaluatePixel(s) { let v = index(s.B03,s.B08); let c = viz.process(v); return [...c, s.dataMask]; }`,

    NDMI: `//VERSION=3
function setup() { return { input: ["B08","B11","dataMask"], output: { bands: 4 } }; }
const viz = new ColorRampVisualizer([[-1,0x8b0000],[-0.2,0xf0e68c],[0,0xffffff],[0.3,0x6495ed],[1,0x00008b]]);
function evaluatePixel(s) { let v = index(s.B08,s.B11); let c = viz.process(v); return [...c, s.dataMask]; }`,

    BSI: `//VERSION=3
function setup() { return { input: ["B02","B04","B08","B11","dataMask"], output: { bands: 4 } }; }
const viz = new ColorRampVisualizer([[-1,0x006400],[-0.2,0xadff2f],[0.2,0xf5deb3],[1,0x8b4513]]);
function evaluatePixel(s) { let bsi = ((s.B11+s.B04)-(s.B08+s.B02))/((s.B11+s.B04)+(s.B08+s.B02)); let c = viz.process(bsi); return [...c, s.dataMask]; }`,

    EVI: `//VERSION=3
function setup() { return { input: ["B02","B04","B08","dataMask"], output: { bands: 4 } }; }
const viz = new ColorRampVisualizer([[-0.2,0x9b2226],[0.1,0xe9c46a],[0.4,0x52b788],[1,0x1b4332]]);
function evaluatePixel(s) { let evi = 2.5*(s.B08-s.B04)/(s.B08+6*s.B04-7.5*s.B02+1); let c = viz.process(evi); return [...c, s.dataMask]; }`,

    NBR: `//VERSION=3
function setup() { return { input: ["B08","B12","dataMask"], output: { bands: 4 } }; }
const viz = new ColorRampVisualizer([[-1,0x7f3b08],[-0.1,0xfee08b],[0.1,0xd9ef8b],[1,0x006837]]);
function evaluatePixel(s) { let v = index(s.B08,s.B12); let c = viz.process(v); return [...c, s.dataMask]; }`,
  };

  const evalscript = evalScripts[index] ?? evalScripts['NDVI'];

  const body = {
    input: {
      bounds: {
        bbox,
        properties: { crs: 'http://www.opengis.net/def/crs/EPSG/0/4326' },
      },
      data: [
        {
          type: 'sentinel-2-l2a',
          dataFilter: {
            timeRange: { from: dateFrom, to: dateTo },
            maxCloudCoverage: 30,
          },
        },
      ],
    },
    output: {
      width: 512,
      height: 512,
      responses: [{ identifier: 'default', format: { type: 'image/png' } }],
    },
    evalscript,
  };

  const res = await fetch('https://services.sentinel-hub.com/api/v1/process', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'image/png',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text }, { status: res.status });
  }

  const arrayBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return NextResponse.json({ image: `data:image/png;base64,${base64}` });
}
