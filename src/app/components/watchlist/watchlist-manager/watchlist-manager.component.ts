import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { Watchlist } from '../../../models/watchlist/watchlist';
import { SharedService } from '../../../services/shared.service';
import { ColumnDescription } from '../../../models/column-description';
import { Item } from '../../../models/item/item';
import { Angulartics2 } from 'angulartics2/angulartics2';

@Component({
  selector: 'wah-watchlist-manager',
  templateUrl: './watchlist-manager.component.html',
  styleUrls: ['./watchlist-manager.component.scss']
})
export class WatchlistManagerComponent implements OnInit {

  groupNameForm: FormControl = new FormControl();
  columns: Array<ColumnDescription> = new Array<ColumnDescription>();
  saveInterval: any;

  constructor(private _formBuilder: FormBuilder, private angulartics2: Angulartics2) {
    this.columns.push({ key: 'name', title: 'Name', dataType: 'name' });
  }

  ngOnInit() {
  }

  addGroup(): void {
    if (this.groupNameForm.value) {
      SharedService.user.watchlist.addGroup(this.groupNameForm.value);
      this.groupNameForm.setValue('');
      this.angulartics2.eventTrack.next({
        action: 'Added new group',
        properties: { category: 'Watchlist' },
      });
    }
  }

  /* istanbul ignore next */
  getWatchlist(): Watchlist {
    return SharedService.user.watchlist;
  }
}
