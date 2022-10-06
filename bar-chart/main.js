import './style.css'
import * as d3 from 'd3'

const CHART_SIZE = Object.freeze({
  WIDTH: 900,
  HEIGHT: 600,
  PADDING: 60,
})
const numberFormatter = Intl.NumberFormat('en-EN')

const fetchDataset = async () => {
  const content = await fetch('./data.json').then(res => res.json())
  return content.data
}

const prepareDataset = (dataset) => {
  const preparedDataset = [];
  const parseTime = d3.timeParse('%Y-%m-%d')
  dataset.forEach(d => {
    preparedDataset.push([
      parseTime(d[0]),
      d[1],
      d[0]
    ])
  })
  return preparedDataset
}

const buildTooltip = () => {
  d3.select('#chart')
    .append('div')
    .attr('id', 'tooltip')
}

const updateTooltip = ({ show = false, left = '0px', top = '70%', content = '', date = null } = {}) => {
  d3.select('#chart')
    .select('#tooltip')
    .attr('data-date', date)
    .style('left', left)
    .style('top', top)
    .style('opacity', () => show ? '1' : null)
    .html(content)
}

const buildChart = (dataset = []) => {
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(dataset, d => d[1])])
    .range([CHART_SIZE.HEIGHT - CHART_SIZE.PADDING, CHART_SIZE.PADDING])
  const xScale = d3.scaleTime()
    .domain(d3.extent(dataset, d => d[0]))
    .range([CHART_SIZE.PADDING, CHART_SIZE.WIDTH - CHART_SIZE.PADDING])

  const yAxis = d3.axisLeft(yScale)
  const xAxis = d3.axisBottom(xScale)

  const svg = d3.select('#chart')
    .append('svg')
    .attr('width', CHART_SIZE.WIDTH)
    .attr('height', CHART_SIZE.HEIGHT)

  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -CHART_SIZE.PADDING * 4)
    .attr('y', CHART_SIZE.PADDING * 1.3)
    .text('Gross Domestic Product')

  svg.append('text')
    .style('font-size', '14px')
    .attr('x', CHART_SIZE.WIDTH / 2)
    .attr('y', CHART_SIZE.HEIGHT - CHART_SIZE.PADDING / 4)
    .html('More Information: <a href="http://www.bea.gov/national/pdf/nipaguid.pdf" target="_blank">http://www.bea.gov/national/pdf/nipaguid.pdf</a>')

  svg.append('g')
    .attr('transform', `translate(${CHART_SIZE.PADDING}, 0)`)
    .attr('id', 'y-axis')
    .call(yAxis)

  svg.append('g')
    .attr('transform', `translate(0, ${CHART_SIZE.HEIGHT - CHART_SIZE.PADDING})`)
    .attr('id', 'x-axis')
    .call(xAxis)

  svg.selectAll('rect')
    .data(dataset)
    .enter()
    .append('rect')
    .attr('data-date', d => d[2])
    .attr('data-gdp', d => d[1])
    .attr('class', 'bar')
    .attr('width', () => {
      return (CHART_SIZE.WIDTH - CHART_SIZE.PADDING * 2) / dataset.length
    })
    .attr('height', d => {
      return CHART_SIZE.HEIGHT - CHART_SIZE.PADDING - yScale(d[1])
    })
    .attr('x', (d, i) => {
      return (CHART_SIZE.WIDTH - CHART_SIZE.PADDING * 2) / dataset.length * i + CHART_SIZE.PADDING
    })
    .attr('y', d => {
      return yScale(d[1])
    })
    .on('mouseenter', (e, d) => {
      updateTooltip({
        show: true,
        left: e.offsetX + 50 + 'px',
        content: `${d[0].getFullYear()} ${(d[0].getMonth() + 3) / 3}Q<br>$${numberFormatter.format(d[1])} Billion`,
        date: d[2]
      })
    })
    .on('mouseout', () => {
      updateTooltip({ show: false })
    })
}

document.addEventListener('DOMContentLoaded', async () => {
  buildTooltip();
  const dataset = await fetchDataset()
  const preparedDataset = prepareDataset(dataset);
  buildChart(preparedDataset)
})


