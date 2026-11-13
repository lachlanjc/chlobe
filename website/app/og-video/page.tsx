import type { Metadata } from 'next';
import type { CSSProperties } from 'react';

import { OgVideoGlobe } from './globe';

// This fixed-size page is a source for the committed video asset.
// oxlint-disable-next-line react-doctor/only-export-components
export const metadata: Metadata = { robots: { follow: false, index: false } };

const cardStyle: CSSProperties = {
  backgroundColor: '#0B2471',
  color: '#FFFBF3',
  height: 630,
  overflow: 'hidden',
  position: 'relative',
  width: 1200,
};

const contentStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  fontWeight: 600,
  height: '100%',
  justifyContent: 'space-between',
  padding: 60,
  position: 'relative',
  width: 680,
  zIndex: 1,
};

const OgVideoPage = () => (
  <main style={cardStyle}>
    <div style={contentStyle}>
      <div style={{ color: '#ABF1D0', fontSize: 36 }}>chlobe</div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          fontSize: 92,
          letterSpacing: '-0.055em',
          lineHeight: 0.98,
        }}
      >
        <div>Visualize</div>
        <div>country data</div>
        <div>
          on a gl<span style={{ color: '#ABF1D0' }}></span>be.
        </div>
      </div>
      <div style={{ color: '#d5ddf7', fontSize: 28 }}>
        A 15kb React choropleth globe.
      </div>
    </div>
    <div style={{ left: 600, position: 'absolute', top: 15 }}>
      <OgVideoGlobe />
    </div>
  </main>
);

export default OgVideoPage;
