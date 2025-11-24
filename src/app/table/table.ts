import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SheetService, SheetRow } from '../services/sheet.service';

@Component({
  selector: 'app-table',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './table.html',
  styleUrl: './table.css',
})
export class Table implements OnInit {
  sheetService = inject(SheetService);

  // Template for a new row
  newRow: SheetRow = {
    Total: 0,
    Product_Cost: 0,
    HST_GST: 0,
    Commission_Fee: 0,
    Intra_Shipping: 0,
    Inter_Shipping: 0,
    Product_Name: '',
    Brand_Name: '',
    Client_Name: ''
  };

  ngOnInit() {
    this.sheetService.fetchData();
  }

  async onAddRow() {
    const success = await this.sheetService.createRow(this.newRow);
    if (success) {
      // Reset form
      this.newRow = {
        Total: 0,
        Product_Cost: 0,
        HST_GST: 0,
        Commission_Fee: 0,
        Intra_Shipping: 0,
        Inter_Shipping: 0,
        Product_Name: '',
        Brand_Name: '',
        Client_Name: ''
      };
    }
  }

  async onUpdateRow(index: number, row: SheetRow) {
    await this.sheetService.updateRow(index, row);
  }

  async onDeleteRow(index: number) {
    if (confirm('Are you sure you want to delete this row?')) {
      await this.sheetService.deleteRow(index);
    }
  }
}