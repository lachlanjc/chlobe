'use client';

import * as stylex from '@stylexjs/stylex';
import { Button } from 'react-aria-components/Button';
import { ColorArea, ColorThumb } from 'react-aria-components/ColorArea';
import { ColorField } from 'react-aria-components/ColorField';
import { ColorPicker as AriaColorPicker } from 'react-aria-components/ColorPicker';
import type { Color } from 'react-aria-components/ColorPicker';
import { ColorSlider, SliderTrack } from 'react-aria-components/ColorSlider';
import { ColorSwatch } from 'react-aria-components/ColorSwatch';
import { Dialog, DialogTrigger } from 'react-aria-components/Dialog';
import { Input } from 'react-aria-components/Input';
import { Label } from 'react-aria-components/Label';
import { Popover } from 'react-aria-components/Popover';

const styles = stylex.create({
  area: { borderRadius: 2, height: 140, width: '100%' },
  button: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 2,
    color: '#354150',
    cursor: 'pointer',
    display: 'flex',
    gap: 12,
    fontSize: 14,
    padding:4
  },
  dialog: { display: 'grid', gap: 12, outline: 'none', width: 200 },
  field: { alignItems: 'center', display: 'flex', fontSize: 12, gap: 8 },
  focus: { outline: '2px solid #1d4ed8', outlineOffset: 3 },
  input: {
    borderColor: '#cbd5e1',
    borderRadius: 2,
    borderStyle: 'solid',
    borderWidth: 1,
    color: '#354150',
    fontFamily: 'ui-monospace, monospace',
    fontSize: 13,
    minWidth: 0,
    padding: '6px 8px',
    width: '100%',
  },
  popover: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 2,
    borderStyle: 'solid',
    borderWidth: 1,
    boxShadow: '0 8px 30px rgb(15 23 42 / 0.15)',
    maxHeight: 'inherit',
    maxWidth: 'calc(100vw - 24px)',
    overflow: 'auto',
    padding: 12,
  },
  swatch: {
    borderColor: 'rgb(15 23 42 / 0.15)',
    borderRadius: 2,
    borderStyle: 'solid',
    borderWidth: 1,
    height: 20,
    width: 36,
  },
  thumb: {
    borderColor: '#ffffff',
    borderRadius: 2,
    borderStyle: 'solid',
    borderWidth: 2,
    boxShadow: '0 0 0 1px rgb(15 23 42 / 0.5)',
    height: 16,
    width: 16,
  },
  track: { borderRadius: 2, height: 14, width: '100%' },
});

const ColorPicker = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (color: Color) => void;
}) => (
  <AriaColorPicker onChange={onChange} value={value}>
    <DialogTrigger>
      <Button
        aria-label={`${label} color`}
        className={({ isFocusVisible }) =>
          stylex.props(styles.button, isFocusVisible && styles.focus)
            .className ?? ''
        }
      >
        <ColorSwatch {...stylex.props(styles.swatch)} />
        <span>{label}</span>
      </Button>
      <Popover offset={8} placement="bottom" {...stylex.props(styles.popover)}>
        <Dialog aria-label={`${label} color`} {...stylex.props(styles.dialog)}>
          <ColorArea
            aria-label="Saturation and brightness"
            colorSpace="hsb"
            xChannel="saturation"
            yChannel="brightness"
            {...stylex.props(styles.area)}
          >
            <ColorThumb
              className={({ isFocusVisible }) =>
                stylex.props(styles.thumb, isFocusVisible && styles.focus)
                  .className ?? ''
              }
            />
          </ColorArea>
          <ColorSlider aria-label="Hue" channel="hue" colorSpace="hsb">
            <SliderTrack {...stylex.props(styles.track)}>
              <ColorThumb
                className={({ isFocusVisible }) =>
                  stylex.props(styles.thumb, isFocusVisible && styles.focus)
                    .className ?? ''
                }
              />
            </SliderTrack>
          </ColorSlider>
          <ColorField {...stylex.props(styles.field)}>
            <Label>Hex</Label>
            <Input {...stylex.props(styles.input)} />
          </ColorField>
        </Dialog>
      </Popover>
    </DialogTrigger>
  </AriaColorPicker>
);

export { ColorPicker };
