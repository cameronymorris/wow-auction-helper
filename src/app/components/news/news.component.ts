import { Component, OnInit, AfterViewInit } from '@angular/core';

declare function require(moduleName: string): any;
const version = require('../../../../package.json').version;
declare var $;
@Component({
  selector: 'wah-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss']
})
export class NewsComponent implements AfterViewInit {
  currentDate: string;
  showNews: boolean;

  constructor() {
    this.currentDate = new Date().toLocaleDateString();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      try {
        console.log(localStorage['timestamp_news'], version);
        if (localStorage['realm'] &&
          localStorage['timestamp_news'] !== version) {
            this.showNews = true;
        }
      } catch (e) {
        console.log(e);
      }
    }, 1000);
  }

  close(): void {
    localStorage['timestamp_news'] = version;
    this.showNews = false;
  }
}
