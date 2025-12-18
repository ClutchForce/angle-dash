// src/app/line-chart/line-chart.ts (Use line-chart route for candlestick)
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  SciChartSurface,
  NumericAxis,
  FastCandlestickRenderableSeries,
  OhlcDataSeries,
  ZoomPanModifier,
  ZoomExtentsModifier,
  MouseWheelZoomModifier,
  RolloverModifier,
  EAutoRange,
  NumberRange,
  RubberBandXyZoomModifier,
  LegendModifier,
  ELegendOrientation
} from 'scichart';
import * as SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

interface OHLCStockPrice {
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  totalVolume: number;
  count: number;
  windowStart: string;
  windowEnd: string;
}

interface CandleData {
  symbol: string;
  xValues: number[];
  openValues: number[];
  highValues: number[];
  lowValues: number[];
  closeValues: number[];
  volumes: number[];
  lastUpdate: Date;
}

@Component({
  selector: 'app-line-chart',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './line-chart.html',
  styleUrl: './line-chart.css',
  standalone: true
})
export class LineChart implements OnInit, OnDestroy {
  private sciChartSurface?: SciChartSurface;
  private stompClient?: Client;
  private ohlcDataSeries?: OhlcDataSeries;
  
  private readonly WEBSOCKET_URL = 'http://localhost:8082/ws';
  
  private candleDataMap = new Map<string, CandleData>();
  selectedStock = 'AAPL';
  availableStocks: string[] = [];
  
  isConnected = false;
  connectionStatus = 'Disconnected';
  lastUpdateTime = '';
  currentOpen = 0;
  currentHigh = 0;
  currentLow = 0;
  currentClose = 0;
  currentVolume = 0;

  async ngOnInit() {
    await SciChartSurface.loadWasmFromCDN();
    await this.initCandlestickChart();
    this.connectWebSocket();
  }

  ngOnDestroy() {
    this.sciChartSurface?.delete();
    this.stompClient?.deactivate();
  }

  private async initCandlestickChart() {
    try {
      const { sciChartSurface, wasmContext } = await SciChartSurface.create('scichart-root');
      this.sciChartSurface = sciChartSurface;

      sciChartSurface.xAxes.add(
        new NumericAxis(wasmContext, {
          axisTitle: 'Time Period',
          labelPrecision: 0
        })
      );

      sciChartSurface.yAxes.add(
        new NumericAxis(wasmContext, {
          axisTitle: 'Price ($)',
          autoRange: EAutoRange.Always,
          growBy: new NumberRange(0.1, 0.1),
          labelPrecision: 2
        })
      );

      this.ohlcDataSeries = new OhlcDataSeries(wasmContext, {
        dataSeriesName: this.selectedStock
      });

      const candlestickSeries = new FastCandlestickRenderableSeries(wasmContext, {
        dataSeries: this.ohlcDataSeries,
        strokeThickness: 1,
        dataPointWidth: 0.7,
        brushUp: '#50C878',
        brushDown: '#DC143C',
        strokeUp: '#50C878',
        strokeDown: '#DC143C'
      });

      sciChartSurface.renderableSeries.add(candlestickSeries);

      sciChartSurface.chartModifiers.add(
        new ZoomPanModifier(),
        new ZoomExtentsModifier(),
        new MouseWheelZoomModifier(),
        new RubberBandXyZoomModifier(),
        new RolloverModifier({
          showTooltip: true,
          showRolloverLine: true
        }),
        new LegendModifier({
          orientation: ELegendOrientation.Horizontal,
          showCheckboxes: false,
          showSeriesMarkers: true
        })
      );

    } catch (error) {
      console.error('Error initializing candlestick chart:', error);
    }
  }

  private connectWebSocket() {
    this.connectionStatus = 'Connecting...';
    
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(this.WEBSOCKET_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => console.log('STOMP: ' + str),
      onConnect: () => {
        this.isConnected = true;
        this.connectionStatus = 'Connected';
        console.log('WebSocket connected');
        
        // Subscribe to OHLC prices topic
        this.stompClient!.subscribe('/topic/ohlc-prices', (message) => {
          this.handleOHLCUpdate(JSON.parse(message.body));
        });
      },
      onDisconnect: () => {
        this.isConnected = false;
        this.connectionStatus = 'Disconnected';
      },
      onStompError: (frame) => {
        this.connectionStatus = 'Error';
        console.error('STOMP error:', frame);
      }
    });

    this.stompClient.activate();
  }

  private handleOHLCUpdate(data: OHLCStockPrice) {
    console.log('Received OHLC update:', data);
    
    let candleData = this.candleDataMap.get(data.symbol);
    if (!candleData) {
      candleData = {
        symbol: data.symbol,
        xValues: [],
        openValues: [],
        highValues: [],
        lowValues: [],
        closeValues: [],
        volumes: [],
        lastUpdate: new Date()
      };
      this.candleDataMap.set(data.symbol, candleData);
      this.availableStocks.push(data.symbol);
    }

    // Add new candle
    candleData.xValues.push(candleData.xValues.length);
    candleData.openValues.push(data.open);
    candleData.highValues.push(data.high);
    candleData.lowValues.push(data.low);
    candleData.closeValues.push(data.close);
    candleData.volumes.push(data.totalVolume);
    candleData.lastUpdate = new Date();

    // Keep only last 100 candles
    if (candleData.xValues.length > 100) {
      candleData.xValues.shift();
      candleData.openValues.shift();
      candleData.highValues.shift();
      candleData.lowValues.shift();
      candleData.closeValues.shift();
      candleData.volumes.shift();
    }

    if (data.symbol === this.selectedStock) {
      this.updateChart();
      this.currentOpen = data.open;
      this.currentHigh = data.high;
      this.currentLow = data.low;
      this.currentClose = data.close;
      this.currentVolume = data.totalVolume;
      this.lastUpdateTime = new Date().toLocaleTimeString();
    }
  }

  private updateChart() {
    const candleData = this.candleDataMap.get(this.selectedStock);
    if (!candleData || !this.ohlcDataSeries) return;

    this.ohlcDataSeries.clear();
    
    if (candleData.xValues.length > 0) {
      this.ohlcDataSeries.appendRange(
        candleData.xValues,
        candleData.openValues,
        candleData.highValues,
        candleData.lowValues,
        candleData.closeValues
      );
      this.ohlcDataSeries.dataSeriesName = this.selectedStock;
    }
  }

  changeStock(symbol: string) {
    this.selectedStock = symbol;
    this.updateChart();
    
    const candleData = this.candleDataMap.get(symbol);
    if (candleData && candleData.xValues.length > 0) {
      const lastIdx = candleData.xValues.length - 1;
      this.currentOpen = candleData.openValues[lastIdx];
      this.currentHigh = candleData.highValues[lastIdx];
      this.currentLow = candleData.lowValues[lastIdx];
      this.currentClose = candleData.closeValues[lastIdx];
      this.currentVolume = candleData.volumes[lastIdx];
      this.lastUpdateTime = candleData.lastUpdate.toLocaleTimeString();
    } else {
      this.currentOpen = this.currentHigh = this.currentLow = this.currentClose = 0;
      this.currentVolume = 0;
      this.lastUpdateTime = 'No data';
    }
  }

  reconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
    setTimeout(() => this.connectWebSocket(), 1000);
  }
}