import {Reputation} from '../models/character/character-reputations-game-data.model';

export class Character {
  lastModified: number;
  name: string;
  realm: string;
  battlegroup: string;
  class: number;
  race: number;
  gender: number;
  level: number;
  achievementPoints: number;
  totalHonorableKills: number;
  media: {
    bustUrl: string;
    avatarUrl: string;
    renderUrl: string;
  };
  calcClass: string;
  faction: number; // 0 = ally, 1 = horde
  professions: {
    primaries: CharacterProfession[],
    secondaries: CharacterProfession[]
  };
  statistics?: CharacterStatistic[];
  mounts?: {
    numCollected: number;
    numNotCollected: number;
    mounts: Mount;
  };
  pets?: UserPets;
  petSlots?: PetSlot[];
  guild?: string;
  reputations: Reputation[];
  slug: string;

  constructor(realm?: string, name?: string) {
    if (realm) {
      this.realm = realm;
    }

    if (name) {
      this.name = name;
    }
  }
}

export interface CharacterProfession {
  id: number;
  skillTiers: {
    id: number;
    points: number;
    recipes: number[];
  }[];
}

interface CharacterStatisticCategory {
  id: number;
  name: string;
  statistics?: Array<CharacterStatistic>;
  subCategories?: Array<CharacterStatisticCategory>;
}

interface CharacterStatistic {
  id: number;
  name: string;
  quantity: number;
  lastUpdated: number;
  money: false;
}

class Mount {
}

class UserPets {
  numCollected = 0;
  numNotCollected = 0;
  collected: Array<CollectedPet>;
}

export interface CollectedPet {
  name: string;
  spellId: number;
  creatureId: number;
  itemId: number;
  qualityId: number;
  icon: string;
  stats: PetStats;
  battlePetGuid: string;
  count?: number;
  isFavorite: boolean;
  isFirstAbilitySlotSelected: boolean;
  isSecondAbilitySlotSelected: boolean;
  isThirdAbilitySlotSelected: boolean;
  creatureName: string;
  canBattle: boolean;
}

interface PetStats {
  speciesId: number;
  breedId: number;
  petQualityId: number;
  level: number;
  health: number;
  power: number;
  speed: number;
}

class PetSlot {
}
