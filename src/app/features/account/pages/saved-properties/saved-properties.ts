import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-saved-properties',
  imports: [RouterLink],
  templateUrl: './saved-properties.html',
  styleUrl: './saved-properties.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedProperties {
  protected readonly stats = [
    { label: 'Saved homes', value: '0' },
    { label: 'New matches', value: '0' },
    { label: 'Price changes', value: '0' },
  ];
}
