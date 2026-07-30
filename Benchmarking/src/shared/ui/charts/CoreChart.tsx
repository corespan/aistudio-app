import { useEffect, useRef, type RefObject } from 'react'
import type { EChartsOption } from 'echarts'
import echarts from './core_echarts'

type EChartsInstance = ReturnType<typeof echarts.init>

type EChartProps = {
  option: EChartsOption
  className?: string
  /**
   * 'svg' renders text via the browser's text engine — crisp at any DPI/zoom, best
   * for small indicator charts. 'canvas' (default) rasterizes everything — better
   * for large data series. Fixed at init; changing it later does not re-create the chart.
   */
  renderer?: 'canvas' | 'svg'
  /**
   * Escape hatch for callers that need to `dispatchAction` on the underlying
   * instance (e.g. a "reset zoom" button) — the instance is otherwise private
   * to this component. Populated once the chart is created, nulled on dispose.
   * Init is lazy (see `tryInit` below), so a caller cannot reliably grab the
   * instance from its own effect; this component has to hand it out.
   */
  instanceRef?: RefObject<EChartsInstance | null>
}

export const CoreChart = ({ option, className, renderer = 'canvas', instanceRef }: EChartProps) => {
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
      if (instanceRef) instanceRef.current = chart
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
      if (instanceRef) instanceRef.current = null
    }
    // instanceRef is a ref object — its identity is stable across renders, so
    // it is intentionally omitted from the dependency array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) {
      return
    }
    // `replaceMerge` (not `notMerge`) on update: `notMerge` tears down the
    // whole option model on every call, which would silently reset any
    // interactive state the user set on the instance directly — e.g. a
    // dataZoom range dragged on the chart. `series`/`xAxis`/`yAxis` are
    // listed explicitly because a merge would otherwise leave a removed
    // series lingering, or leave yAxis.type stuck if a caller switches it
    // between 'value' and 'category'.
    //
    // Caveat: every option key this component is ever given must be set on
    // every render for this to be safe — a key merge silently keeps whatever
    // value the *previous* option set for it.
    chart.setOption(option, { replaceMerge: ['series', 'xAxis', 'yAxis'] })
  }, [option])

  const style: React.CSSProperties = {
    width: '100%',
    height: '100%',
  }

  return <div ref={containerRef} className={className} style={style} />
}
