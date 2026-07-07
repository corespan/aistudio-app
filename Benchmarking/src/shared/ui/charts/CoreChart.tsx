import { useEffect, useRef } from 'react'
import type { EChartsOption } from 'echarts'
import echarts from './core_echarts'

type EChartProps = {
  option: EChartsOption
  className?: string
  /**
   * 'svg' renders text via the browser's text engine — crisp at any DPI/zoom, best
   * for small indicator charts. 'canvas' (default) rasterizes everything — better
   * for large data series. Fixed at init; changing it later does not re-create the chart.
   */
  renderer?: 'canvas' | 'svg'
}

type EChartsInstance = ReturnType<typeof echarts.init>

export const CoreChart = ({ option, className, renderer = 'canvas' }: EChartProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<EChartsInstance | null>(null)
  const roRef = useRef<ResizeObserver | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let disposed = false

    const tryInit = () => {
      if (disposed) return
      if (chartRef.current) return
      const w = el.clientWidth
      const h = el.clientHeight
      if (w === 0 || h === 0) return
      const chart = echarts.init(el, undefined, { renderer })
      chartRef.current = chart
      chart.setOption(option, { notMerge: true })
    }

    tryInit()

    const ro = new ResizeObserver(() => {
      if (!chartRef.current) {
        tryInit()
      } else {
        chartRef.current.resize()
      }
    })
    ro.observe(el)
    roRef.current = ro

    // Cleanup
    return () => {
      disposed = true
      ro.disconnect()
      roRef.current = null
      if (chartRef.current) {
        chartRef.current.dispose()
        chartRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) {
      return
    }
    chart.setOption(option, { notMerge: true })
  }, [option])

  const style: React.CSSProperties = {
    width: '100%',
    height: '100%',
  }

  return <div ref={containerRef} className={className} style={style} />
}
