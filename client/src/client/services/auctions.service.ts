import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {SharedService} from './shared.service';
import {AuctionUtil} from '../modules/auction/utils/auction.util';
import {DatabaseService} from './database.service';
import {ItemService} from './item.service';
import {Notifications} from '../models/user/notification';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ErrorReport} from '../utils/error-report.util';
import {SubscriptionManager} from '@ukon1990/subscription-manager';
import {BehaviorSubject} from 'rxjs';
import {Auction} from '../modules/auction/models/auction.model';
import {AuctionItem} from '../modules/auction/models/auction-item.model';
import {RealmService} from './realm.service';
import {AuctionHouseStatus} from '../modules/auction/models/auction-house-status.model';
import {TsmService} from '../modules/tsm/tsm.service';
import {Report} from '../utils/report.util';

@Injectable()
export class AuctionsService {
  list: BehaviorSubject<AuctionItem[]> = new BehaviorSubject<AuctionItem[]>([]);
  mapped: BehaviorSubject<Map<string, AuctionItem>> = new BehaviorSubject<Map<string, AuctionItem>>(new Map<string, AuctionItem>());
  auctions: BehaviorSubject<Auction[]> = new BehaviorSubject<Auction[]>([]);
  events = {
    isDownloading: new BehaviorSubject<boolean>(true),
  };
  subs = new SubscriptionManager();
  doNotOrganize = false;


  constructor(
    private http: HttpClient,
    public snackBar: MatSnackBar,
    private _dbService: DatabaseService,
    private _itemService: ItemService,
    private tsmService: TsmService,
    private realmService: RealmService) {
    this.subs.add(
      this.realmService.events.realmStatus,
      (status: AuctionHouseStatus) =>
        this.getLatestData(status));

    this.subs.add(
      this.realmService.events.realmChanged,
      (status) => {
        this.tsmService.get(status)
          .then(async () => await this.organize())
          .catch(console.error);
      }
    );
  }

  getById(id: string | number): AuctionItem {
    return this.mapped.value.get('' + id);
  }

  getAuctions(): Promise<any> {
    if (SharedService.downloading.auctions) {
      return;
    }
    this.events.isDownloading.next(true);
    const realmStatus: AuctionHouseStatus = this.realmService.events.realmStatus.getValue();
    console.log('Downloading auctions');
    SharedService.downloading.auctions = true;
    this.openSnackbar(`Downloading auctions for ${SharedService.user.realm}`);
    return this.http
      .get(realmStatus.url)
      .toPromise()
      .then(async a => {
        SharedService.downloading.auctions = false;
        localStorage['timestamp_auctions'] = realmStatus.lastModified;
        if (!this.doNotOrganize && !realmStatus.isInitialLoad) {
          await this.organize(a['auctions'])
            .catch(error => ErrorReport.sendError('getAuctions', error));
        }

        console.log('Auction download is completed');
        this.openSnackbar(`Auction download is completed`);

        this.handleNotifications();
        SharedService.events.auctionUpdate.emit();
        this.auctions.next(a['auctions']);
        this.events.isDownloading.next(true);
      })
      .catch((error: HttpErrorResponse) => {
        SharedService.downloading.auctions = false;
        this.events.isDownloading.next(true);
        console.error('Auction download failed', error);
        switch (error.status) {
          case 504:
            this.openSnackbar(`Auction download failed. The server took too long time to respond`);
            break;
          default:
            this.openSnackbar(`Auction download failed (${error.status} - ${error.statusText})`);
        }

        ErrorReport.sendHttpError(error);
      });
  }

  private openSnackbar(message: string): void {
    this.snackBar.open(message, 'Ok', {duration: 3000});
  }

  private getLatestData(status: AuctionHouseStatus) {
    if (!status) {
      return;
    }

    const previousLastModified = +localStorage['timestamp_auctions'];
    if (this.shouldDownload(status, previousLastModified)) {
      this.getAuctions();
    }
  }

  private shouldDownload(status: AuctionHouseStatus, previousLastModified) {
    return this.isNewUpdateAvailable(status, previousLastModified) || this.isAuctionArrayEmpty(status);
  }

  private isNewUpdateAvailable(status: AuctionHouseStatus, previousLastModified) {
    return status && status.lastModified !== previousLastModified && !SharedService.downloading.auctions;
  }

  private isAuctionArrayEmpty(status: AuctionHouseStatus) {
    const list = this.auctions.value;
    return status && status.lastModified && list && list.length === 0 && !SharedService.downloading.auctions;
  }

  private handleNotifications() {
    this.sendNewAuctionDataAvailable();
  }

  private sendNewAuctionDataAvailable() {
    if (SharedService.user.notifications.isUpdateAvailable) {
      Notifications.send(
        'WAH - New auction data',
        `There are new auctions available for ${SharedService.user.realm}.`);
    }
  }

  async organize(auctions: Auction[] = this.auctions.value) {
    await AuctionUtil.organize(auctions)
      .then(({
               map,
               list,
               auctions: auc
             }) => {
        this.auctions.next(auctions);
        this.list.next(list);
        this.mapped.next(map);
      })
      .catch(error => ErrorReport.sendError('getAuctions', error));
  }
}
