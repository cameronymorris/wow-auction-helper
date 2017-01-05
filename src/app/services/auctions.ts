import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import { IAuction } from '../utils/interfaces';
import { user } from '../utils/globals';

import 'rxjs/add/operator/map';

@Injectable()
export class AuctionService{
  private user;
  constructor(private http: Http){
    this.user = user;
  }

  getAuctions(){
      let localUrl: string = '/assets/auctions.json';
      let apiUrl: string = 'http://www.wah.jonaskf.net/GetAuctions.php?region=' + this.user.region + '&realm=' + this.user.realm;
    return this.http.get(apiUrl)
      .map(response => <IAuction>function(r){ console.log('Loaded auctions'); return r;  }(response.json()));
  }
}
