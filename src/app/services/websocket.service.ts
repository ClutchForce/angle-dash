import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AveragedStockPrice {
  symbol: string;
  averagePrice: number;
  totalVolume: number;
  count: number;
  windowStart: string;
  windowEnd: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private client: Client;
  private stockPricesSubject = new BehaviorSubject<AveragedStockPrice | null>(null);
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);

  constructor() {
    console.log('Connecting to WebSocket:', environment.websocketUrl);
    
    this.client = new Client({
      brokerURL: environment.websocketUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        console.log('STOMP Debug:', str);
      },
      
      onConnect: () => {
        console.log('Connected to WebSocket');
        this.connectionStatusSubject.next(true);
        
        // Subscribe to the stock prices topic
        this.client.subscribe('/topic/stock-prices', (message: IMessage) => {
          const stockPrice: AveragedStockPrice = JSON.parse(message.body);
          console.log('Received stock price:', stockPrice);
          this.stockPricesSubject.next(stockPrice);
        });
      },
      
      onDisconnect: () => {
        console.log('Disconnected from WebSocket');
        this.connectionStatusSubject.next(false);
      },
      
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        this.connectionStatusSubject.next(false);
      }
    });
  }

  connect(): void {
    this.client.activate();
  }

  disconnect(): void {
    this.client.deactivate();
  }

  getStockPrices(): Observable<AveragedStockPrice | null> {
    return this.stockPricesSubject.asObservable();
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }
}