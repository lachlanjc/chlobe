import 'react-flagpack/dist/style.css';
import forest from '../../public/data/forest-area-per-person.json';
import oil from '../../public/data/oil-production.json';
import renewable from '../../public/data/renewable-electricity-share.json';
import water from '../../public/data/water-withdrawals-per-person.json';
import { ForestDemo } from './forest-demo';
import { OilDemo } from './oil-demo';
import { RenewableDemo } from './renewable-demo';
import { WaterDemo } from './water-demo';

const DatasetDemos = () => (
  <>
    <RenewableDemo dataset={renewable} />
    <OilDemo dataset={oil} />
    <ForestDemo dataset={forest} />
    <WaterDemo dataset={water} />
  </>
);

export { DatasetDemos };
