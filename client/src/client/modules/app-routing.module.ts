import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {SetupComponent} from './settings/components/setup/setup.component';
import {CraftingComponent} from './crafting/components/crafting.component';
import {IsRegisteredService} from '../Is-registered.service';
import {DashboardComponent} from './dashboard/components/dashboard.component';
import {UpdateComponent} from './core/components/update/update.component';
import {AuctionsComponent} from './auction/components/auctions/auctions.component';
import {MyAuctionsComponent} from './auction/components/my-auctions/my-auctions.component';
import {TradeVendorsComponent} from './core/components/trade-vendors/trade-vendors.component';
import {WatchlistComponent} from './dashboard/components/manage/watchlist.component';
import {DashboardItemsComponent} from './dashboard/components/dashboard-items/dashboard-items.component';
import {DashboardSellersComponent} from './dashboard/components/dashboard-sellers/dashboard-sellers.component';
import {SellersComponent} from './sellers/components/sellers.component';
import {PetsValueComponent} from './pet/components/pets-value.component';
import {MarketResetComponent} from './market-reset/components/market-reset/market-reset.component';
import {MillingComponent} from './crafting/components/milling/milling.component';
import {DisenchantingComponent} from './crafting/components/disenchanting/disenchanting.component';
import {AhSummaryComponent} from './dashboard/components/ah-summary/ah-summary.component';
import {ReputationsComponent} from './core/components/reputations/reputations.component';
import {TsmAddonDbComponent} from './tsm/components/tsm-addon-db.component';
import {SETTINGS_ROUTE} from './settings/settings.routes';
import {ABOUT_ROUTE} from './about/about.route';
import {ProfitSummaryComponent} from './tsm/components/profit-summary/profit-summary.component';
import {TsmDatasetComponent} from './tsm/components/tsm-dataset/tsm-dataset.component';
import {TitledRoute} from '../models/route/titled-route.model';
import {TitledRoutes} from '../models/route/titled-routes.model';
import {environment} from '../../environments/environment';

const TOOLS_ROUTE: TitledRoute = {
  path: 'tools',
  title: 'Tools',
  canActivate: [IsRegisteredService],
  children: [
    {
      title: 'TSM Addon', path: 'tsm', component: TsmAddonDbComponent, children: [
        {
          title: 'Profit summary', path: 'summary', component: ProfitSummaryComponent, isHidden: true
        },
        {
          title: 'Data sets', isHidden: true,
          path: 'dataset', component: TsmDatasetComponent, children: [
            {path: ':name', component: TsmDatasetComponent}
          ]
        }
      ]
    },
    {
      title: 'Market reset', path: 'market-reset', component: MarketResetComponent
    },
    {
      title: 'Milling & Prospecting', path: 'milling-and-prospecting', component: MillingComponent
    },
    {
      title: 'Manage Dashboards', path: 'watchlist', redirectTo: '/dashboard/manage-dashboards'
    },
    {
      title: 'Reputations', path: 'reputations', component: ReputationsComponent
    }, {
      title: 'Pet value', path: 'pet-value', component: PetsValueComponent
    },
    {
      title: 'Trade vendors', path: 'trade-vendor', component: TradeVendorsComponent
    },
    /*
    {
      title: 'Sellers', path: 'sellers', component: SellersComponent
    },*/
    {
      title: 'Disenchanting', path: 'disenchanting', component: DisenchantingComponent, isHidden: environment.production
    },
    {
      title: 'App data updater',
      path: 'ud',
      component: UpdateComponent,
      canActivate: [IsRegisteredService],
      isHidden: environment.production
    }
  ]
};

const DASHBOARD_ROUTE: TitledRoute = {
  title: 'Dashboard',
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [IsRegisteredService],
  children: [
    {path: '', pathMatch: 'full', redirectTo: 'items'},
    {
      title: 'Item', path: 'items', component: DashboardItemsComponent
    },
    /*
    {
      title: 'Seller', path: 'sellers', component: DashboardSellersComponent
    },*/
    {
      title: 'AH summary', path: 'ah-summary', component: AhSummaryComponent
    },
    {path: 'tsm', redirectTo: '/tools/tsm'},
    {
      title: 'Manage', path: 'manage-dashboards', component: WatchlistComponent
    }
  ]
};

export const appRoutes: TitledRoutes = [
  {path: '', component: SetupComponent},
  DASHBOARD_ROUTE,
  {
    title: 'Crafting', path: 'crafting', component: CraftingComponent, canActivate: [IsRegisteredService]
  },
  {
    title: 'Auctions', path: 'auctions', canActivate: [IsRegisteredService], component: AuctionsComponent/*,
    children: [
      {title: 'Browse auctions', path: '', component: AuctionsComponent},
      {
        title: 'My auctions', path: 'my-auctions', component: MyAuctionsComponent, canActivate: [IsRegisteredService]
      }
    ]*/
  },
  {
    path: 'trade-vendor', pathMatch: 'full', redirectTo: 'tools/trade-vendor'
  },
  TOOLS_ROUTE,
  SETTINGS_ROUTE,
  ABOUT_ROUTE,
  {path: '**', redirectTo: ''}
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
