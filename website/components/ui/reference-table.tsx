import * as stylex from '@stylexjs/stylex';

const styles = stylex.create({
  cell: {
    borderBottom: '1px solid #d5ddf7',
    fontSize: 15,
    lineHeight: 1.5,
    padding: '12px 16px',
    textAlign: 'left',
    verticalAlign: 'top',
  },
  defaultColumn: { width: '22%' },
  descriptionColumn: { width: '42%' },
  heading: { backgroundColor: '#f5f7fc', fontWeight: 600 },
  name: { fontFamily: 'ui-monospace, monospace', whiteSpace: 'nowrap' },
  propertyColumn: { width: '36%' },
  table: {
    borderCollapse: 'collapse',
    minWidth: 640,
    tableLayout: 'fixed',
    width: '100%',
  },
  wrapper: { maxWidth: '100%', overflowX: 'auto' },
});

const ReferenceTable = ({
  label,
  rows,
}: {
  label: string;
  rows: readonly (readonly [string, string, string])[];
}) => (
  <div {...stylex.props(styles.wrapper)}>
    <table aria-label={label} {...stylex.props(styles.table)}>
      <colgroup>
        <col {...stylex.props(styles.propertyColumn)} />
        <col {...stylex.props(styles.defaultColumn)} />
        <col {...stylex.props(styles.descriptionColumn)} />
      </colgroup>
      <thead>
        <tr>
          {['Property', 'Default', 'Description'].map((heading) => (
            <th
              key={heading}
              scope="col"
              {...stylex.props(styles.cell, styles.heading)}
            >
              {heading}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(([name, defaultValue, description]) => (
          <tr key={name}>
            <th scope="row" {...stylex.props(styles.cell, styles.name)}>
              {name}
            </th>
            <td {...stylex.props(styles.cell)}>{defaultValue}</td>
            <td {...stylex.props(styles.cell)}>{description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export { ReferenceTable };
