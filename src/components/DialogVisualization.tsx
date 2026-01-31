'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { DialogSection } from './DialogEditor'

type Props = {
  sections: DialogSection[]
  startSection?: string | null
}

type LineNode = {
  id: number
  type: string
  speaker?: string | null
  textKey?: string | null
  order: number
  data?: string | null
}

type Node = {
  id: string
  label: string
  isStart: boolean
  lines: LineNode[]
}

type Link = {
  source: string
  target: string
  label?: string
  sourceLineId?: number
}

type D3Node = Node & d3.SimulationNodeDatum

type D3Link = Link & d3.SimulationLinkDatum<D3Node>

type ParsedSwitchData = {
  nextSection?: string
  condition?: {
    type: string
  }
  cases?: Array<{
    nextSection?: string
    value?: unknown
  }>
  default?: string
}

type ParsedOption = {
  nextSection?: string
  text?: string
}

type ParsedData = {
  nextSection?: string
  options?: unknown
  [key: string]: unknown
}

export default function DialogVisualization({ sections, startSection }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!isVisible || !svgRef.current || sections.length === 0) return

    // Parse dialog structure into nodes and links
    const nodes: D3Node[] = []
    const links: D3Link[] = []
    const nodeMap = new Map<string, D3Node>()

    // Create nodes for each section
    sections.forEach((section) => {
      const node: D3Node = {
        id: section.sectionId,
        label: section.sectionId,
        isStart: section.sectionId === startSection,
        lines: section.lines.map((line) => ({
          id: line.id,
          type: line.type,
          speaker: line.speaker,
          textKey: line.textKey,
          order: line.order,
          data: line.data,
        })),
      }
      nodes.push(node)
      nodeMap.set(section.sectionId, node)
    })

    // Create links based on line types
    sections.forEach((section) => {
      section.lines.forEach((line) => {
        if (line.type === 'nextSection' && line.data) {
          // nextSection line data is JSON: {"nextSection": "sectionName"}
          try {
            const parsed = JSON.parse(line.data) as ParsedData
            const targetSection = parsed.nextSection
            if (targetSection && nodeMap.has(targetSection)) {
              links.push({
                source: section.sectionId,
                target: targetSection,
                sourceLineId: line.id,
              })
            }
          } catch {
            // Try as plain string fallback
            const targetSection = line.data.trim()
            if (nodeMap.has(targetSection)) {
              links.push({
                source: section.sectionId,
                target: targetSection,
                sourceLineId: line.id,
              })
            }
          }
        } else if (line.type === 'options' && line.data) {
          // Options line contains JSON with multiple choices
          try {
            const options = JSON.parse(line.data)
            if (Array.isArray(options)) {
              options.forEach((option: ParsedOption, index: number) => {
                if (option.nextSection && nodeMap.has(option.nextSection)) {
                  links.push({
                    source: section.sectionId,
                    target: option.nextSection,
                    label: `option ${index + 1}`,
                    sourceLineId: line.id,
                  })
                }
              })
            }
          } catch {
            // Invalid JSON, skip
          }
        } else if (line.type === 'switch' && line.data) {
          // Switch line contains JSON with condition and nextSection
          try {
            const switchData = JSON.parse(line.data) as ParsedSwitchData
            
            // Check for direct nextSection property
            if (switchData.nextSection && nodeMap.has(switchData.nextSection)) {
              links.push({
                source: section.sectionId,
                target: switchData.nextSection,
                label: switchData.condition ? `if ${switchData.condition.type}` : 'switch',
                sourceLineId: line.id,
              })
            }
            
            // Also check for cases array format (alternative structure)
            if (switchData.cases && Array.isArray(switchData.cases)) {
              switchData.cases.forEach((caseItem) => {
                if (caseItem.nextSection && nodeMap.has(caseItem.nextSection)) {
                  links.push({
                    source: section.sectionId,
                    target: caseItem.nextSection,
                    label: `case: ${caseItem.value ?? '?'}`,
                    sourceLineId: line.id,
                  })
                }
              })
            }
            if (switchData.default && nodeMap.has(switchData.default)) {
              links.push({
                source: section.sectionId,
                target: switchData.default,
                label: 'default',
                sourceLineId: line.id,
              })
            }
          } catch {
            // Invalid JSON, skip
          }
        }
      })
    })

    // Clear previous visualization
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = svgRef.current.clientWidth
    const height = 600

    // Create SVG groups
    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom)

    // Create arrow markers for links
    const defs = svg.append('defs')
    
    defs
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 10)
      .attr('refY', 0)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#3b82f6')
    
    defs
      .append('marker')
      .attr('id', 'arrowhead-gray')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 10)
      .attr('refY', 0)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999')

    // Helper function to get line label
    const getLineLabel = (line: LineNode, lineData?: string | null): string => {
      if (line.type === 'dialog') {
        const speaker = line.speaker ? `${line.speaker}: ` : ''
        return `${speaker}${line.textKey ? `[${line.textKey}]` : ''}`
      }
      
      // Show target sections for jump types
      if (line.type === 'nextSection' && lineData) {
        try {
          const parsed = JSON.parse(lineData) as ParsedData
          return `→ ${parsed.nextSection ?? lineData.trim()}`
        } catch {
          return `→ ${lineData.trim()}`
        }
      }
      
      if (line.type === 'switch' && lineData) {
        try {
          const switchData = JSON.parse(lineData) as ParsedSwitchData
          if (switchData.nextSection) {
            return `switch → ${switchData.nextSection}`
          }
          const targets: string[] = []
          if (switchData.cases && Array.isArray(switchData.cases)) {
            switchData.cases.forEach((c) => {
              if (c.nextSection) targets.push(c.nextSection)
            })
          }
          if (switchData.default) targets.push(`default: ${switchData.default}`)
          if (targets.length > 0) {
            return `switch → ${targets.join(', ')}`
          }
        } catch {
          // Invalid JSON
        }
      }
      
      if (line.type === 'options' && lineData) {
        try {
          const options = JSON.parse(lineData)
          if (Array.isArray(options)) {
            const targets = options
              .map((o: ParsedOption) => o.nextSection)
              .filter((t): t is string => Boolean(t))
            if (targets.length > 0) {
              return `options → ${targets.join(', ')}`
            }
          }
        } catch {
          // Invalid JSON
        }
      }
      
      return line.type
    }

    // Helper function to calculate node height
    const getNodeHeight = (node: Node): number => {
      const headerHeight = 30
      const lineHeight = 20
      return headerHeight + node.lines.length * lineHeight + 10
    }

    // Helper function to get line Y position within node
    const getLineY = (lineOrder: number): number => {
      const headerHeight = 30
      const lineHeight = 20
      return headerHeight + lineOrder * lineHeight + lineHeight / 2
    }

    // Create force simulation
    const simulation = d3
      .forceSimulation<D3Node>(nodes)
      .force(
        'link',
        d3
          .forceLink<D3Node, D3Link>(links)
          .id((d) => d.id)
          .distance(350)
      )
      .force('charge', d3.forceManyBody().strength(-2000))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(150))

    // Create links - must be BEFORE nodes so they render behind
    const linkGroup = g.append('g').attr('class', 'links')
    
    const link = linkGroup
      .selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('stroke', (d) => (d.sourceLineId ? '#3b82f6' : '#999'))
      .attr('stroke-width', (d) => (d.sourceLineId ? 2.5 : 2))
      .attr('fill', 'none')
      .attr('marker-end', (d) => (d.sourceLineId ? 'url(#arrowhead)' : 'url(#arrowhead-gray)'))
      .attr('opacity', 0.8)
    
    console.log('Created links:', links.length)

    // Add link labels
    const linkLabelGroup = g.append('g').attr('class', 'link-labels')
    
    const linkLabels = linkLabelGroup
      .selectAll('text')
      .data(links)
      .enter()
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', 10)
      .attr('fill', '#374151')
      .attr('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text((d) => d.label || '')

    // Create nodes
    const nodeGroup = g.append('g').attr('class', 'nodes')
    
    const node = nodeGroup
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .call(
        d3
          .drag<SVGGElement, D3Node>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )

    // Add rectangles for nodes (instead of circles)
    node
      .append('rect')
      .attr('width', 250)
      .attr('height', (d: Node) => getNodeHeight(d))
      .attr('x', -125)
      .attr('y', (d: Node) => -getNodeHeight(d) / 2)
      .attr('rx', 8)
      .attr('fill', 'white')
      .attr('stroke', (d: Node) => (d.isStart ? '#10b981' : '#6366f1'))
      .attr('stroke-width', 3)

    // Add header background
    node
      .append('rect')
      .attr('width', 250)
      .attr('height', 30)
      .attr('x', -125)
      .attr('y', (d: Node) => -getNodeHeight(d) / 2)
      .attr('rx', 8)
      .attr('fill', (d: Node) => (d.isStart ? '#10b981' : '#6366f1'))

    // Add section title
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', (d: Node) => -getNodeHeight(d) / 2 + 20)
      .attr('font-size', 14)
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .text((d: Node) => d.label)

    // Add entry point indicator
    node
      .filter((d: Node) => d.isStart)
      .append('text')
      .attr('text-anchor', 'end')
      .attr('x', 115)
      .attr('y', (d: Node) => -getNodeHeight(d) / 2 + 20)
      .attr('font-size', 12)
      .attr('fill', 'white')
      .text('📍 ENTRY')

    // Add lines
    node.each(function (d: Node) {
      const nodeGroup = d3.select(this)
      const nodeHeight = getNodeHeight(d)

      d.lines.forEach((line, index) => {
        const yPos = -nodeHeight / 2 + 30 + index * 20 + 15

        // Line background (highlight lines with jumps)
        const hasJump = ['nextSection', 'options', 'switch'].includes(line.type)
        if (hasJump) {
          nodeGroup
            .append('rect')
            .attr('x', -120)
            .attr('y', yPos - 12)
            .attr('width', 240)
            .attr('height', 18)
            .attr('fill', '#dbeafe')
            .attr('rx', 3)
        }

        // Line text
        const lineText = getLineLabel(line, line.data)
        nodeGroup
          .append('text')
          .attr('x', -115)
          .attr('y', yPos)
          .attr('font-size', 11)
          .attr('fill', '#374151')
          .text(lineText.length > 35 ? lineText.substring(0, 32) + '...' : lineText)

        // Add arrow indicator for jump lines
        if (hasJump) {
          nodeGroup
            .append('text')
            .attr('x', 110)
            .attr('y', yPos)
            .attr('font-size', 11)
            .attr('fill', '#3b82f6')
            .attr('font-weight', 'bold')
            .text('→')
        }
      })
    })

    // Update positions on each tick
    simulation.on('tick', () => {
      link.attr('d', (d) => {
        const source = d.source as D3Node
        const target = d.target as D3Node
        const sourceNode = nodes.find((n) => n.id === source.id)
        const targetNode = nodes.find((n) => n.id === target.id)
        const sourceLineId = d.sourceLineId
        
        if (!sourceNode || !targetNode || source.x === undefined || source.y === undefined || target.x === undefined || target.y === undefined) return ''
        
        // Calculate source position (right edge of the line)
        const sourceX = source.x + 125
        let sourceY = source.y
        
        if (sourceLineId) {
          const sourceLine = sourceNode.lines.find((l) => l.id === sourceLineId)
          if (sourceLine) {
            sourceY = source.y + getLineY(sourceLine.order) - getNodeHeight(sourceNode) / 2
          }
        }

        // Calculate target position (left edge of target node)
        const targetX = target.x - 125
        const targetY = target.y - getNodeHeight(targetNode) / 2 + 15 // Aim for the header

        // Draw curved path
        const dx = targetX - sourceX
        const dy = targetY - sourceY
        const dr = Math.sqrt(dx * dx + dy * dy) * 0.8

        // Use quadratic bezier curve for better control
        const midX = sourceX + dx / 2
        const midY = sourceY + dy / 2
        
        return `M${sourceX},${sourceY} Q${midX + dr / 4},${midY} ${targetX},${targetY}`
      })

      linkLabels
        .attr('x', (d) => {
          const source = d.source as D3Node
          const target = d.target as D3Node
          const sourceNode = nodes.find((n) => n.id === source.id)
          const sourceLineId = d.sourceLineId
          
          if (source.x === undefined || target.x === undefined) return 0
          
          let sourceX = source.x + 125
          if (sourceNode && sourceLineId) {
            sourceX = source.x + 125
          }
          
          const targetNode = nodes.find((n) => n.id === target.id)
          const targetX = targetNode ? target.x - 125 : target.x
          
          return (sourceX + targetX) / 2
        })
        .attr('y', (d) => {
          const source = d.source as D3Node
          const target = d.target as D3Node
          const sourceNode = nodes.find((n) => n.id === source.id)
          const targetNode = nodes.find((n) => n.id === target.id)
          const sourceLineId = d.sourceLineId
          
          if (source.y === undefined || target.y === undefined) return 0
          
          let sourceY = source.y
          if (sourceNode && sourceLineId) {
            const sourceLine = sourceNode.lines.find((l) => l.id === sourceLineId)
            if (sourceLine) {
              sourceY = source.y + getLineY(sourceLine.order) - getNodeHeight(sourceNode) / 2
            }
          }
          
          const targetY = targetNode ? target.y - getNodeHeight(targetNode) / 2 + 15 : target.y
          
          return (sourceY + targetY) / 2 - 5
        })

      node.attr('transform', (d) => {
        if (d.x === undefined || d.y === undefined) return ''
        return `translate(${d.x},${d.y})`
      })
    })

    // Cleanup
    return () => {
      simulation.stop()
    }
  }, [sections, startSection, isVisible])

  if (sections.length === 0) {
    return null
  }

  return (
    <section className="bg-white p-6 rounded shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Dialog Flow Visualization</h2>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          {isVisible ? 'Hide' : 'Show'} Visualization
        </button>
      </div>

      {isVisible && (
        <div className="border rounded bg-gray-50">
          <div className="p-3 bg-gray-100 border-b text-sm text-gray-600">
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span>Start Section</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-indigo-500"></div>
                <span>Regular Section</span>
              </div>
              <span className="text-gray-500">• Drag nodes to reposition • Scroll to zoom</span>
            </div>
          </div>
          <svg ref={svgRef} className="w-full" style={{ height: '600px' }}></svg>
        </div>
      )}
    </section>
  )
}
