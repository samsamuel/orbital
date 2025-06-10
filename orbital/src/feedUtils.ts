// This file contains utility functions for parsing OPML and RSS feeds in the browser

// Parse OPML file and extract feed URLs
export async function parseOPML(file: File): Promise<string[]> {
  const text = await file.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, "text/xml");
  const outlines = Array.from(xml.querySelectorAll("outline[xmlUrl], outline[xmlurl]"));
  return outlines
    .map(outline => outline.getAttribute("xmlUrl") || outline.getAttribute("xmlurl"))
    .filter((url): url is string => !!url);
}

// Fetch and parse RSS feed from a URL using the backend proxy
export async function fetchFeed(url: string) {
  const res = await fetch(`/fetch-feed?url=${encodeURIComponent(url)}`);
  const text = await res.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, "application/xml");
  // Basic RSS parsing (title, link, items)
  const channel = xml.querySelector("channel");
  if (!channel) throw new Error("Invalid RSS feed");
  const title = channel.querySelector("title")?.textContent || "";
  const link = channel.querySelector("link")?.textContent || "";
  const items = Array.from(channel.querySelectorAll("item")).map(item => ({
    title: item.querySelector("title")?.textContent || "",
    link: item.querySelector("link")?.textContent || "",
    description: item.querySelector("description")?.textContent || "",
    pubDate: item.querySelector("pubDate")?.textContent || "",
    guid: item.querySelector("guid")?.textContent || "",
  }));
  return { title, link, items };
}

// Upgrade http URLs to https
function upgradeToHttps(url: string) {
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
}

// Fetch and parse all feeds from a list of URLs, auto-upgrading http to https
export async function fetchAllFeeds(urls: string[]) {
  const httpsUrls = urls.map(upgradeToHttps).filter(url => url.startsWith('https://'));
  const results = await Promise.allSettled(httpsUrls.map(fetchFeed));
  // Only return feeds that were fulfilled
  return results
    .filter(r => r.status === 'fulfilled' && r.value && r.value.items && r.value.items.length > 0)
    .map(r => (r as PromiseFulfilledResult<any>).value);
}
