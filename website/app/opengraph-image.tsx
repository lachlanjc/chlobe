import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { ImageResponse } from 'next/og';

export const alt = 'Chlobe — visualize country data on a globe.';
export const size = { height: 630, width: 1200 };
export const contentType = 'image/png';

export default async function Image() {
  const [font, globe] = await Promise.all([
    readFile(path.join(process.cwd(), 'app/fonts/Booton-SemiBold.ttf')),
    readFile(path.join(process.cwd(), 'public/opengraph-globe.png')),
  ]);

  return new ImageResponse(
    <div
      style={{
        backgroundColor: '#0B2471',
        color: '#FFFBF3',
        display: 'flex',
        fontFamily: 'Booton',
        fontWeight: 600,
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          width: 680,
        }}
      >
        <div style={{ color: '#ABF1D0', fontSize: 36 }}>chlobe</div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 96,
            letterSpacing: '-0.055em',
            lineHeight: 0.98,
          }}
        >
          <div>Visualize</div>
          <div>country data</div>
          <div style={{ display: 'flex' }}>
            on a gl<span style={{ color: '#ABF1D0' }}></span>be.
          </div>
        </div>
        <div style={{ color: '#d5ddf7', fontSize: 28 }}>
          A 15KB React choropleth globe.
        </div>
      </div>
      {/* ImageResponse embeds the local still directly; next/image requires a browser. */}
      {/* oxlint-disable-next-line nextjs/no-img-element */}
      <img
        alt="Country data rendered as blue dots on an off-white globe"
        height={600}
        src={`data:image/png;base64,${globe.toString('base64')}`}
        style={{ left: 600, position: 'absolute', top: 15 }}
        width={600}
      />
    </div>,
    {
      ...size,
      fonts: [{ data: font, name: 'Booton', style: 'normal', weight: 600 }],
    }
  );
}
