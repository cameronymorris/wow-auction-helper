import { Request, Response } from 'express';
import * as mysql from 'mysql';
import * as request from 'request';
import * as RequestPromise from 'request-promise';
import { getLocale } from '../util/locales';
import { safeifyString } from './string.util';
import { BLIZZARD_API_KEY, DATABASE_CREDENTIALS } from './secrets';
import { Recipe } from '../models/crafting/recipe';
import { ItemLocale } from '../models/item/item-locale';
const PromiseThrottle: any = require('promise-throttle');

export class RecipeUtil {
  public static getRecipe(id: number, res: Response, req: any) {
    const connection = mysql.createConnection(DATABASE_CREDENTIALS);
    connection.query(`SELECT json from recipes WHERE id = ${req.params.spellID}`, (err, rows, fields) => {
      try {
        if (!err && rows.length > 0) {
          try {
            connection.end();
          } catch (e) {
            console.error('Could not call end()', e);
          }

          rows.forEach(r => {
            try {
              res.json(JSON.parse(r.json));
            } catch (err) {
              console.error(err, r.json);
            }
          });
        } else {
          request.get(`http://wowdb.com/api/spell/${req.params.spellID}`, (err, r, body) => {
            const recipe = RecipeUtil.convertWoWDBToRecipe(JSON.parse(body.slice(1, body.length - 1)));
            //res.send(recipe);
            RecipeUtil.getProfession(recipe, function (r) {
              if (recipe.itemID > 0) {
                const query = `INSERT INTO recipes VALUES(${
                  req.params.spellID
                  }, "${
                  safeifyString(JSON.stringify(recipe))
                  }", CURRENT_TIMESTAMP);`;
                console.log(`${new Date().toString()} - Adding new recipe (${r.name}) - SQL: ${query}`);
                connection.query(query, (err, r, body) => {
                  if (!err) {
                    connection.end();
                  } else {
                    throw err;
                  }
                });
              }
              res.send(r);
            });
          });
        }
      } catch (e) {
        console.error(`${new Date().toString()} - Getting a recipe failed for the spellID ${req.params.spellID}`, e);
      }
    });
  }

  public static postRecipes(
    response: Response,
    req: any
  ): void {

    const db = mysql.createConnection(DATABASE_CREDENTIALS);
    console.log('req', req.query);
    // select json, de_DE from recipes as r, recipe_name_locale as l where r.id = l.id;
    db.query(`
      SELECT l.id, json, ${ getLocale(req)} as name from  recipes as r
      LEFT OUTER JOIN recipe_name_locale as l
      ON r.id = l.id
      WHERE json NOT LIKE '%itemID":0%'
      AND timestamp > "${ req.body.timestamp + ''}";`, (err, rows, fields) => {
        db.end();
        if (!err) {
          const recipes: any[] = [];
          rows.forEach((row: any) => {
            try {
              recipes.push(
                JSON.parse(row.json));
            } catch (err) {
              console.error(`${new Date().toString()} - Could not parse json (${row.id})`, row.json, err);
            }
          });
          response.send({ 'recipes': recipes });
        } else {
          console.log(`${new Date().toString()} - The following error occured while querying DB:`, err);
        }
      });
  }

  public static convertWoWDBToRecipe(wowDBRecipe) {
    const basePoints = wowDBRecipe.Effects[0].BasePoints,
      recipe = {
        spellID: wowDBRecipe.ID,
        itemID: wowDBRecipe.CreatedItemID,
        name: wowDBRecipe.Name,
        profession: 'none',
        rank: wowDBRecipe.Rank,
        minCount: basePoints > 0 ? basePoints : 1,
        maxCount: basePoints > 0 ? basePoints : 1,
        reagents: RecipeUtil.convertReagents(wowDBRecipe.Reagents)
      };
    return recipe;
  }

  public static convertReagents(reagents) {
    const r = [];
    reagents.forEach(reagent => {
      r.push({ itemID: reagent.Item, name: '', count: reagent.ItemQty, dropped: false });
    });
    return r;
  }

  public static getProfession(recipe, callback) {
    request.get(`https://eu.api.battle.net/wow/recipe/${recipe.spellID}?locale=en_GB&apikey=${BLIZZARD_API_KEY}`, (err, r, body) => {
      try {
        recipe.profession = JSON.parse(body).profession;
      } catch (e) {
        console.error(`Could not find a profession for ${recipe.spellId} - ${recipe.name}`, body, e);
      }
      RecipeUtil.processReagents(recipe, 0, callback);
    });
  }

  public static processReagents(recipe, nextIndex, callback) {
    if (nextIndex >= recipe.reagents.length) {
      callback(recipe);
    } else {
      request.get(`https://wowdb.com/api/item/${recipe.reagents[nextIndex].itemID}`, (err, r, body) => {
        try {
          const item = JSON.parse(body.slice(1, body.length - 1));

          recipe.reagents[nextIndex].name = item.Name;
          recipe.reagents[nextIndex].dropped = item && item.DroppedBy && item.DroppedBy.length > 0;

          RecipeUtil.processReagents(recipe, nextIndex + 1, callback);
        } catch (e) {
          console.error(`Could not get item ${recipe.reagents[nextIndex].itemID}`, body, e);
        }
      });
    }
  }

  public static setMissingLocales(req, res) {
    // Limit to 9 per second
    return new Promise((reso, rej) => {
      const connection = mysql.createConnection(DATABASE_CREDENTIALS);
      connection.query('select id from recipes where id not in (select id from recipe_name_locale);', async (err, rows, fields) => {
        if (!err) {
          const promiseThrottle = new PromiseThrottle({
            requestsPerSecond: 1,
            promiseImplementation: Promise
          });

          const list = [];
          const spellIDs = [];
          rows.forEach(row => {
            spellIDs.push(
              promiseThrottle.add(() => {
                return new Promise((resolve, reject) => {
                  RecipeUtil.getRecipeLocale(row.id, req, res)
                    .then(r => {
                      list.push(r);
                      resolve(r);
                    })
                    .catch(e => {
                      console.error(e);
                      reject({});
                    });
                })
              }));
          });
          await Promise.all(spellIDs)
            .then(r => { })
            .catch(e => console.error(e));
          reso(list);
        } else {
          rej({});
        }
      });
    });
  }

  public static async getRecipeLocale(spellID, req, res) {
    const recipe: ItemLocale = new ItemLocale(spellID);
    const euPromises = ['en_GB', 'de_DE', 'es_ES', 'fr_FR', 'it_IT', 'pl_PL', 'pt_PT', 'ru_RU']
      .map(locale => RequestPromise.get(`https://eu.api.battle.net/wow/spell/${spellID}?locale=${locale}&apikey=${BLIZZARD_API_KEY}`, (r, e, b) => {
        try {
          recipe[locale] = JSON.parse(b).name;
        } catch (e) {
          recipe[locale] = '404';
        }
      })),
      usPromises = ['en_US', 'es_MX', 'pt_BR']
        .map(locale => RequestPromise.get(`https://us.api.battle.net/wow/spell/${spellID}?locale=${locale}&apikey=${BLIZZARD_API_KEY}`, (r, e, b) => {
          try {
            recipe[locale] = JSON.parse(b).name;
          } catch (e) {
            recipe[locale] = '404';
          }
        }));


    await Promise.all(euPromises).then(r => {
    }).catch(e => {
    });

    try {
      const db = mysql.createConnection(DATABASE_CREDENTIALS),
        sql = `INSERT INTO recipe_name_locale
        (id,
          en_GB,
          en_US,
          de_DE,
          es_ES,
          es_MX,
          fr_FR,
          it_IT,
          pl_PL,
          pt_PT,
          pt_BR,
          ru_RU)
        VALUES
        (${recipe['id']},
          "${safeifyString(recipe['en_GB'])}",
          "${safeifyString(recipe['en_US'])}",
          "${safeifyString(recipe['de_DE'])}",
          "${safeifyString(recipe['es_ES'])}",
          "${safeifyString(recipe['es_MX'])}",
          "${safeifyString(recipe['fr_FR'])}",
          "${safeifyString(recipe['it_IT'])}",
          "${safeifyString(recipe['pl_PL'])}",
          "${safeifyString(recipe['pt_PT'])}",
          "${safeifyString(recipe['pt_BR'])}",
          "${safeifyString(recipe['ru_RU'])}");`;

      db.query(sql, (err, rows, fields) => {
        db.end();
        if (!err) {
          console.log(`Locale added to db for ${recipe.en_GB}`);
        } else {
          console.error(`Locale not added to db for ${recipe.en_GB}`, err);
        }
      });
      //
    } catch (e) {
      //
    }

    return recipe;
  }
}