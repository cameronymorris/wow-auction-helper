import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { user, lists, db, copperToArray } from '../../utils/globals';
import dexie from 'dexie';

declare var $;
@Component({
	selector: 'app-watchlist',
	templateUrl: './watchlist.component.html',
	styleUrls: ['./watchlist.component.css']
})
export class WatchlistComponent implements OnInit {
	copperToArray = copperToArray;
	queryItems = [];
	itemSearchForm: FormGroup;
	recipeSearchForm: FormGroup;
	groupForm: FormGroup;
	watchlist = { recipes: {}, items: {}, groups: ['Ungrouped'] };
	display = {
		itemSearch: true,
		toggleSearchItem: () => {
			this.display.itemSearch = !this.display.itemSearch;
		},
		recipeSearch: false,
		toggleSearchRecipe: () => {
			this.display.recipeSearch = !this.display.recipeSearch;
		}
	};

	constructor(private formBuilder: FormBuilder, private titleService: Title) {
		this.groupForm = formBuilder.group({
			'name': ''
		});
		this.recipeSearchForm = formBuilder.group({
			'searchQuery': ''
		});
		this.itemSearchForm = formBuilder.group({
			'searchQuery': ''
		});
		this.titleService.setTitle('Wah - Watchlist');
	}

	ngOnInit() {
		this.searchItemDB();
		console.log(user.watchlist);
		this.watchlist.groups = user.watchlist.groups;
		this.watchlist.items = user.watchlist.items;
		this.watchlist.recipes = user.watchlist.recipes;
	}

	/**
	 * Used to search for items in the indexedDB
	 */
	searchItemDB(): void {
		db.table('items')
			.where('name')
			.startsWithIgnoreCase(this.itemSearchForm.value['searchQuery'])
			.limit(5)
			.toArray()
			.then(i => {
				i.forEach(item => {
					item['value'] = 0;
				});
				this.queryItems = i;
			}, e => {
				console.log(e);
			});
	}

	/**
	 * Used for searching for items in an array
	 */
	searchRecipes(): void {
		console.log('Searching for recipes!');
	}

	/**
	 * Adds an item to the watchlist
	 * @param  {object} item
	 */
	addItemToWatchlist(item): void {
		try {
			const watch = {
				id: item.id,
				name: item.name,
				compareTo: 'buyout',
				belowValue: item.value,
				group: item.group
			};
			if (!this.watchlist.items[item.group]) {
				this.watchlist.items[item.group] = [];
			}
			this.watchlist.items[item.group].push(watch);
			user.watchlist.items[item.id] = watch;
			this.saveWatchList();
		} catch (error) {
			console.log('Add item to watchlist faild:', error);
		}
	}

	getItemWatchlist() {
		return user.watchlist.items;
	}

	/**
	 * Gets the buyout value of an item
	 * @param  {string} itemID
	 * @return {number}
	 */
	getBuyout(itemID: string): number {
		if (!lists.auctions[itemID]) {
			return 0;
		}
		return lists.auctions[itemID].buyout;
	}

	saveWatchList(): void {
		localStorage.setItem('watchlist', JSON.stringify(this.watchlist));
	}

	addGroup(): void {
		this.watchlist.groups.push(this.groupForm.value['name']);
		user.watchlist.groups[this.groupForm.value['name']] = this.groupForm.value['name'];
		this.saveWatchList();
	}

	/**
	 * Used to remove groups, but shall not delete groups with items.
	 * if a group has an item, it should open a dialog window.
	 * @param {number} index The index of the group to remove.
	 */
	removeGroup(index: number): void {
		if (this.watchlist.items[this.watchlist.groups[index]] &&
			this.watchlist.items[this.watchlist.groups[index]].length > 0) {
				this.openRemoveGroupDialog(index);
				console.log(`There are ${this.watchlist.items[this.watchlist.groups[index]].length} items in this group!`);
		} else {
			console.log(index);
			this.watchlist.groups.splice(index, 1);
			user.watchlist.groups.splice(index, 1);
			this.saveWatchList();
		}
	}

	openRemoveGroupDialog(index: number): void {
		$('#group-modal').modal('show');
		$('#group-modal').on('hidden.bs.modal', () => {
			// TODO: Logic!
		});
	}

	editItemDialog(group: string, index: number): void {
		$('#item-modal').modal('show');
		$('#item-modal').on('hidden.bs.modal', () => {
			// TODO: Logic!
		});
	}
}
