declare module 'react-native-svg-charts' {
  export interface ChartData {
    value: number;
    key?: string;
    svg?: {
      fill?: string;
      stroke?: string;
    };
  }

  interface LineChartProps {
    style?: any;
    data: number[];
    svg?: {
      stroke?: string;
      strokeWidth?: number;
    };
    contentInset?: {
      top?: number;
      bottom?: number;
      left?: number;
      right?: number;
    };
  }

  interface PieChartProps {
    style?: any;
    data: ChartData[];
    innerRadius?: string | number;
    padAngle?: number;
  }

  export class LineChart extends React.Component<LineChartProps> {}
  export class PieChart extends React.Component<PieChartProps> {}
} 