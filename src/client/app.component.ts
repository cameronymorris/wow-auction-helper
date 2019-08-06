import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {User} from './models/user/user';
import {SharedService} from './services/shared.service';
import {CraftingService} from './services/crafting.service';
import {AuctionsService} from './services/auctions.service';
import {ItemService} from './services/item.service';
import {Angulartics2GoogleAnalytics} from 'angulartics2/ga';
import {Angulartics2} from 'angulartics2';
import {ProspectingAndMillingUtil} from './utils/prospect-milling.util';
import {UpdateService} from './services/update.service';
import {ErrorReport} from './utils/error-report.util';
import {MatSnackBar} from '@angular/material';
import {DefaultDashboardSettings} from './modules/dashboard/models/default-dashboard-settings.model';
import {Subscription} from 'rxjs';
import {Report} from './utils/report.util';
import {Platform} from '@angular/cdk/platform';
import {ShoppingCart} from './modules/shopping-cart/models/shopping-cart.model';
import {SubscriptionManager} from '@ukon1990/subscription-manager/dist/subscription-manager';
import {ThemeUtil} from './modules/core/utils/theme.util';

@Component({
  selector: 'wah-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  subs = new SubscriptionManager();
  mainWindowScrollPosition = 0;

  constructor(public platform: Platform,
              private _router: Router,
              private _craftingService: CraftingService,
              private _auctionsService: AuctionsService,
              private _itemService: ItemService,
              private updateService: UpdateService,
              private matSnackBar: MatSnackBar,
              private angulartics2GoogleAnalytics: Angulartics2GoogleAnalytics,
              private angulartics2: Angulartics2) {
    this.setLocale();
    DefaultDashboardSettings.init();
    User.restore();
    ErrorReport.init(this.angulartics2, this.matSnackBar);
    Report.init(this.angulartics2);
    SharedService.user.shoppingCart = new ShoppingCart();
    ProspectingAndMillingUtil.restore();

    this.subs.add(
      SharedService.events.detailPanelOpen,
      () =>
        this.scrollToTheTop());
    this.angulartics2GoogleAnalytics.startTracking();
  }

  ngOnInit(): void {
    this.restorePreviousLocation();
  }


  ngAfterViewInit(): void {
    if (this.isStandalone()) {
      Report.send(
        `Device: ${window.navigator.platform}, ${window.navigator.vendor}`,
        `Standalone startup`
      );

      this.subs.add(
        this._router.events,
        (event: NavigationEnd) =>
          this.onNavigationChange(event));
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private restorePreviousLocation() {
    if (this.isStandalone() && localStorage['current_path']) {
      this._router.navigateByUrl(localStorage['current_path']);
    }
  }

  private scrollToTheTop() {
    // making sure that we are scrolled back to the correct position after opening the detail panel
    if (!this.isPanelOpen()) {
      window.scrollTo(0, SharedService.preScrollPosition);
    }
  }

  private setLocale() {
    if (!localStorage['locale']) {
      switch (navigator.language) {
        case 'it':
          localStorage['locale'] = 'it_IT';
          break;
        case 'pt':
          localStorage['locale'] = 'pt_PT';
          break;
        case 'es':
          localStorage['locale'] = 'es_ES';
          break;
        case 'ru':
          localStorage['locale'] = 'ru_RU';
          break;
        case 'fr':
          localStorage['locale'] = 'fr_FR';
          break;
        case 'de':
          localStorage['locale'] = 'de_DE';
          break;
        default:
          localStorage['locale'] = 'en_GB';
          break;
      }
    }
  }

  private onNavigationChange(event: NavigationEnd) {
    this.saveCurrentRoute(event);
  }

  private saveCurrentRoute(event: NavigationEnd) {
    try {
      /**
       * As iOS does not save where you are upon reload in a "installed" webapp.
       * We're storing the current path.
       */
      localStorage['current_path'] = event['url'];
    } catch (e) {
      console.error('Could not save router change', e);
    }
  }

  isPanelOpen(): boolean {
    return SharedService.selectedSeller !== undefined ||
      SharedService.selectedItemId !== undefined ||
      SharedService.selectedPetSpeciesId !== undefined;
  }

  isStandalone(): boolean {
    return window.navigator['standalone'] || window.matchMedia('(display-mode: standalone)').matches;
  }

  /* istanbul ignore next */
  isDarkmode(): boolean {
    return SharedService.user ? SharedService.user.isDarkMode : false;
  }

  /* istanbul ignore next */
  isItemSelected(): boolean {
    return !!SharedService.selectedItemId;
  }

  /* istanbul ignore next */
  isSellerSelected(): boolean {
    return !!SharedService.selectedSeller;
  }
}
