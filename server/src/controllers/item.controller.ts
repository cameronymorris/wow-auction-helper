import { Request, Response } from 'express';
import mysql from 'mysql';
import { Item } from '../models/item/item';
import { DATABASE_CREDENTIALS } from '../util/secrets';
import { getLocale } from '../util/locales';
import { ItemUtil } from '../util/item.util';
import { WoWHead } from '../models/item/wowhead';
import { BFALists } from '../bfa-recipe-list';

export const getItem = async (req: Request, res: Response) => {
  const db = mysql.createConnection(DATABASE_CREDENTIALS);
  db.query(`
    SELECT i.id, COALESCE(${ getLocale(req) }, i.name) as name, icon, itemLevel, itemClass, itemSubClass, quality, itemSpells, itemSource, buyPrice, sellPrice, itemBind, minFactionId, minReputation, isDropped, expansionId
    FROM items as i
    LEFT OUTER JOIN item_name_locale as l
    ON i.id = l.id
    WHERE i.id = ${ req.params.id };`,
  (err, rows, fields) =>
    ItemUtil.getItem(req.params.id, err, rows as Item[], res, req, db));
};

export const updateItem = async (req: Request, res: Response) => {
  console.log('Patch', req.params.id);
  ItemUtil.patchItem(req.params.id, res, req);
};

/**
 * GET /api/item
 * List of API examples.
 */
export const getItems = (req: Request, res: Response) => {
  const db = mysql.createConnection(DATABASE_CREDENTIALS);
  db.query(`
      SELECT i.id, COALESCE(${ getLocale(req) }, i.name) as name, icon, itemLevel, itemClass, itemSubClass, quality, itemSpells, itemSource, buyPrice, sellPrice, itemBind, minFactionId, minReputation, isDropped, expansionId
      FROM items as i
      LEFT OUTER JOIN item_name_locale as l
      ON i.id = l.id;`,
    (err, rows, fields) =>
      ItemUtil.getItems(err, rows as Item[], res, db));
};

/**
 * GET /api/item
 * List of API examples.
 */
export const postItems = (req: Request, res: Response) => {
  const db = mysql.createConnection(DATABASE_CREDENTIALS);
  db.query(`
    SELECT i.id, COALESCE(${ getLocale(req) }, i.name) as name, icon, itemLevel, itemClass, itemSubClass, quality, itemSpells, itemSource, buyPrice, sellPrice, itemBind, minFactionId, minReputation, isDropped, expansionId
    FROM items as i
    LEFT OUTER JOIN item_name_locale as l
    ON i.id = l.id
    WHERE timestamp > "${ req.body.timestamp }";`,
    (err, rows, fields) =>
      ItemUtil.getItems(err, rows as Item[], res, db));
};

export const getItemSources = (req: Request, res: Response) => {
  const db = mysql.createConnection(DATABASE_CREDENTIALS);
  db.query(`
      SELECT itemSource
      FROM items as i
      WHERE id = ${ req.params.id };`,
    (err, rows, fields) => {
      if (err || rows.length === 0) {
        res.send(new WoWHead());
      } else {
        res.send(JSON.parse(rows.itemSource));
      }
    });
};

export const updateItems = async (req: Request, res: Response) => {
  const db = mysql.createConnection(DATABASE_CREDENTIALS);
  db.query(
    `SELECT * FROM items WHERE timestamp < "2018-07-26" order by id desc limit 500;`, // timestamp < "2018-07-26";
    (err, rows, fields) => {
      db.end();
      ItemUtil.patchItems(rows, res, req);
    });
};

export const getItemsFromList = async (req: Request, res: Response) => {
  console.log('Yo');
  ItemUtil.getItemsToAdd(BFALists.itemIds, res, req);
};

export const getWoWDBItem = (req: Request, res: Response) =>
  ItemUtil.getWoWDB;
