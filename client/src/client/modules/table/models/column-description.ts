import {ThemePalette} from '@angular/material/core';

export interface RowAction {
  icon: string;
  tooltip: string;
  text?: string;
  color?: ThemePalette;
  callback: (row: any, index: number) => void;
}

export interface ColumnDescription {
  title: string;
  dataType: string;
  key?: string;
  actions?: string[] | RowAction[];
  hideOnMobile?: boolean;
  customSort?: Function;
  cssClass?: string;
  options?: {
    idName?: string;
    noIcon?: boolean;
    tooltipType?: string;
    onModelChange?: Function;
  };
}
