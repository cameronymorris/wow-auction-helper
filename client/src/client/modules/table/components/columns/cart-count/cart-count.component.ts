import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {BaseComponent} from '../base.component';
import {CraftingService} from '../../../../../services/crafting.service';
import {ShoppingCartService} from '../../../../shopping-cart/services/shopping-cart.service';
import {SubscriptionManager} from '@ukon1990/subscription-manager';

@Component({
  selector: 'wah-cart-count',
  templateUrl: './cart-count.component.html',
})
export class CartCountComponent extends BaseComponent implements OnInit, OnDestroy {
  @Input() isRecipeCart: boolean;
  @Input() alwaysDisplayCart: boolean;
  isKnownRecipe: boolean;
  cartCount: number;
  sm = new SubscriptionManager();

  constructor(private shoppingCartService: ShoppingCartService) {
    super();
  }

  ngOnInit() {
    this.isKnownRecipe = this.getIsKnownRecipe();
    this.cartCount = this.getCartCount();

    if (this.isRecipeCart) {
      this.sm.add(this.shoppingCartService.recipes,
        () => this.cartCount = this.getCartCount());
    } else {
      this.sm.add(this.shoppingCartService.items,
        () => this.cartCount = this.getCartCount());
    }
  }

  ngOnDestroy() {
    this.sm.unsubscribe();
  }

  getCartCount(): number {
    if (this.isRecipeCart) {
      if ((!this.row || !this.column.options && !this.column.options.idName) && !this.row.recipeId) {
        return 0;
      }
      const id: number = this.row[this.column.options.idName] || this.row.recipeId;
      const cartItem = this.shoppingCartService.recipesMap.value.get(id);
      return cartItem ? cartItem.quantity : 0;
    } else {
      const id: number = this.row[this.column.options.idName] || this.row.id;
      const cartItem = this.shoppingCartService.itemsMap.value.get(id);
      return cartItem ? cartItem.quantity : 0;
    }
  }

  setCartCount(event: Event): void {
    let valueToAdd = +event.target['value'];

    if ((!this.column.options || !this.column.options.idName) && !this.row.recipeId && this.isRecipeCart) {
      return;
    }

    const id: number = this.row[this.column.options.idName] || this.row.recipeId;
    if (id) {
      const existing = this.isRecipeCart ?
        this.shoppingCartService.recipesMap.value.get(id) :
        this.shoppingCartService.itemsMap.value.get(id);

      if (existing) {
        valueToAdd = valueToAdd - existing.quantity;
      }
      if (this.isRecipeCart) {
        this.shoppingCartService.addRecipe(id, valueToAdd);
      } else {
        this.shoppingCartService.addItem(id, valueToAdd);
      }
    }
    this.cartCount = this.getCartCount();
  }

  getIsKnownRecipe() {
    if ((!this.column.options || !this.column.options.idName) && !this.row.recipeId) {
      return false;
    }
    const id: number = this.row[this.column.options.idName];
    return CraftingService.knownRecipeMap.value.has(id);
  }
}
