import './style.css'
import * as d3 from 'd3'
import createTooltip from 'd3-tip'

const DATASET_URL = './data.json',
      HEATMAP_SIZE = Object.freeze({
        WIDTH: 1200,
        HEIGHT: 600
      }),
      LEGEND_SIZE = Object.freeze({
        WIDTH: 500,
        HEIGHT: 30,
      }),
      HEATMAP_PADDING = Object.freeze({
        TOP: 30,
        RIGHT: 60,
        BOTTOM: 120,
        LEFT: 120
      }),
      MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      formatMonth = (d) => MONTHS[d],
      parseTime = d3.timeParse('%Y'),
      THRESHOLD_COLORS = [
        '#4475B4',
        '#75ACD0',
        '#AAD9E9',
        '#E0F2F8',
        '#FFFFBF',
        '#FEE08F',
        '#FCAD61',
        '#F36D43',
        '#D73026'
      ],
      THRESHOLD_VALUES = [
        3.9,
        5.0,
        6.1,
        7.2,
        8.3,
        9.5,
        10.6,
        11.7
      ],
      getFullThresholdValues = () => [2.8, ...THRESHOLD_VALUES, 12.8],
      getStartFilledThresholdValues = () => [2.8, ...THRESHOLD_VALUES]

const fetchDataset = () => {
  return fetch(DATASET_URL, { method: 'GET'})
    .then(response => response.json())
}

const prepareDataset = (dataset) => {
  const preparedDataset = []
  dataset.forEach(d => preparedDataset.push({
    ...d,
    month: d.month - 1
  }))
  return preparedDataset
}

const buildTitle = (descTemp, [minYear, maxYear]) => {
  const heatmap = d3.select('#heatmap')
  heatmap.append('h1')
    .attr('id', 'title')
    .text('Monthly Global Land-Surface Temperature')
  heatmap.append('p')
    .attr('id', 'description')
    .text(`${minYear} - ${maxYear}: base temperature ${descTemp}℃`)
}

const getTooltipHtml = (d, baseTemp) => `${d.year} - ${formatMonth(d.month)}<br>${(baseTemp + d.variance).toFixed(1)}℃<br>${d.variance.toFixed(1)}℃`

const buildHeatmap = ({
  baseTemp = 0,
  dataset = []
} = {}) => {
  const tooltip = createTooltip()
    .offset([-10, 0])
    .direction('n')
    .attr('id', 'tooltip')

  const xScale = d3.scaleBand()
          .domain(dataset.map(d => d.year))
          .range([HEATMAP_PADDING.LEFT, HEATMAP_SIZE.WIDTH - HEATMAP_PADDING.RIGHT]),
        xAxis = d3.axisBottom(xScale)
          .tickValues([...new Set(dataset.filter(d => d.year % 10 === 0).map(d => d.year))])

  const yScale = d3.scaleBand()
          .domain(MONTHS.map((_, i) => i))
          .range([HEATMAP_PADDING.TOP, HEATMAP_SIZE.HEIGHT - HEATMAP_PADDING.TOP - HEATMAP_PADDING.BOTTOM]),
        yAxis = d3.axisLeft(yScale)
          .tickFormat(formatMonth)

  const thresholdScale = d3.scaleThreshold()
          .domain(THRESHOLD_VALUES)
          .range(THRESHOLD_COLORS)

  const xLegendScale = d3.scaleBand()
          .domain(getFullThresholdValues())
          .range([0, LEGEND_SIZE.WIDTH]),
        xLegendAxis = d3.axisBottom(xLegendScale)

  const svg = d3.select('#heatmap')
    .style('position', 'relative')
    .append('svg')
    .attr('width', HEATMAP_SIZE.WIDTH)
    .attr('height', HEATMAP_SIZE.HEIGHT)
    .call(tooltip)

  svg.append('text')
    .attr('transform', `translate(${HEATMAP_PADDING.LEFT / 4}, ${(HEATMAP_SIZE.HEIGHT - HEATMAP_PADDING.TOP) / 2}) rotate(-90)`)
    .style('font-size', 10)
    .text('Months')

  svg.append('text')
    .attr('transform', `translate(${HEATMAP_SIZE.WIDTH / 2}, ${(HEATMAP_SIZE.HEIGHT - HEATMAP_PADDING.TOP - HEATMAP_PADDING.BOTTOM / 1.5)})`)
    .style('font-size', 10)
    .text('Years')

  svg.append('g')
    .attr('transform', `translate(0, ${HEATMAP_SIZE.HEIGHT - HEATMAP_PADDING.BOTTOM - HEATMAP_PADDING.TOP})`)
    .attr('id', 'x-axis')
    .call(xAxis)

  svg.append('g')
    .attr('transform', `translate(${HEATMAP_PADDING.LEFT}, 0)`)
    .attr('id', 'y-axis')
    .call(yAxis)

  const legend = svg.append('g')
    .attr('id', 'legend')
    .attr('transform', `translate(${HEATMAP_PADDING.LEFT}, ${HEATMAP_SIZE.HEIGHT - HEATMAP_PADDING.BOTTOM / 4 - HEATMAP_PADDING.TOP})`)
  legend.call(xLegendAxis)
  legend.selectAll('rect')
    .data(getStartFilledThresholdValues())
    .enter()
    .append('rect')
    .attr('x', d => xLegendScale(d) + xLegendScale.bandwidth() / 2)
    .attr('y', -LEGEND_SIZE.HEIGHT)
    .attr('width', () => xLegendScale.bandwidth())
    .attr('height', () => LEGEND_SIZE.HEIGHT)
    .style('stroke', 'black')
    .style('strokeWidth', 1)
    .attr('fill', d => thresholdScale(d))

  svg.selectAll('rect.cell')
    .data(dataset)
    .enter()
    .append('rect')
    .attr('class', 'cell')
    .attr('data-month', d => d.month)
    .attr('data-year', d => d.year)
    .attr('data-temp', d => baseTemp + d.variance)
    .attr('fill', d => thresholdScale(baseTemp + d.variance))
    .attr('x', d => Math.round(xScale(d.year)))
    .attr('y', d => yScale(d.month))
    .attr('width', d => xScale.bandwidth())
    .attr('height', d => yScale.bandwidth())
    .on('mouseenter', function(e, d) {
      d3.select(this)
        .style('stroke', 'black')
        .style('strokeWidth', 1)
      tooltip.attr('data-year', d.year)
      tooltip.html(getTooltipHtml(d, baseTemp))
      tooltip.show(d, this)
    })
    .on('mouseout', function(e, d) {
      d3.select(this)
        .style('stroke', null)
        .style('strokeWidth', null)
      tooltip.hide(d, this)
    })
}

document.addEventListener('DOMContentLoaded', async () => {
  const { baseTemperature, monthlyVariance } = await fetchDataset()
  const preparedDataset = prepareDataset(monthlyVariance)
  buildTitle(baseTemperature, d3.extent(preparedDataset, d => d.year))
  buildHeatmap({
    baseTemp: baseTemperature,
    dataset: preparedDataset
  })
})
