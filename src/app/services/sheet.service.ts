import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface SheetRow {
  Total: number;
  Product_Cost: number;
  HST_GST: number;
  Commission_Fee: number;
  Intra_Shipping: number;
  Inter_Shipping: number;
  Product_Name: string;
  Brand_Name: string;
  Client_Name: string;
}

@Injectable({
  providedIn: 'root'
})
export class SheetService {
  // Use the Deployment URL ending in /exec
  private readonly API_URL = 'https://script.google.com/macros/s/AKfycbwx9rNnnexXMCbGH7DkRSZrnkSdvF7qiQjq4_MAxpHURW3otymr5PHv0ZQxSvnyFOqY/exec';
  
  data = signal<SheetRow[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  async fetchData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      // GET requests are usually simple by default, but ensuring no custom headers helps
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: SheetRow[]; error?: string }>(this.API_URL)
      );
      
      if (response.success) {
        this.data.set(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch data');
      }
    } catch (err: any) {
      this.error.set(err.message || 'Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async createRow(row: SheetRow): Promise<boolean> {
    return this.sendPostRequest({ action: 'create', row }, 'create');
  }

  async updateRow(rowIndex: number, row: SheetRow): Promise<boolean> {
    return this.sendPostRequest({ action: 'update', rowIndex, row }, 'update');
  }

  async deleteRow(rowIndex: number): Promise<boolean> {
    return this.sendPostRequest({ action: 'delete', rowIndex }, 'delete');
  }

  // Helper to handle the specific CORS requirements for Google Apps Script
  private async sendPostRequest(payload: any, actionName: string): Promise<boolean> {
    this.loading.set(true);
    this.error.set(null);

    try {
      // 1. We MUST set Content-Type to text/plain to avoid the OPTIONS preflight request
      const headers = new HttpHeaders({ 'Content-Type': 'text/plain; charset=utf-8' });

      // 2. We manually stringify the payload because we are sending "text"
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; error?: string }>(
          this.API_URL,
          JSON.stringify(payload), 
          { headers }
        )
      );
      
      if (response.success) {
        await this.fetchData(); // Refresh data to show changes
        return true;
      } else {
        throw new Error(response.error || `Failed to ${actionName} row`);
      }
    } catch (err: any) {
      this.error.set(err.message || `Failed to ${actionName} row`);
      console.error(`Error ${actionName} row:`, err);
      return false;
    } finally {
      this.loading.set(false);
    }
  }
}