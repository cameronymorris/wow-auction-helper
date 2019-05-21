export class RealmQuery {
  static insertHouse(house): string {
    return `INSERT INTO \`100680-wah\`.\`auction_houses\`
                  (\`region\`,
                  \`isUpdating\`,
                  \`isActive\`,
                  \`autoUpdate\`)
                  VALUES
                  ("${house.region}",
                  0,
                  1,
                  1);`;
  }

  static insertRealm(realm): string {
    return `INSERT INTO \`100680-wah\`.\`auction_house_realm\`
              (\`ahId\`,
              \`slug\`,
              \`name\`,
              \`battlegroup\`,
              \`timezone\`,
              \`locale\`)
              VALUES
              (${realm.ahId},
              "${realm.slug}",
              "${realm.name}",
              "${realm.battlegroup}",
              "${realm.timezone}",
              "${realm.locale}");`;
  }

  static getAll(): string {
    return `SELECT ahId, region, slug, name, battlegroup, locale, timezone, url,
                lastModified, lowestDelay, avgDelay, highestDelay, ah.size as size
            FROM auction_house_realm AS realm
            LEFT OUTER JOIN auction_houses AS ah
            ON ah.id = realm.ahId
            ORDER BY name;`;
  }

  static getAllHouses(): string {
    return `SELECT ah.id as id, region, slug, name, url, lastModified, lowestDelay, avgDelay, highestDelay
            FROM auction_houses as ah
            LEFT OUTER JOIN (
                SELECT ahId, slug, name
                FROM auction_house_realm
                GROUP BY ahId) as realm
            ON ah.id = realm.ahId
            WHERE ah.id = realm.ahId;`;
  }

  static getAllHousesWithLastModifiedOlderThanPreviousDelay() {
    return `SELECT ah.id as id, region, slug, name, url, lastModified,
                lowestDelay, avgDelay, highestDelay, (${+new Date()} - lastModified) / 60000 as timeSince
            FROM auction_houses as ah
            LEFT OUTER JOIN (
                SELECT ahId, slug, name
              FROM auction_house_realm
                GROUP BY ahId) as realm
            ON ah.id = realm.ahId
            WHERE ah.id = realm.ahId
                AND autoUpdate = 1
                AND (${+new Date()} - lastModified) / 60000 >= lowestDelay;`;
  }

  static updateUrl(ahId: number, url: string, lastModified: number, size: number,
                   delay: { avg: any; highest: any; lowest: any }): string {
    return `UPDATE \`100680-wah\`.\`auction_houses\`
            SET
              \`url\` = "${url}",
              \`lastModified\` = ${lastModified},
              \`isUpdating\` = 0,
              \`size\` = ${size},
              \`lowestDelay\` = ${delay.lowest},
              \`avgDelay\` = ${delay.avg},
              \`highestDelay\` = ${delay.highest}
                WHERE \`id\` = ${ahId};`;
  }

  static getHouse(id: number): string {
    return `SELECT ahId as id, region, slug, name, battlegroup, locale, timezone, url, lastModified
            FROM auction_house_realm as realm
            LEFT OUTER JOIN auction_houses as ah
            ON ah.id = realm.ahId
            WHERE ahid = ${id}
            LIMIT 1;`;
  }

  static getHouseForRealm(region: string, realmSlug: string): string {
    return `SELECT *
            FROM auction_houses
            WHERE id IN (
                  SELECT ahId
                  FROM auction_house_realm
                  WHERE slug = "${realmSlug}")
                AND region = "${region}";`;
  }

  static isUpdating(id: number, isUpdating: boolean) {
    return `UPDATE \`100680-wah\`.\`auction_houses\`
            SET
              \`isUpdating\` = ${isUpdating ? 1 : 0}
                WHERE \`id\` = ${id};`;
  }

  static activateHouse(id: any) {
    return `UPDATE \`100680-wah\`.\`auction_houses\`
            SET
              \`autoUpdate\` = 1
                WHERE \`id\` = ${id};`;
  }
}
