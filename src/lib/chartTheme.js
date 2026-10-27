export const CHART = {
  brand: '#496653',
  brandSoft: '#EAF0E9',
  brandLight: '#8FA997',
  neutral: '#B9BDB4',
  neutralDark: '#6B7169',
  warn: '#A96B27',
  danger: '#B84A43',
  info: '#526D83',
  grid: '#EDEEEA',
  axis: '#E3E5DF',
};

export const axisProps = {
  stroke: CHART.axis,
  tick: { fill: CHART.neutralDark, fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: CHART.axis },
};

export const yAxisProps = {
  ...axisProps,
  width: 42,
};

export const tooltipProps = {
  contentStyle: {
    borderRadius: 8,
    border: `1px solid ${CHART.axis}`,
    boxShadow: '0 6px 18px rgba(37,41,35,0.08)',
    fontSize: 12,
    padding: '8px 10px',
  },
  labelStyle: { color: '#252923', fontWeight: 600, marginBottom: 4, fontSize: 11.5 },
  itemStyle: { padding: 0, fontSize: 12 },
};

export const gridProps = {
  stroke: CHART.grid,
  vertical: false,
};