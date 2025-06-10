// This file contains utility functions for parsing OPML and RSS feeds
import OPMLParser from 'opmlparser';
import Parser from 'rss-parser';

export async function parseOPML(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const opml = reader.result as string;
      const parser = new OPMLParser();
      const feeds: string[] = [];
      parser.on('feed', (feed: any) => {
        if (feed.xmlurl) feeds.push(feed.xmlurl);
      });
      parser.on('end', () => resolve(feeds));
      parser.on('error', reject);
      parser.end(opml);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export async function fetchFeed(url: string) {
  const parser = new Parser();
  return parser.parseURL(url);
}

export async function fetchAllFeeds(urls: string[]) {
  const parser = new Parser();
  return Promise.all(urls.map(url => parser.parseURL(url)));
}
