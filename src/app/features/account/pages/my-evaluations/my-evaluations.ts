import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-my-evaluations',
  imports: [RouterLink],
  templateUrl: './my-evaluations.html',
  styleUrl: './my-evaluations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyEvaluations {
  protected readonly stats = [
    { label: 'Completed reports', value: '0' },
    { label: 'Pending reviews', value: '0' },
    { label: 'Saved estimates', value: '0' },
  ];
}
