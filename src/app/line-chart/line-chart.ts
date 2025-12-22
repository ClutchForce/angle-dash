import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { WebSocketService, AveragedStockPrice } from '../services/websocket.service';
import { Subscription } from 'rxjs';

interface StockDataPoint {
  timestamp: Date;
  price: number;
  symbol: string;
  volume: number;
}

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './line-chart.html',
  styleUrl: './line-chart.css',
})
export class LineChart implements OnInit, OnDestroy {
  stockData: Map<string, StockDataPoint[]> = new Map();
  latestPrices: Map<string, AveragedStockPrice> = new Map();
  isConnected = false;
  
  private subscriptions: Subscription[] = [];
  private readonly MAX_DATA_POINTS = 50; // Keep last 50 data points per symbol

  constructor(private webSocketService: WebSocketService) {}

  // Lifecycle hook: Initialize component and set up subscriptions
  ngOnInit(): void {
    // Connect to WebSocket
    this.webSocketService.connect();

    // Subscribe to connection status
    const connectionSub = this.webSocketService.getConnectionStatus().subscribe(
      status => {
        this.isConnected = status;
        console.log('Connection status:', status);
      }
    );
    this.subscriptions.push(connectionSub);

    // Subscribe to stock price updates
    const stockSub = this.webSocketService.getStockPrices().subscribe(
      stockPrice => {
        if (stockPrice) {
          this.handleStockUpdate(stockPrice);
        }
      }
    );
    this.subscriptions.push(stockSub);
  }

  ngOnDestroy(): void {
    // Unsubscribe from all observables
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Disconnect from WebSocket
    this.webSocketService.disconnect();
  }

  private handleStockUpdate(stockPrice: AveragedStockPrice): void {
    const { symbol } = stockPrice;

    // Update latest prices
    this.latestPrices.set(symbol, stockPrice);

    // Get or create data array for this symbol
    if (!this.stockData.has(symbol)) {
      this.stockData.set(symbol, []);
    }
    const dataPoints = this.stockData.get(symbol)!;

    // Add new data point
    dataPoints.push({
      timestamp: new Date(stockPrice.windowEnd),
      price: stockPrice.averagePrice,
      symbol: symbol,
      volume: stockPrice.totalVolume
    });

    // Keep only the last MAX_DATA_POINTS
    if (dataPoints.length > this.MAX_DATA_POINTS) {
      dataPoints.shift();
    }

    console.log(`Updated ${symbol}: $${stockPrice.averagePrice} at ${stockPrice.windowEnd}`);
  }

  getSymbols(): string[] {
    return Array.from(this.latestPrices.keys()).sort();
  }

  getDataForSymbol(symbol: string): StockDataPoint[] {
    return this.stockData.get(symbol) || [];
  }

  getLatestPrice(symbol: string): AveragedStockPrice | undefined {
    return this.latestPrices.get(symbol);
  }

  clearData(): void {
    this.stockData.clear();
    this.latestPrices.clear();
  }
}