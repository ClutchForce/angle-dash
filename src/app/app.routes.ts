import { Routes } from '@angular/router';
import { Home } from './home/home';
import { PieChart } from './pie-chart/pie-chart';
import { LineChart } from './line-chart/line-chart';
import { Table } from './table/table';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'pie-chart', component: PieChart },
  { path: 'line-chart', component: LineChart },
  { path: 'table', component: Table },
];
