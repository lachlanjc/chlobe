'use client';

import * as stylex from '@stylexjs/stylex';
import type { Color } from 'react-aria-components/ColorPicker';

import type {
  ChoroplethGlobeColors,
  ChoroplethRgb,
} from '../../../dist/index.js';
import { ColorPicker } from '../ui/color-picker';
import { Switch } from '../ui/switch';
import type { GlobeAppearance } from './example-data';

const styles = stylex.create({
  colorControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    // justifyContent: 'center',
    marginTop: 8,
    width: '100%',
  },
  controls: {
    alignSelf: 'center',
    borderWidth: 0,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
    margin: 0,
    minWidth: 0,
    padding: 0,
  },
  controlsLegend: {
    borderWidth: 0,
    clip: 'rect(0, 0, 0, 0)',
    clipPath: 'inset(50%)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    whiteSpace: 'nowrap',
    width: 1,
  },
});

const toRgb = (color: Color): ChoroplethRgb => {
  const rgb = color.toFormat('rgb');
  return [
    Math.round(rgb.getChannelValue('red')),
    Math.round(rgb.getChannelValue('green')),
    Math.round(rgb.getChannelValue('blue')),
  ];
};

const GlobeControls = ({
  appearance,
  autoRotate,
  colors,
  interactive,
  onAppearanceChange,
  onAutoRotateChange,
  onColorsChange,
  onInteractiveChange,
}: {
  appearance: GlobeAppearance;
  autoRotate: boolean;
  colors: ChoroplethGlobeColors;
  interactive: boolean;
  onAppearanceChange: (appearance: GlobeAppearance) => void;
  onAutoRotateChange: (selected: boolean) => void;
  onColorsChange: (colors: ChoroplethGlobeColors) => void;
  onInteractiveChange: (selected: boolean) => void;
}) => (
  <fieldset {...stylex.props(styles.controls)}>
    <legend {...stylex.props(styles.controlsLegend)}>Options</legend>
    <div {...stylex.props(styles.colorControls)}>
      <Switch
        accentColor={`rgb(${colors.filled[1].join(', ')})`}
        isSelected={autoRotate}
        onChange={onAutoRotateChange}
      >
        Auto-rotate
      </Switch>
      <Switch
        accentColor={`rgb(${colors.filled[1].join(', ')})`}
        isSelected={interactive}
        onChange={onInteractiveChange}
      >
        Interactive
      </Switch>
    </div>
    <div {...stylex.props(styles.colorControls)}>
      <ColorPicker
        label="Minimum"
        onChange={(color) =>
          onColorsChange({
            ...colors,
            filled: [toRgb(color), colors.filled[1]],
          })
        }
        value={`rgb(${colors.filled[0].join(', ')})`}
      />
      <ColorPicker
        label="Maximum"
        onChange={(color) =>
          onColorsChange({
            ...colors,
            filled: [colors.filled[0], toRgb(color)],
          })
        }
        value={`rgb(${colors.filled[1].join(', ')})`}
      />
      <ColorPicker
        label="Missing"
        onChange={(color) =>
          onColorsChange({ ...colors, missing: toRgb(color) })
        }
        value={`rgb(${colors.missing.join(', ')})`}
      />
      <ColorPicker
        label="Base"
        onChange={(color) =>
          onAppearanceChange({ ...appearance, baseColor: toRgb(color) })
        }
        value={`rgb(${appearance.baseColor.join(', ')})`}
      />
      <ColorPicker
        label="Glow"
        onChange={(color) =>
          onAppearanceChange({ ...appearance, glowColor: toRgb(color) })
        }
        value={`rgb(${appearance.glowColor.join(', ')})`}
      />
    </div>
  </fieldset>
);

export { GlobeControls };
