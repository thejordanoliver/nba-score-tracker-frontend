// declarations.d.ts

declare module "lottie-react-native" {
  import * as React from "react";
  import { ViewProps } from "react-native";

  export interface LottieViewProps extends ViewProps {
    source: string | object;
    autoPlay?: boolean;
    loop?: boolean;
    progress?: number;
    speed?: number;
    resizeMode?: "cover" | "contain" | "center";
    onAnimationFinish?: (isCancelled: boolean) => void;
    colorFilters?: { keypath: string; color: string }[];
    style?: any;
  }

  export default class LottieView extends React.Component<LottieViewProps> {
    play(startFrame?: number, endFrame?: number): void;
    reset(): void;
    pause(): void;
    resume(): void;
  }
}

// Asset modules
declare module "*.png" {
  const value: any;
  export default value;
}

declare module "*.jpg" {
  const value: any;
  export default value;
}

declare module "*.jpeg" {
  const value: any;
  export default value;
}

declare module "*.json" {
  const value: any;
  export default value;
}

declare module "*.svg" {
  import * as React from "react";
  import { SvgProps } from "react-native-svg";
  const content: React.FC<SvgProps>;
  export default content;
}
