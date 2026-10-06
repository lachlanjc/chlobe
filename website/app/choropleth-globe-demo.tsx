'use client';

import 'react-flagpack/dist/style.css';
import type { Dataset } from './demo-data';
import { ForestDemo } from './forest-demo';
import { OilDemo } from './oil-demo';
import { RenewableDemo } from './renewable-demo';
import { WaterDemo } from './water-demo';

const ChoroplethGlobeDemo = ({
  forest,
  oil,
  renewable,
  water,
}: {
  forest: Dataset;
  oil: Dataset;
  renewable: Dataset;
  water: Dataset;
}) => (
  <>
    <RenewableDemo dataset={renewable} />
    <OilDemo dataset={oil} />
    <ForestDemo dataset={forest} />
    <WaterDemo dataset={water} />
  </>
);

export { ChoroplethGlobeDemo };
