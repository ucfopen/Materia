import * as d3 from 'd3'
import React, { useState, useEffect, useRef } from 'react'

import { Bar } from '@vx/shape';
import { Group } from '@vx/group'
import { scaleBand, scaleLinear } from '@vx/scale'
import { AxisLeft, AxisBottom } from '@vx/axis'
import { Grid } from '@vx/grid'

// accessors return the label and value of that data item
const x = d => d.label
// * 1.2 makes it so the max graph height will never be reached
const y = d => 1.2 * d.value

const BarGraph1 = ({ data, width, height }) => {
	console.log(data)
	// bounds
	const xMax = width - 80
	const yMax = height - 80

	const getScaleVal = () => data !== undefined ? Math.max(...data?.map(y)) : 0

	// scales
	const xScale = scaleBand({
		rangeRound: [0, xMax],
		domain: data?.map(x),
		padding: 0.4,
	})

	const yScale = scaleLinear({
		rangeRound: [0, yMax],
		domain: [getScaleVal(), 0],
	})

	const barsRender = data?.map((d, i) => {
		const label = d.label
		const barWidth = xScale.bandwidth()
		const barHeight = yMax - yScale(d.value)
		const barX = xScale(label)
		const barY = yMax - barHeight
		return (
			<Bar key={`bar-${label}`}
				x={barX}
				y={barY}
				width={barWidth}
				height={barHeight}>
				<title>{d.value + ' scores'}</title>
			</Bar>
		)
	})

	return (
		<svg width={width} height={height}>
			<Group top={25} left={40}>
				<Grid left={13}
					bottom={15}
					xScale={xScale}
					yScale={yScale}
					width={xMax - 10}
					height={yMax}
					numTicksRows={4}
					numTicksColumns={11}
				/>
				<AxisLeft
					left={13}
					scale={yScale}
					numTicks={4}
					label='Plays'
				/>
				{barsRender}
				<AxisBottom
					scale={xScale}
					label='Score'
					labelOffset={15}
					top={yMax}
				/>
			</Group>
		</svg>
	)
}

const BarGraph = ({ data, width, height, rowLabel = `Score`, colLabel = `Plays` }) => {
	console.log(data)

	const margin = { top: 25, bottom: 25, left: 25, right: 25 }
	const graphWidth = width - margin.left - margin.right
	const graphHeight = height - margin.top - margin.bottom

	// grade points / bars
	const xAxis = d3.scaleBand().domain(data.map(({ label }) => label)).range([0, graphWidth]).padding(0.5)

	// num of students
	const yAxis = d3.scaleLinear().range([graphHeight, 0])
	const largestNumStudents = Math.max(...data.map(({ value }) => value))
	largestNumStudents === 1 ? yAxis.domain([0, 1.2]) : yAxis.domain([0, largestNumStudents])

	const RowAxis = ({ scale, transform }) => {
		const ref = useRef(null)

		useEffect(() => {
			if (ref.current) { d3.select(ref.current).call(d3.axisBottom(scale)) }
		}, [scale])

		return <g ref={ref} transform={transform} />
	}

	const RowLabel = ({ label, transform }) => {
		return <text transform={transform}> {label}</text>
	}

	const ColAxis = ({ scale }) => {
		const ref = useRef(null)

		useEffect(() => {
			if (ref.current) { d3.select(ref.current).call(d3.axisLeft(scale)) }
		}, [scale])

		return <g ref={ref} />
	}

	const ColLabel = ({ label }) => {

		return (<g style={{ textAlign: `center` }}>
			{
				[...label].map((letter, index) => {
					return (
						<text
							key={index}
							x={(graphHeight * 0.30) + index * 15}
							y={37}
							style={{ transform: `rotate(90deg)`, textAlign: `center` }}
							rotate={-90}
						>
							{letter}
						</text>
					)
				})
			}
		</g>)
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
					fill={`teal`}
				/>
			))}
		</>)
	}

	return (
		<svg width={width} height={height}>
			<g transform={`translate(${margin.left + 20}, ${margin.top - 15})`}>
				<RowAxis scale={xAxis} transform={`translate(0, ${graphHeight})`} />
				<text transform={`translate(${graphWidth * 0.4}, ${graphHeight + margin.bottom * 1.5})`}>{rowLabel}</text>

				<ColAxis scale={yAxis} />
				{/* <ColLabel label={colLabel} /> */}
				<text
					x={graphHeight * -0.60}
					y={-30}
					textLength={50}
					style={{ transform: `rotate(-90deg)` }}
				// rotate={-90}
				>
					{colLabel}
				</text>
				{/* <ColLabel label={colLabel} transform={`translate(${-50}, ${graphHeight * 0.5})`} rotation={90} /> */}
				<Bars data={data} height={graphHeight} xAxis={xAxis} yAxis={yAxis} />
			</g>
		</svg>
	)
}

// const testing = 1
// const BarGraph = testing == 0 ? BarGraph1 : newBarGraph

export default BarGraph