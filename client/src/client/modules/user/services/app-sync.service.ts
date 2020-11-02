import {Injectable} from '@angular/core';
import {Auth} from '@aws-amplify/auth';
import {AUTH_TYPE, AWSAppSyncClient} from 'aws-appsync';
import {APP_SYNC} from '../../../secrets';
import {GetSettings} from '../graphql/setting.queries';
import {CreateSettingsMutation, DeleteSettingsMutation, UpdateSettingsMutation} from '../graphql/mutations';
import {User} from '../../../models/user/user';
import {UserUtil} from '../../../utils/user/user.util';
import {Character} from '../../character/models/character.model';
import {ShoppingCartService} from '../../shopping-cart/services/shopping-cart.service';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppSyncService {
  settings: BehaviorSubject<User> = new BehaviorSubject<User>(undefined);
  private readonly client: AWSAppSyncClient<any>;
  // In case someone starts the dev environment without APP_SYNC configured
  private readonly hasConfig = APP_SYNC && APP_SYNC.aws_appsync_graphqlEndpoint;
  private user: User;
  private shoppingCartService: ShoppingCartService;

  constructor() {
    if (!this.hasConfig) {
      console.log('There is no config available for AWS AppSync');
      return;
    }
    this.client = new AWSAppSyncClient({
      url: APP_SYNC.aws_appsync_graphqlEndpoint,
      region: APP_SYNC.aws_project_region,
      auth: {
        type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
        jwtToken: async () => (await Auth.currentSession()).getIdToken().getJwtToken()
      }
    });

    // setTimeout(() => this.createSettings(), 1000);
  }

  setInitial(user: User, shoppingCartService: ShoppingCartService) {
    this.user = user;
    this.shoppingCartService = shoppingCartService;

    // UserUtil.restore();
    // SharedService.user.shoppingCart = new ShoppingCart(this.auctionService);
    // ProspectingAndMillingUtil.restore();
  }

  createSettings() {
    if (!this.client) {
      return;
    }
    const mutate = CreateSettingsMutation;
    const user: User = this.user;
    const {recipes, items} = this.shoppingCartService;
    this.client.mutate({
      mutation: mutate,
      variables: {
        input: {
          realm: user.realm,
          region: user.region,
          customPrices: [],
          customProcs: [],
          buyoutLimit: user.buyoutLimit,
          useVendorPriceForCraftingIfAvailable: user.useVendorPriceForCraftingIfAvailable,
          useIntermediateCrafting: user.useIntermediateCrafting,
          shoppingCart: {
            recipes: recipes.value,
            items: items.value,
          },
          craftingStrategy: user.craftingStrategy,
          locale: localStorage.getItem('locale'),
          lastModified: +new Date(),
          created: +new Date(),
        },
      }
    })
      .then(settings => this.handleSettingsUpdate(settings as any))
      .catch(console.error);
  }

  reduceCharacters(characters: Character[]): {characters: {lastModified, slug, name}[]} {
    return {
      characters: characters.map(({lastModified, slug, name}) => ({
        lastModified, slug, name
      }))
    };
  }

  updateSettings(updateData: any) {
    Object.assign(this.user, {
      ...updateData,
      characters: this.user.characters,
    });
    UserUtil.save();
    if (!this.client) {
      return;
    }

    this.client.mutate({
      mutation: UpdateSettingsMutation(Object.keys(updateData)),
      variables: {
        input: updateData,
      }
    })
      .then(settings => this.handleSettingsUpdate(settings as any))
      .catch(console.error);
  }

  deleteSettings() {
    if (!this.client) {
      return;
    }
    const mutate = DeleteSettingsMutation;
    this.client.mutate({
      mutation: mutate,
      variables: {
        input: {},
      }
    })
      .then(console.log)
      .catch(console.error);
  }

  getSettings() {
    if (!this.client) {
      return;
    }
    return new Promise<any>((resolve, reject) => {
      this.client.query({
        query: GetSettings,
        fetchPolicy: 'network-only'
      })
        .then(settings => {
          this.handleSettingsUpdate(settings as any);
          resolve();
        })
        .catch(error => {
          console.error(error);
          reject(error);
        });
    });
  }

  private handleSettingsUpdate(result: {data: {getWahUserSettings: User}}) {

    const settings: User = result.data.getWahUserSettings;
    Object.assign(this.user, {
      ...settings,
      characters: this.user.characters,
    });
    UserUtil.save();
    this.settings.next(settings);
    return undefined;
  }
}
