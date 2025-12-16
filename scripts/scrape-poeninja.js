#!/usr/bin/env node

/**
 * Scrapes poe.ninja builds data for off-meta builds
 * Extracts keystones and top build links, then updates poe1.js
 *
 * Usage: node scripts/scrape-poeninja.js
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Off-meta builds to scrape - maps to build IDs in poe1.js
const OFF_META_BUILDS = [
  { id: 'spectral-throw-deadeye', skill: 'Spectral Throw', class: 'Deadeye', type: 'skill' },
  { id: 'flicker-strike-raider', skill: 'Flicker Strike', class: 'Raider', type: 'skill' },
  { id: 'soulwrest-phantasms', item: 'Soulwrest', class: 'Necromancer', type: 'item' },
  { id: 'discharge-ignite-elementalist', skill: 'Discharge', class: 'Elementalist', type: 'skill' },
  { id: 'explosive-arrow-elementalist', skill: 'Explosive Arrow', class: 'Elementalist', type: 'skill' },
  { id: 'herald-of-thunder-autobomber', skill: 'Herald of Thunder', class: 'Elementalist', type: 'skill' },
  { id: 'arakaali-fang-occultist', item: 'Arakaalis Fang', class: 'Occultist', type: 'item' },
  { id: 'lightning-warp-miner', skill: 'Lightning Warp', class: 'Trickster', type: 'skill' },
  { id: 'cast-on-crit-ice-nova', skill: 'Ice Nova', class: 'Assassin', type: 'skill' },
  { id: 'blazing-salvo-inquisitor', skill: 'Blazing Salvo', class: 'Inquisitor', type: 'skill' },
  { id: 'wild-strike-berserker', skill: 'Wild Strike', class: 'Berserker', type: 'skill' },
  { id: 'infernal-blow-chieftain', skill: 'Infernal Blow', class: 'Chieftain', type: 'skill' },
];

function buildUrl(build, sort = 'dps') {
  const baseUrl = 'https://poe.ninja/poe1/builds/keepers';
  const params = new URLSearchParams();

  if (build.type === 'skill') {
    params.set('skills', build.skill);
  } else {
    params.set('item', build.item);
  }
  params.set('class', build.class);
  params.set('sort', sort);

  return `${baseUrl}?${params.toString()}`;
}

async function scrapeBuildData(page, build) {
  const url = buildUrl(build);
  console.log(`\nScraping: ${build.id}`);
  console.log(`URL: ${url}`);

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for build data to load
    await page.waitForSelector('table, [class*="build"], [class*="table"]', { timeout: 15000 });

    // Give extra time for dynamic content
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Extract keystones and build links from the page
    const data = await page.evaluate(() => {
      const results = {
        keystones: [],
        builds: [],
      };

      // Common keystones to look for
      const knownKeystones = [
        'Acrobatics', 'Phase Acrobatics', 'Arrow Dancing', 'Point Blank',
        'Chaos Inoculation', 'Ghost Reaver', 'Zealot\'s Oath', 'Pain Attunement',
        'Elemental Overload', 'Resolute Technique', 'Avatar of Fire', 'Ancestral Bond',
        'Necromantic Aegis', 'Blood Magic', 'Mortal Conviction', 'Divine Shield',
        'Iron Reflexes', 'Unwavering Stance', 'Iron Will', 'Mind Over Matter',
        'The Agnostic', 'Eldritch Battery', 'Ghost Dance', 'Wicked Ward',
        'Vaal Pact', 'Crimson Dance', 'Perfect Agony', 'Call to Arms',
        'Eternal Youth', 'Imbalanced Guard', 'Glancing Blows', 'Wind Dancer',
        'Supreme Ego', 'Hollow Palm Technique', 'The Impaler', 'Brutal Restraint',
        'Militant Faith', 'Elegant Hubris', 'Lethal Pride', 'Transcendence',
        'Ivory Tower', 'Corrupted Soul', 'Magebane', 'Precise Technique',
        'Iron Grip', 'Runebinder', 'Hex Master', 'Whispers of Doom',
        'Solipsism', 'Inner Conviction', 'Divine Flesh', 'Strength of Blood',
      ];

      // Look for keystone elements in images and divs
      const nodeElements = document.querySelectorAll('img[alt], div[title], span[title]');
      nodeElements.forEach(el => {
        const alt = el.getAttribute('alt') || el.getAttribute('title') || '';
        if (knownKeystones.some(ks => alt.includes(ks))) {
          const found = knownKeystones.find(ks => alt.includes(ks));
          if (found && !results.keystones.includes(found)) {
            results.keystones.push(found);
          }
        }
      });

      // Helper function to extract items from a build row
      function extractItems(row) {
        if (!row) return [];

        const items = [];
        const seenItems = new Set();

        // Known notable items to look for (expensive/build-defining)
        const notableItems = [
          'Mageblood', 'Headhunter', 'Mirror of Kalandra',
          'Ashes of the Stars', 'Crystallised Omniscience', 'Nimis',
          'Original Sin', 'Progenesis', 'Aegis Aurora',
          'Melding of the Flesh', 'Forbidden Flame', 'Forbidden Flesh',
          'Bottled Faith', 'Dying Sun', 'The Squire',
          'Badge of the Brotherhood', 'Aul\'s Uprising',
          'Heatshiver', 'Voices', 'Split Personality',
        ];

        // Look for item images in the row - poe.ninja shows items in equipment grid
        // Check all elements that might contain item info
        const allElements = row.querySelectorAll('*');
        allElements.forEach(el => {
          // Check various attributes that might contain item names
          const attrs = ['alt', 'title', 'data-tip', 'aria-label', 'data-name', 'data-item'];
          for (const attr of attrs) {
            const value = el.getAttribute(attr);
            if (value) {
              for (const notable of notableItems) {
                if (value.toLowerCase().includes(notable.toLowerCase()) && !seenItems.has(notable.toLowerCase())) {
                  seenItems.add(notable.toLowerCase());
                  items.push(notable);
                }
              }
            }
          }

          // Also check element's inner text for item names (for non-image elements)
          if (el.children.length === 0 && el.textContent) {
            const text = el.textContent.trim();
            for (const notable of notableItems) {
              if (text.toLowerCase().includes(notable.toLowerCase()) && !seenItems.has(notable.toLowerCase())) {
                seenItems.add(notable.toLowerCase());
                items.push(notable);
              }
            }
          }
        });

        // Also check the src attribute of images for item names (sometimes encoded in URL)
        const imgs = row.querySelectorAll('img[src]');
        imgs.forEach(img => {
          const src = img.getAttribute('src') || '';
          for (const notable of notableItems) {
            const urlSafe = notable.toLowerCase().replace(/[' ]/g, '');
            if (src.toLowerCase().includes(urlSafe) && !seenItems.has(notable.toLowerCase())) {
              seenItems.add(notable.toLowerCase());
              items.push(notable);
            }
          }
        });

        return items;
      }

      // Look for build links - these are usually in table rows with character/account info
      // poe.ninja build links have format like /poe1/builds/keepers/character/accountName/characterName
      const links = document.querySelectorAll('a[href*="/character/"], a[href*="/builds/"]');
      const seenUrls = new Set();

      links.forEach(link => {
        const href = link.getAttribute('href');
        if (!href || seenUrls.has(href)) return;

        // Look for character profile links
        if (href.includes('/character/')) {
          const fullUrl = href.startsWith('http') ? href : `https://poe.ninja${href}`;
          seenUrls.add(href);

          // Try to extract character name and stats from nearby elements
          const row = link.closest('tr') || link.closest('[class*="row"]') || link.parentElement?.parentElement;
          let charName = '';
          let dps = '';
          let life = '';
          let es = '';

          // Get character name from link text or nearby element
          charName = link.textContent?.trim() || '';

          // Extract items used by this build
          const items = extractItems(row);

          if (row) {
            // Look for all text content and find DPS patterns (like "10.5M", "500K", "1.2B")
            const spans = row.querySelectorAll('span, td, div');
            spans.forEach(span => {
              const text = span.textContent?.trim() || '';
              // Match DPS format: number followed by M, K, or B
              const dpsMatch = text.match(/^(\d+\.?\d*)\s*([MKB])$/i);
              if (dpsMatch && !dps) {
                dps = text.replace(/\s+/g, '').toUpperCase();
              }
              // Match life/es: 4-5 digit standalone numbers
              const numMatch = text.match(/^(\d{4,5})$/);
              if (numMatch) {
                const val = parseInt(numMatch[1]);
                if (val >= 2000 && val <= 12000 && !life) {
                  life = text;
                } else if (val >= 500 && val <= 25000 && life && !es) {
                  es = text;
                }
              }
            });
          }

          if (results.builds.length < 10) { // Get top 10 builds for client-side filtering
            results.builds.push({
              url: fullUrl,
              name: charName || 'View Build',
              dps: dps || null,
              life: life || null,
              es: es || null,
              items: items,
            });
          }
        }
      });

      return results;
    });

    console.log(`  Found ${data.keystones.length} keystones: ${data.keystones.join(', ') || 'none'}`);
    console.log(`  Found ${data.builds.length} build links`);

    // Log items found across builds
    const allItems = new Set();
    data.builds.forEach(b => b.items?.forEach(i => allItems.add(i)));
    if (allItems.size > 0) {
      console.log(`  Notable items found: ${[...allItems].join(', ')}`);
    }

    return {
      buildId: build.id,
      keystones: data.keystones,
      builds: data.builds,
      url: url,
    };

  } catch (error) {
    console.error(`  Error scraping ${build.id}: ${error.message}`);
    return {
      buildId: build.id,
      keystones: [],
      builds: [],
      error: error.message,
      url: url,
    };
  }
}

function updatePoe1File(results) {
  const poe1Path = path.join(__dirname, '..', 'src', 'data', 'games', 'poe1.js');
  console.log(`\nUpdating ${poe1Path}...`);

  let content = fs.readFileSync(poe1Path, 'utf-8');
  let updatedCount = 0;

  // Process results in reverse order to avoid index shift issues
  const sortedResults = [...results].reverse();

  for (const result of sortedResults) {
    // Skip if no data to add
    if (result.keystones.length === 0 && result.builds.length === 0) {
      console.log(`  Skipping ${result.buildId}: no data`);
      continue;
    }

    // Find the build by its ID - escape special chars in buildId for regex
    const escapedId = result.buildId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const buildIdPattern = new RegExp(`id:\\s*['"]${escapedId}['"]`);
    const match = content.match(buildIdPattern);

    if (!match) {
      console.log(`  Could not find build: ${result.buildId}`);
      continue;
    }

    const buildStart = match.index;
    const afterBuild = content.substring(buildStart);

    // Find plannerUrl line for this build (where we'll insert before)
    const plannerUrlPattern = /plannerUrl:\s*null,/;
    const plannerUrlMatch = afterBuild.match(plannerUrlPattern);

    if (!plannerUrlMatch) {
      console.log(`  Could not find plannerUrl for: ${result.buildId}`);
      continue;
    }

    // Calculate absolute positions
    const plannerUrlAbsPos = buildStart + plannerUrlMatch.index;

    // Get the section between buildId and plannerUrl
    const section = content.substring(buildStart, plannerUrlAbsPos);

    // Remove all existing keystones and topBuilds lines from the section
    let cleanedSection = section
      .replace(/keystones:\s*\[[^\]]*\],?\s*\n?\s*/g, '')
      .replace(/topBuilds:\s*\[[^\]]*\],?\s*\n?\s*/g, '');

    // Build the new data strings
    const keystonesStr = result.keystones.length > 0
      ? `keystones: ${JSON.stringify(result.keystones)},\n          `
      : '';

    const topBuildsStr = result.builds.length > 0
      ? `topBuilds: ${JSON.stringify(result.builds)},\n          `
      : '';

    // Create the updated section with new data before plannerUrl position
    const newSection = cleanedSection + keystonesStr + topBuildsStr;

    // Replace the old section with the new one
    content = content.substring(0, buildStart) + newSection + content.substring(plannerUrlAbsPos);

    console.log(`  Updated: ${result.buildId} (${result.keystones.length} keystones, ${result.builds.length} builds)`);
    updatedCount++;
  }

  fs.writeFileSync(poe1Path, content);
  console.log(`\nFile updated! ${updatedCount} builds modified.`);
}

async function main() {
  console.log('=== poe.ninja Build Scraper ===\n');
  console.log('Starting browser...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  const results = [];

  for (const build of OFF_META_BUILDS) {
    const data = await scrapeBuildData(page, build);
    results.push(data);

    // Be nice to the server
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  await browser.close();

  // Save raw results
  const outputPath = path.join(__dirname, 'scraped-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nSaved results to: ${outputPath}`);

  // Update poe1.js with keystones and build links
  updatePoe1File(results);

  // Print summary
  console.log('\n=== Summary ===');
  results.forEach(r => {
    console.log(`${r.buildId}:`);
    console.log(`  Keystones: ${r.keystones.length > 0 ? r.keystones.slice(0, 3).join(', ') + (r.keystones.length > 3 ? '...' : '') : 'none'}`);
    console.log(`  Builds: ${r.builds.length}`);
  });
}

main().catch(console.error);
