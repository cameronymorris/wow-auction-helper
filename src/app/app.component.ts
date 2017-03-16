import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuctionService } from './services/auctions';
import { ItemService } from './services/item';
import { user, lists, getPet, db } from './utils/globals';
import { IUser } from './utils/interfaces';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css'],
	providers: [AuctionService]
})
export class AppComponent {
	// http://realfavicongenerator.net/
	private title = 'WAH';
	private lastModified: number;
	private timeSinceLastModified: number;
	private oldTimeDiff: number;
	private date: Date;
	private auctionObserver = {};
	private itemObserver = {};
	private petObserver = {};
	private u: IUser;
	private downloadingText = '';

	constructor(private auctionService: AuctionService,
		private itemService: ItemService,
		private router: Router) {
		this.u = user;
	}

	ngOnInit() {
		this.date = new Date();
		if (this.isRealmSet()) {
			// Loading user settings
			this.u.region = localStorage.getItem('region');
			this.u.realm = localStorage.getItem('realm');
			this.u.character = localStorage.getItem('character');
			this.u.apiTsm = localStorage.getItem('api_tsm');
			this.u.apiWoWu = localStorage.getItem('api_wowuction');
			this.u.customPrices = JSON.parse(localStorage.getItem('custom_prices'));
			this.checkForUpdate();
			/*this.auctionService.getTSMData().then( r => {
				console.log('tsm result:',r);
			}).catch(err => console.log(err));*/
		}
		setInterval(() => this.setTimeSinceLastModified(), 1000);
		setInterval(() => this.checkForUpdate(), 60000);

		this.auctionService.getWoWuctionData().subscribe(res => {
			lists.wowuction = res;
		});
		this.downloadingText = 'Downloading pets';
		this.petObserver = this.itemService.getPets()
			.subscribe(pets => {
				this.buildPetArray(pets['pets']);
				try {
				this.downloadingText = 'Downloading items';
					this.itemObserver = this.itemService.getItems()
						.subscribe(i => {
							this.buildItemArray(i);
						});
				} catch (err) {
					this.downloadingText = 'Failed at downloading items';
					console.log('Failed at loading items', err);
				}

			});
	}

	buildItemArray(arr) {
		if (lists.items === undefined) {
			lists.items = [];
		}
		let index = 0;
		for (let i of arr) {
			lists.items[i['id']] = i;
			if (i['itemSource']['sourceType'] === 'CREATED_BY_SPELL') {
				// Logic for adding new recipes
			}
			index++;
		}
		try {
			this.getAuctions();
		} catch (err) {
			console.log('Failed at loading auctions', err);
		}
		this.itemService.getRecipes()
			.subscribe(recipe => {
				let accepted = true;
				let num = 0;
				if (lists.recipes === undefined) {
					lists.recipes = [];
				}
				recipe.recipes.forEach(r => {
					num++;
					if (r !== null && r['profession'] !== undefined && r['profession'] !== null) {
						lists.recipes.push(r);
					}
				});

			});
	}

	getAuctions(): void {
		this.downloadingText = 'Downloading auctions, this might take a while';
		console.log('Loading auctions');
		this.auctionService.getLastUpdated().subscribe(r => {
			this.auctionObserver = this.auctionService.getAuctions(r['url'].replace('\\',''))
			.subscribe(a => {
				this.downloadingText = '';
				this.buildAuctionArray(a.auctions);
			});
		});
	}

	buildAuctionArray(arr) {
		let list = [];
		for (let o of arr) {
			if(o['buyout'] === 0) {
				continue;
			}

			// TODO: this.numberOfAuctions++;
			if (lists.items[o.item] === undefined) {
				lists.items[o.item] = { 'id': o.item, 'name': 'Loading', 'icon': '' };
				o['name'] = 'Loading';
				this.getItem(o.item);
			} else {
				o['name'] = lists.items[o.item].name;
			}
			try {
				if (o.petSpeciesId !== undefined) {
					if (lists.pets[o.petSpeciesId] === null) {
						getPet(o.petSpeciesId);
					}
					o['name'] = this.getItemName(o);
				}
			} catch (e) { console.log(e); }

			if (lists.wowuction[o.item] !== undefined) {
				o['estDemand'] = Math.round(lists.wowuction[o.item]['estDemand'] * 100) || 0;
				o['avgDailySold'] = parseFloat(lists.wowuction[o.item]['avgDailySold']) || 0;
				o['avgDailyPosted'] = parseFloat(lists.wowuction[o.item]['avgDailyPosted']) || 0;
				o['mktPrice'] = lists.wowuction[o.item]['mktPrice'] || 0;
			} else {
				o['estDemand'] = 0;
				o['avgDailySold'] = 0;
				o['avgDailyPosted'] = 0;
				o['mktPrice'] = 0;
			}

			if (list[o.item] !== undefined) {

				list[o.item]['auctions'][o.auc] = o;
				list[o.item]['quantity_total'] += o['quantity'];

				if (list[o.item]['buyout'] >
					o['buyout'] / o['quantity']) {

					list[o.item]['buyout'] = o['buyout'] / o['quantity'];
					list[o.item]['owner'] = o['owner'];
				} else if (list[o.item]['buyout'] / list[o.item]['auctions'][ list[o.item]['auc'] ] ===
					o['buyout'] / o['quantity'] &&
					list[o.item]['owner'] !== o['owner']) {
					list[o.item]['owner'] += ', ' + o['owner'];
				}
			} else {
				o['quantity_total'] = o['quantity'];
				list[o.item] = o;
				list[o.item]['auctions'] = [];
				list[o.item]['auctions'][o.auc] = o;
			}

			// Storing a users auctions in a list
			if (this.u.character !== undefined) {
				if (o.owner === this.u.character) {
					if (lists.myAuctions === undefined) {
						lists.myAuctions = [];
					}
					lists.myAuctions.push(o);
				}
			}
		}
		lists.auctions = list;
		this.getCraftingCosts();
	}

	getItemName(auction): string {
		let itemID = auction.item;
		if (auction.petSpeciesId !== undefined) {
			auction['name'] = getPet(auction.petSpeciesId) + ' @' + auction.petLevel;
			return getPet(auction.petSpeciesId) + ' @' + auction.petLevel;
		} else {
			if (lists.items[itemID] !== undefined) {
				if (lists.items[itemID]['name'] === 'Loading') {
					this.getItem(itemID);
				}
				return lists.items[itemID]['name'];
			}
		}
		return 'no item data';
	}

	getSize(list): number {
		let count = 0;
		for (let c of list) {
			count++;
		}
		return count;
	}

	getItem(id) {
		this.itemObserver = this.itemService.getItem(id)
			.subscribe(
			r => lists.items[r['id']] = r
			);
	}

	buildPetArray(pets) {
		let list = [];
		pets.forEach(p => {
			list[p.speciesId] = p;
		});
		lists.pets = list;
	}

	setTimeSinceLastModified() {
		this.date = new Date();

		let updateTime = new Date(this.lastModified).getMinutes(),
			currentTime = this.date.getMinutes(),
			oldTime = this.timeSinceLastModified;
		// Checking if there is a new update available
		if (this.timeDiff(updateTime, currentTime) < this.oldTimeDiff) {
			this.getAuctions();
		}

		this.timeSinceLastModified = this.timeDiff(updateTime, currentTime);
		this.oldTimeDiff = this.timeDiff(updateTime, currentTime);
	}

	timeDiff(updateTime, currentTime) {
		return (updateTime > currentTime ?
			(60 - updateTime + currentTime) : currentTime - updateTime);
	}

	exists(value): boolean {
		return value !== null && value !== undefined && value.length > 0;
	}

	isRealmSet(): boolean {
		return this.exists(localStorage.getItem('realm')) &&
			this.exists(localStorage.getItem('region'));
	}

	isCharacterSet(): boolean {
		return this.isRealmSet() && this.exists(user.character);
	}

	checkForUpdate() {
		if (this.isRealmSet()) {
			this.auctionService.getLastUpdated()
				.subscribe(r =>
				this.lastModified = r['lastModified']);
		}
	}

	getCraftingCosts(): void {
		for (let c of lists.recipes) {
			this.calcCost(c);
		}
		console.log('Done calculating crafting costs');
	}

	calcCost(c) {
		if (c !== null) {
			let matBuyout: number;
			c['cost'] = 0;
			c['buyout'] = 0;
			c['profit'] = 0;
			try { // 699 Immaculate Fibril
				c.buyout = lists.auctions[c.itemID] !== undefined ?
					(lists.auctions[c.itemID].buyout) : 0;
				try {
					for (let m of c.reagents) {
						try {
							m.count = m.count/ c.minCount;
							matBuyout = lists.auctions[m.itemID] !== undefined ?
								(lists.auctions[m.itemID].buyout) :
									lists.customPrices[m.itemID] !== undefined ?
										lists.customPrices[m.itemID] : 0;
							c.cost += matBuyout !== 0 ? m.count * matBuyout : 0;
						} catch (errr) {
							console.log('Failed at calculating cost', errr);
							console.log(c);
						}
					}
				} catch (err) {
					console.log(err);
					console.log(c);
				}
				c.profit = c.buyout - c.cost;
			} catch (e) {
				console.log(e);
				console.log(c);
			}
		}
	}
}
