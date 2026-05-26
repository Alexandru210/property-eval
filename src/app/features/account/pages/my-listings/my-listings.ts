import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-my-listings',
  imports: [RouterLink],
  templateUrl: './my-listings.html',
  styleUrl: './my-listings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyListings {
  protected readonly stats = [
    { label: 'Active listings', value: '0' },
    { label: 'Drafts', value: '0' },
    { label: 'Buyer messages', value: '0' },
  ];
}
