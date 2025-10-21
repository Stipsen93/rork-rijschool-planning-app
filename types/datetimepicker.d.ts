import React from "react";
declare module "@react-native-community/datetimepicker" {
  import * as React from "react";
  import { ViewProps, ColorValue } from "react-native";

  export type Display = "default" | "spinner" | "calendar" | "clock";
  export interface DateTimePickerEvent {
    type: string;
  }
  export interface CommonProps extends ViewProps {
    value: Date;
    mode?: "date" | "time" | "datetime";
    display?: Display;
    onChange?: (event: unknown, date?: Date) => void;
    maximumDate?: Date;
    minimumDate?: Date;
    minuteInterval?: number;
    is24Hour?: boolean;
    textColor?: ColorValue;
  }

  export default class DateTimePicker extends React.Component<CommonProps> {}
}
