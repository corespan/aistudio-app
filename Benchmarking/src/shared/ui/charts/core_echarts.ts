import * as echarts from 'echarts/core'

import { LineChart } from 'echarts/charts'
import { BarChart } from 'echarts/charts'
import { PieChart } from 'echarts/charts'
import { PolarComponent } from 'echarts/components'
import { GraphicComponent } from 'echarts/components'

import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  LegendComponent,
} from 'echarts/components'

import { CanvasRenderer, SVGRenderer } from 'echarts/renderers'

echarts.use([
  LineChart,
  PieChart,
  BarChart,
  PolarComponent,
  GraphicComponent,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  LegendComponent,
  CanvasRenderer,
  SVGRenderer,
])

export default echarts
