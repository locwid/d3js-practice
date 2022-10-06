import './style.css'
import * as d3 from 'd3'

const DATASET_URL = './data.json',
      GRAPH_SIZE = Object.freeze({
        WIDTH: 900,
        HEIGHT: 600,
        PADDING: 60
      }),
      TIME_FORMAT = Object.freeze({
        TIME: '%M:%S',
      })

const formatTime = d3.timeFormat(TIME_FORMAT.TIME),
      parseTime = d3.timeParse(TIME_FORMAT.TIME)

const fetchDataset = async () => {
  const response = await fetch(DATASET_URL)
  return response.json()
}

const prepareDataset = (dataset) => {
  const preparedDataset = []
  dataset.forEach(d => preparedDataset.push({
    ...d,
    Time: parseTime(d.Time)
  }))
  return preparedDataset;
}

const buildTitle = () => {
  const graph = d3.select('#graph')
  graph.append('h1')
    .attr('id', 'title')
    .text('Doping in Professional Bicycle Racing')
  graph.append('p')
    .text('35 Fastest times up Alpe d\'Huez')
}

const buildTooltip = () => {
  d3.select('#graph')
    .append('div')
    .attr('id', 'tooltip')
}

const updateTooltip = ({
  content = '',
  left = '0px',
  top = '0px',
  show = false,
  date = null
}) => {
  d3.select('#graph')
    .select('#tooltip')
    .attr('data-year', date)
    .style('opacity', show ? '0.9' : null)
    .style('left', left)
    .style('top', top)
    .html(content)
}

const formatTooltipContent = ({
  Name,
  Nationality,
  Year,
  Time,
  Doping
}) => {
  const descPart = Doping ? `<br><br><span>${Doping}</span>` : ''
  return `<span>${Name}: ${Nationality}</span><br><span>Year: ${Year}, Time: ${formatTime(Time)}</span>${descPart}`
}

const buildGraph = (dataset) => {
  const xDomain = [
          d3.min(dataset, d => d.Year) - 1,
          d3.max(dataset, d => d.Year) + 1
        ],
        xRange = [GRAPH_SIZE.PADDING, GRAPH_SIZE.WIDTH - GRAPH_SIZE.PADDING],
        xScale = d3.scaleLinear()
          .domain(xDomain)
          .range(xRange),
        xAxis = d3.axisBottom(xScale)
          .tickFormat(d3.format('d'))

  const yDomain = d3.extent(dataset, d => d.Time),
        yRange = [GRAPH_SIZE.PADDING, GRAPH_SIZE.HEIGHT - GRAPH_SIZE.PADDING],
        yScale = d3.scaleTime()
          .domain(yDomain)
          .range(yRange),
        yAxis = d3.axisLeft(yScale)
          .ticks(d3.timeSecond.every(15))
          .tickFormat(formatTime)

  const legendKeys = [
    {
      title: 'No doping allegations',
      doping: false
    },
    {
      title: 'Riders with doping allegations',
      doping: true
    }
  ]
  const colorScale = d3.scaleOrdinal(d3.schemeSet2)

  const svg = d3.select('#graph')
    .style('position', 'relative')
    .append('svg')
    .attr('width', GRAPH_SIZE.WIDTH)
    .attr('height', GRAPH_SIZE.HEIGHT)

  svg.append('text')
    .attr('transform', `rotate(-90)`)
    .style('font-size', '18px')
    .attr('x', -GRAPH_SIZE.PADDING * 4)
    .attr('y', GRAPH_SIZE.PADDING / 4)
    .text('Time in Minutes')

  svg.append('g')
    .attr('transform', `translate(0, ${GRAPH_SIZE.HEIGHT - GRAPH_SIZE.PADDING})`)
    .call(xAxis)
    .attr('id', 'x-axis')

  svg.append('g')
    .attr('transform', `translate(${GRAPH_SIZE.PADDING}, 0)`)
    .call(yAxis)
    .attr('id', 'y-axis')

  svg.selectAll('circle')
    .data(dataset)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('data-xvalue', d => d.Year)
    .attr('data-yvalue', d => d.Time.toISOString())
    .attr('fill', d => colorScale(!!d.Doping))
    .attr('stroke', 'dimgrey')
    .attr('strokeWidth', 1)
    .attr('fill-opacity', '0.95')
    .attr('r', 7)
    .attr('cx', d => xScale(d.Year))
    .attr('cy', d => yScale(d.Time))
    .on('mouseenter', function (e, d) {
      d3.select(this)
        .attr('stroke', 'black')
      updateTooltip({
        content: formatTooltipContent(d),
        left: e.offsetX + 7 + 'px',
        top: e.offsetY + 'px',
        show: true,
        date: d.Year
      })
    })
    .on('mouseout', function() {
      d3.select(this)
        .attr('stroke', 'dimgrey')
      updateTooltip({ show: false })
    })

  const legend = svg.append('g')
    .attr('transform', `translate(${GRAPH_SIZE.WIDTH - 300},${GRAPH_SIZE.HEIGHT / 3})`)
    .attr('id', 'legend')
  legend.selectAll('circle')
    .data(legendKeys)
    .enter()
    .append('circle')
    .attr('r', 7)
    .attr('cx', 100)
    .attr('cy', (d, i) => 100 + 25 * i)
    .style('fill', (d) => colorScale(d.doping))
  legend.selectAll('text')
    .data(legendKeys)
    .enter()
    .append('text')
    .attr('x', 110)
    .attr('y', (d, i) => 103 + 25 * i)
    .style('font-size', '12px')
    .style('fill', (d) => colorScale(d.doping))
    .text(d => d.title)
}

document.addEventListener('DOMContentLoaded', async () => {
  const dataset = await fetchDataset()
  const preparedDataset = prepareDataset(dataset)
  buildTitle();
  buildTooltip();
  buildGraph(preparedDataset);
})
