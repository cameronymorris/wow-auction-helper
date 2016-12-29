import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { FrontPageComponent } from './components/frontpage/front.page.component';
import { UserComponent } from './components/user/user.component';
import { AuctionComponent } from './components/auctions/auctions.component';
import { AboutComponent } from './components/about/about.component';
import { SettingsComponent } from './components/settings/settings.component';

@NgModule({
	declarations: [
		AppComponent,
		UserComponent,
		FrontPageComponent,
		AuctionComponent,
		AboutComponent,
		SettingsComponent
	],
	imports: [
		BrowserModule,
		FormsModule,
		HttpModule,
		RouterModule.forRoot([
			{
				path: '',
				component: FrontPageComponent
			}, {
				path: 'auctions',
				component: AuctionComponent
			}, {
				path: 'about',
				component: AboutComponent
			}, {
				path: 'settings',
				component: SettingsComponent
			}
		])
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule { }
