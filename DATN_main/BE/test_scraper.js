import * as cheerio from 'cheerio';
import fs from 'fs';

const html = fs.readFileSync('temp_html.html', 'utf8');
const $ = cheerio.load(html);

const items = [];

$('a').each((i, el) => {
  const href = $(el).attr('href') || '';
  if (href.includes('/cho-thue/')) {
     const title = $(el).find('h3').text().trim() || '';
     const priceText = $(el).text();
     if (title) {
        items.push({
           href,
           title,
           text: priceText.replace(/\s+/g, ' ').substring(0, 100)
        });
     }
  }
});
console.log(items.slice(0, 3));
