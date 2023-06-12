import React, { useEffect, useRef } from 'react'
import { axisBottom, axisLeft, scaleBand, scaleLinear, select } from 'd3'

const BarGraph = ({ data, width, height, rowLabel = `Y Axis`, colLabel = `X Axis`, graphTitle = 'Title' }) => {

	const linesColor = { color: `#a9a9a9` }
	const margin = { top: 50, bottom: 25, left: 25, right: 25 }
	const graphWidth = width - margin.left - margin.right
	const graphHeight = height - margin.top - margin.bottom

	// grade points / bars
	const xAxis = scaleBand().domain(data.map(({ label }) => label)).range([0, graphWidth]).padding(0.5)

	// num of students
	const yAxis = scaleLinear().range([graphHeight, 0]).nice()
	const largestNumStudents = Math.max(...data.map(({ value }) => value))
	largestNumStudents === 1 ? yAxis.domain([0, 1]) : yAxis.domain([0, largestNumStudents])

	const ColAxis = ({ scale }) => {
		const ref = useRef(null)

		useEffect(() => {
			if (ref.current) { select(ref.current).call(axisLeft(scale)) }
		}, [scale])

		return <g ref={ref} style={linesColor} />
	}

	const RowAxis = ({ scale, transform }) => {
		const ref = useRef(null)

		useEffect(() => {
			if (ref.current) { select(ref.current).call(axisBottom(scale)) }
		}, [scale])

		return <g ref={ref} transform={transform} style={linesColor} />
	}

	const VerticalLines = ({ scale, transform }) => {
		const ref = useRef(null)

		useEffect(() => {
			if (ref.current) {
				select(ref.current).call(axisBottom(scale)
					.tickSize(-graphHeight, 0, 0)
					.tickFormat("")
				)
			}
		}, [scale])

		return <g ref={ref} transform={transform} style={linesColor} />
	}

	const HorizontalLines = ({ scale }) => {
		const ref = useRef(null)

		useEffect(() => {
			if (ref.current) {
				select(ref.current).call(axisLeft(scale)
					.tickSize(-graphWidth, 0, 0)
					.tickFormat("")
				)
			}
		}, [scale])

		return <g ref={ref} style={linesColor} />
	}

	const Bars = ({ data, height, xAxis, yAxis }) => {
		return (<>
			{data.map(({ value, label }) => (
				<rect
					key={`bar-${label}`}
					x={xAxis(label)}
					y={yAxis(value)}
					width={xAxis.bandwidth()}
					height={height - yAxis(value)}
					fill={`#0093e7`}
				/>
			))}
		</>)
	}

	return (
		<svg width={width} height={height}>
			<g transform={`translate(${margin.left + 20}, ${margin.top - 15})`}>
				<HorizontalLines scale={yAxis} />
				<VerticalLines scale={xAxis} transform={`translate(0, ${graphHeight})`} />

				<ColAxis scale={yAxis} />
				<RowAxis scale={xAxis} transform={`translate(0, ${graphHeight})`} />

				<Bars data={data} height={graphHeight} xAxis={xAxis} yAxis={yAxis} />

				<text
					x={graphWidth * 0.5}
					y={-10}
					textAnchor={'middle'}
				>
					{graphTitle}
				</text>
				<text
					x={graphHeight * -0.60}
					y={-30}
					style={{ transform: `rotate(-90deg)` }}
				>
					{colLabel}
				</text>
				<text transform={`translate(${graphWidth * 0.4}, ${graphHeight + margin.bottom * 1.5})`}>
					{rowLabel}
				</text>
			</g>
		</svg>
	)
}

export default BarGraph