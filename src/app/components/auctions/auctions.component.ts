import { Component } from '@angular/core';
import { NgClass } from '@angular/common';
import { AuctionService } from '../../services/auctions';
import { ItemService } from '../../services/item';

import { user, itemClasses } from '../../utils/globals';
import { IUser, IAuction } from '../../utils/interfaces';

declare var $WowheadPower;

@Component({
	selector: 'auctions',
	templateUrl: 'auctions.component.html',
	styleUrls: ['auctions.component.css'],
	providers: [AuctionService, ItemService]
})

export class AuctionComponent {
	//Strings
	private title = 'Auctions';
	private searchQuery = '';
	private filterByCharacter = false;
	private filter = { 'itemClass': '-1', 'itemSubClass': '-1' };

	//Objects and arrays
	private user: IUser;
	private itemClasses = {};
	private auctionObserver = {};
	private itemObserver = {};
	private petObserver = {};
	private auctions = [];
	private autionList: IAuction[];
	private itemList = {};
	private petList = [];
	private auctionDuration = {
		'VERY_LONG': '12h+',
		'LONG': '2-12h',
		'MEDIUM': '30min-2h',
		'SHORT': '<30min'
	}

	//Numbers
	private limit: number = 10;//per page
	private index: number = 0;
	private numberOfAuctions: number = 0;
	private currentPage: number = 1;
	private numOfPages: number = this.numberOfAuctions / this.limit;

	private buyOutAsc: boolean = true;

	constructor(
		private auctionService: AuctionService,
		private itemService: ItemService) {
		this.user = user;
		this.itemClasses = itemClasses;
	}

	ngOnInit(): void {
		if (this.auctions.length === 0) {
			this.petObserver = this.itemService.getPets()
				.subscribe(pets => {
					this.buildPetArray(pets['pets']);
				});
			this.itemObserver = this.itemService.getItems()
				.subscribe(
				i => {
					this.buildItemArray(i)
				}
				);
		}

	}

	changePage(change: number): void {
		if (change > 0 && this.currentPage <= this.numOfPages) {
			this.currentPage++;
		} else if (change < 0 && this.currentPage > 1) {
			this.currentPage--;
		}
		$WowheadPower.init();
	}

	getItemIcon(auction): string {
		let icon = 'http://media.blizzard.com/wow/icons/56/';
		if (auction.petSpeciesId !== undefined) {
			if (this.petList[auction.petSpeciesId] === undefined) {
				this.getPet(auction.petSpeciesId);
			}
			icon += this.petList[auction.petSpeciesId].icon;
		} else {
			icon += this.itemList[auction.item].icon;
		}
		icon += '.jpg';
		return icon;
	}

	getToolTip(itemID: string) {
		if (this.itemList[itemID]['description'] === undefined) {
			this.getItem(itemID);
		}
	}

	getType(s) {
		return typeof s;
	}

	getDescription(itemID: string): string {
		let item = this.itemList[itemID];
		if (item['description'] !== undefined && item['description'].length > 0) {
			return item['description'];
		} else if (item['itemSpells'] !== undefined) {
			let itemSpells = item['itemSpells'];
			if (itemSpells.length > 0) {
				return itemSpells[0]['spell']['description'];
			}
		}
	}

	getNumOfPages() {
		this.numOfPages = this.numberOfAuctions / this.limit;
		return Math.round(this.numOfPages);
	}

	filterAuctions(): Array<Object> {

		this.numberOfAuctions = 0;

		let list: Array<Object> = [];
		for (let a of this.auctions) {
			let match = true;
			// Matching against item type
			if (this.isTypeMatch(this.itemList[a.item]) && match) {
				match = true;
			} else {
				match = false;
			}
			if (this.filterByCharacter || this.searchQuery.length > 0) {
				// Matching against item name
				if (this.searchQuery.length !== 0 && match) {
					// TODO: Used to use getItemName()
					if (a.name.toLowerCase().indexOf(this.searchQuery.toLowerCase()) !== -1) {
						match = true;
					} else {
						match = false;
					}
				}

				// Matching against auction owner
				if (this.filterByCharacter && match) {
					match = a.owner === user.character;
				}
			}
			if (match) {
				this.numberOfAuctions++;
				list.push(a);
			}
		}
		return list;
	}

	isTypeMatch(item): boolean {
		let match: boolean = false;
		if (this.filter.itemClass == '-1' || item.itemClass == itemClasses.classes[this.filter.itemClass].class) {
			// TODO: handle undefined subClass
			if (this.filter.itemSubClass == '-1' ||
				item.itemSubClass == itemClasses
					.classes[this.filter.itemClass]
					.subclasses[this.filter.itemSubClass].subclass) {
				match = true;
			} else {
				match = false;
			}
		}
		return match;
	}

	buildItemArray(arr) {
		let items = [];
		for (let i of arr) {
			items[i['id']] = i;
		}
		this.itemList = items;
		this.getAuctions();
	}

	getAuctions(): void {
		console.log('Loading auctions');
		this.auctionObserver = this.auctionService.getAuctions()
			.subscribe(
			r => {
				this.buildAuctionArray(r.auctions)
			}
			);
	}

	getItemName(auction): string {
		let itemID = auction.item;
		if (auction.petSpeciesId !== undefined) {
			auction['name'] = this.getPet(auction.petSpeciesId) + ' @' + auction.petLevel;
			return this.getPet(auction.petSpeciesId) + ' @' + auction.petLevel;
		} else {
			if (this.itemList[itemID] !== undefined) {
				if (this.itemList[itemID]['name'] === 'Loading') {
					this.getItem(itemID);
				}
				return this.itemList[itemID]['name'];
			}
		}
		return 'no item data';
	}

	getPet(speciesId) {
		if (this.petList[speciesId] === undefined) {
			this.petList[speciesId] = {
				"speciesId": speciesId,
				"petTypeId": 0,
				"creatureId": 54730,
				"name": "Loading",
				"icon": "spell_shadow_summonimp",
			};
			this.petObserver = this.itemService.getPet(speciesId).subscribe(
				r => {
					this.petList[speciesId] = r;
					console.log(r);
				}
			);
		}
		return this.petList[speciesId].name;
	}

	buildAuctionArray(arr) {
		let list = [];
		for (let o of arr) {
			this.numberOfAuctions++;
			if (this.itemList[o.item] === undefined) {
				this.itemList[o.item] = { 'id': o.item, 'name': 'Loading', 'icon': '' };
				o['name'] = 'Loading';
				//this.getItem(o.item);
			} else {
				o['name'] = this.itemList[o.item].name;
			}
			if (o.petSpeciesId !== undefined) {
				if (this.petList[o.petSpeciesId] === null) {
					this.getPet(o.petSpeciesId);
				}
				o['name'] = this.getItemName(o);
			}
			list.push(o);
		}
		this.auctions = list;
	}

	buildPetArray(pets) {
		let list = [];
		pets.forEach(p => {
			list[p.speciesId] = p;
		});
		this.petList = list;
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
			r => this.itemList[r['id']] = r
			);
	}

	copperToArray(c): string {
		//Just return a string
		var result = [];
		result[0] = c % 100;
		c = (c - result[0]) / 100;
		result[1] = c % 100; //Silver
		result[2] = ((c - result[1]) / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); //Gold
		return result[2] + 'g ' + result[1] + 's ' + result[0] + 'c';
	}

	sortAuctions(sortBy: string) {
		if (this.buyOutAsc) {
			this.buyOutAsc = false;
			this.auctions.sort(
				function (a, b) {
					if (a[sortBy] < b[sortBy]) {
						return 1;
					}
					return -1;
				}
			);
		} else {
			this.buyOutAsc = true;
			this.auctions.sort(
				function (a, b) {
					if (a[sortBy] > b[sortBy]) {
						return 1;
					}
					return -1;
				}
			);
		}
	}

	saveSettings(): void {
		localStorage.setItem('region', user.region);
		localStorage.setItem('realm', user.realm);
		localStorage.setItem('charater', user.character);
	}
}
