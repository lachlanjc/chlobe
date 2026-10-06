import { DatasetDemos } from '../components/demos/dataset-demos';
import { Hero } from '../components/hero';
import { ProjectBar } from '../components/project-bar';
import { UsageGuide } from '../components/usage-guide';

const Home = () => (
  <>
    <ProjectBar as="header" />
    <Hero />
    <DatasetDemos />
    <UsageGuide />
    <ProjectBar as="footer" />
  </>
);

export default Home;
