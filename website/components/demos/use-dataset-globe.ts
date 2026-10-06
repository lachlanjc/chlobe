import { useRef, useState } from 'react';

import type {
  ChoroplethGlobeData,
  ChoroplethGlobeRef,
} from '../../../dist/index.js';
import { formatValue, getFeaturedEntries, getGlobeValue } from './demo-data';
import type { Dataset, DatasetEntry, Story } from './demo-data';

const useDatasetGlobe = (dataset: Dataset, story: Story) => {
  const globeRef = useRef<ChoroplethGlobeRef>(null);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(
    story === 'oil' ? 'US' : null
  );
  const prepared = {
    data: dataset.entries.map((entry) => ({
      alpha2: entry.alpha2,
      label: entry.label,
      value: getGlobeValue(story, entry.value),
    })),
    featured: getFeaturedEntries(story, dataset.entries),
    sourceById: new Map(dataset.entries.map((entry) => [entry.alpha2, entry])),
  };

  const formatTooltipValue = (_value: number, entry: ChoroplethGlobeData) => {
    const source = prepared.sourceById.get(entry.alpha2);
    return source ? `${formatValue(story, source.value)} · ${source.year}` : '';
  };
  const entryProps = (entry: DatasetEntry) => ({
    'aria-pressed': activeEntryId === entry.alpha2,
    onBlur: () => globeRef.current?.clearHoveredEntry(),
    onClick: () => globeRef.current?.navigateToEntry(entry.alpha2),
    onFocus: () => globeRef.current?.hoverEntry(entry.alpha2),
    onMouseEnter: () => globeRef.current?.hoverEntry(entry.alpha2),
    onMouseLeave: () => globeRef.current?.clearHoveredEntry(),
  });

  return {
    activeEntryId,
    data: prepared.data,
    entryProps,
    featured: prepared.featured,
    formatTooltipValue,
    globeRef,
    handleActiveEntryChange: setActiveEntryId,
  };
};

export { useDatasetGlobe };
