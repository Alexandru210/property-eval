import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly workspaces = [
    {
      metric: '01',
      title: 'Compare listings',
      description: 'Browse active properties with price, location, area, and room details ready for quick comparison.',
      route: '/buy',
      action: 'Browse listings',
    },
    {
      metric: '02',
      title: 'Publish clearly',
      description: 'Create a structured listing with property facts, photos, price, and status in one guided flow.',
      route: '/sell',
      action: 'List property',
    },
    {
      metric: '03',
      title: 'Track valuation',
      description: 'Submit property details for review and keep valuation requests visible through their full lifecycle.',
      route: '/evaluate',
      action: 'Evaluate',
    },
  ];

  protected readonly stats = [
    { label: 'Marketplace', value: 'Live listings' },
    { label: 'Evaluation', value: 'Price context' },
    { label: 'Accounts', value: 'Saved history' },
  ];
}
