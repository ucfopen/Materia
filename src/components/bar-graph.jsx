import React from 'react'
import { Bar } from '@vx/shape';
import { Group } from "@vx/group"
import { scaleBand, scaleLinear } from "@vx/scale"
import { AxisLeft, AxisBottom } from "@vx/axis"


// accessors return the label and value of that data item
const x = (d) => d.label
const y = (d) => d.value

const BarChart = ({ data, width, height }) => {
	// bounds
	const xMax = width - 80
	const yMax = height - 80

	// scales
	const xScale = scaleBand({
		rangeRound: [0, xMax],
		domain: data.map(x),
		padding: 0.4,
	})

	const yScale = scaleLinear({
		rangeRound: [0, yMax],
		domain: [Math.max(...data.map(y)), 0],
	})

	return (
		<svg width={width} height={height}>
			<Group top={25} left={55}>
				<AxisLeft left={10} scale={yScale} numTicks={4} label="Plays" />
				{data.map((d, i) => {
					const label = x(d)
					const barWidth = xScale.bandwidth()
					const barHeight = yMax - yScale(y(d))
					const barX = xScale(label)
					const barY = yMax - barHeight
					return <Bar key={`bar-${label}`} x={barX} y={barY} width={barWidth} height={barHeight} />
				})}
				<AxisBottom scale={xScale} label="Score" labelOffset={15} top={yMax} />
			</Group>
		</svg>
	)
}

export default BarChart
