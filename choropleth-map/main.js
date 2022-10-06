import './style.css'
import * as d3 from 'd3'
import * as topojson from 'topojson'

const formatGeoPath = d3.geoPath()

const fetchDatasets = () => {
  return Promise.all([
    fetch('./counties.json').then(response => response.json()),
    fetch('./education.json').then(response => response.json())
  ])
}

const buildWrapper = (id) => {
  return d3.select('body')
    .append('div')
    .attr('id', id)
    .style('position', 'relative')
}

const buildHeader = () => {
  d3.select('body').append('h1')
    .attr('id', 'title')
    .text('United States Educational Attainment')
  d3.select('body').append('p')
    .attr('id', 'description')
    .text('Percentage of adults age 25 and older with a bachelor\'s degree or higher (2010-2014)')
}

const buildChart = ({
  parent = null,
  countyDataset = [],
  educationDataset = []
} = {}) => {
  const SIZE = {
      WIDTH: 900,
      HEIGHT: 600,
    },
    THRESHOLD_DOMAIN = [3, 12, 21, 30, 39, 48, 57, 66],
    THRESHOLD_DOMAIN_LEGEND = THRESHOLD_DOMAIN.slice(0, -1),
    THRESHOLD_RANGE = d3.schemeBlues[9]

  const findEducationItem = d => educationDataset.find(item => item.fips === d.id)

  const thresholdScale = d3.scaleThreshold()
    .domain(THRESHOLD_DOMAIN)
    .range(THRESHOLD_RANGE)

  const legendScale = d3.scaleLinear()
          .domain(d3.extent(THRESHOLD_DOMAIN))
          .range([600, 900]),
        legendAxis = d3.axisBottom(legendScale)
          .tickValues(THRESHOLD_DOMAIN)
          .tickFormat(d => `${d}%`)
          .tickSize(15)

  const tooltip = parent.append('div')
    .attr('id', 'tooltip')
  const updateTooltip = ({
    content = '',
    left = 0,
    top = 0,
    show = false,
    dataEducation = null
  } = {}) => {
    tooltip
      .attr('data-education', dataEducation)
      .style('left', left + 'px')
      .style('top', top + 'px')
      .style('opacity', show ? 1 : 0)
      .html(content)
  }

  const svg = parent.append('svg')
    .attr('width', SIZE.WIDTH)
    .attr('height', SIZE.HEIGHT)

  const legend = svg.append('g')
    .attr('id', 'legend')
    .attr('transform', 'translate(-40, 40)')

  legend.selectAll('rect')
    .data(THRESHOLD_DOMAIN_LEGEND)
    .enter()
    .append('rect')
    .attr('x', d => legendScale(d))
    .attr('y', 0)
    .attr('width', 300 / (THRESHOLD_DOMAIN.length - 1))
    .attr('height', 10)
    .attr('fill', d => thresholdScale(d))

  legend.call(legendAxis).select('.domain').remove()

  svg.append('g')
    .attr('class', 'counties')
    .selectAll('path')
    .data(topojson.feature(countyDataset, countyDataset.objects.counties).features)
    .enter()
    .append('path')
    .attr('data-fips', d => findEducationItem(d).fips)
    .attr('data-education', d => findEducationItem(d).bachelorsOrHigher)
    .attr('fill', d => thresholdScale(findEducationItem(d).bachelorsOrHigher))
    .attr('class', 'county')
    .attr('d', formatGeoPath)
    .on('mouseenter', function(e, d) {
      d3.select(this)
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
      const educationItem = findEducationItem(d)
      updateTooltip({
        content: `${educationItem.area_name}, ${educationItem.state}: ${educationItem.bachelorsOrHigher}%`,
        left: e.offsetX + 30,
        top: e.offsetY - 30,
        show: true,
        dataEducation: educationItem.bachelorsOrHigher
      })
    })
    .on('mouseout', function() {
      d3.select(this)
        .attr('stroke', null)
        .attr('stroke-width', null)
      updateTooltip()
    })
}

document.addEventListener('DOMContentLoaded', async () => {
  buildHeader()
  const parent = buildWrapper('chart')
  const [countyDataset, educationDataset] = await fetchDatasets()
  buildChart({
    parent,
    countyDataset,
    educationDataset
  })
})
