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
      metric: 'Buyer flow',
      title: 'Find listed homes',
      description: 'Scan active listings, compare price per square meter, and open detailed property profiles.',
      route: '/buy',
      action: 'Browse listings',
    },
    {
      metric: 'Seller flow',
      title: 'Publish a listing',
      description: 'Create property details and put a listing into the marketplace with a clean seller workspace.',
      route: '/sell',
      action: 'List property',
    },
    {
      metric: 'Valuation flow',
      title: 'Request valuation',
      description: 'Record property facts and submit an evaluation request for review and follow-up.',
      route: '/evaluate',
      action: 'Evaluate',
    },
  ];

  protected readonly stats = [
    { label: 'Buyers', value: 'Compare' },
    { label: 'Sellers', value: 'Publish' },
    { label: 'Valuations', value: 'Track' },
  ];
}
