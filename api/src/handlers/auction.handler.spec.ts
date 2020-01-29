import {AuctionHandler} from './auction.handler';
import {AuctionUpdateLog} from '../models/auction/auction-update-log.model';
import {DateUtil} from '@ukon1990/js-utilities';
import {S3Handler} from './s3.handler';
import {DatabaseUtil} from '../utils/database.util';
import {environment} from '../../../client/src/environments/environment';

describe('AuctionHandler', () => {
  beforeEach(() => environment.test = false);
  afterEach(() => environment.test = true);

  describe('getUpdateLog', () => {
    it('Can get the last 3 hours', async () => {
      const log: AuctionUpdateLog = await new AuctionHandler().getUpdateLog(69, 3);
      expect(log.entries.length).toBeLessThanOrEqual(3);
      expect(log.entries.length).toBeGreaterThanOrEqual(2);
      expect(log.minTime).toBeTruthy();
      expect(log.avgTime).toBeTruthy();
      expect(log.maxTime).toBeTruthy();
    });

    it('Can get the last 3 hours', async () => {
      const log: AuctionUpdateLog = await new AuctionHandler().getUpdateLog(69, 2);
      expect(log.entries.length).toBeLessThanOrEqual(2);
      expect(log.entries.length).toBeGreaterThanOrEqual(1);
      expect(log.minTime).toBe(70);
      expect(log.avgTime).toBe(70);
      expect(log.maxTime).toBe(70);
    });
  });

  it('Adding stuff to db', async () => {
    jest.setTimeout(1000000000);
    const s3 = new S3Handler(),
      conn = new DatabaseUtil(false),
      region = 'eu',
      bucket = 'wah-data-' + region,
      id = '1';
    const list = await s3.list(bucket, 'auctions/eu/' + id)
      .catch(console.log);

    /**
     * {
          Key: 'classic/recipes/de_DE.json.gz',
          LastModified: 2020-01-11T11:15:05.000Z,
          ETag: '"a840bc3149a1177800d1da01185990f2"',
          Size: 30861,
          StorageClass: 'STANDARD'
     *   }
     */
    const startDay = +new Date('1/1/2020'),
      endDay = +new Date('1/29/2020'),
      filteredFiles = list.Contents.filter(file =>
        +new Date(file.LastModified) >= startDay &&
        +new Date(file.LastModified) <= endDay);
    console.log(`Starting to process: ${filteredFiles.length} / ${list.Contents.length}`);

    let processed = 0;
    const promises = [];
    for (const file of filteredFiles) {
      promises.push(new Promise((resolve) => {
        const splitted = file.Key.split('/');
        const [auctions, region1, ahId, fileName] = splitted;
        new AuctionHandler().processAuctions(region,
          {
            bucket: {name: bucket},
            object: {key: file.Key, size: 0},
            s3SchemaVersion: '',
            configurationId: ''
          }, ahId,
          fileName.replace('.json.gz', ''),
          conn)
          .then(() => {
            processed++;
            console.log(`Processed count: ${processed} of ${filteredFiles.length}`);
            resolve();
          })
          .catch((error) => {
            processed++;
            console.log(`Processed count: ${processed} of ${filteredFiles.length}`);
            console.error(error);
            resolve();
          });
      }));
    }

    await Promise.all(promises)
      .catch(console.error);

    conn.end();
    expect(1).toBe(1);
  });
});
