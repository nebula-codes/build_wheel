#!/usr/bin/env node

/**
 * Scrapes poe.ninja for popular builds across all classes
 * Creates a comprehensive list of 100+ skill/class combinations
 *
 * Usage: node scripts/scrape-popular-builds.js
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// All PoE 1 ascendancy classes
const ASCENDANCIES = [
  // Ranger
  { class: 'Deadeye', baseClass: 'Ranger', color: '#2ecc71' },
  { class: 'Pathfinder', baseClass: 'Ranger', color: '#27ae60' },
  { class: 'Raider', baseClass: 'Ranger', color: '#1abc9c' },
  // Witch
  { class: 'Necromancer', baseClass: 'Witch', color: '#9b59b6' },
  { class: 'Occultist', baseClass: 'Witch', color: '#8e44ad' },
  { class: 'Elementalist', baseClass: 'Witch', color: '#e74c3c' },
  // Duelist
  { class: 'Slayer', baseClass: 'Duelist', color: '#e74c3c' },
  { class: 'Gladiator', baseClass: 'Duelist', color: '#c0392b' },
  { class: 'Champion', baseClass: 'Duelist', color: '#d35400' },
  // Marauder
  { class: 'Juggernaut', baseClass: 'Marauder', color: '#e67e22' },
  { class: 'Berserker', baseClass: 'Marauder', color: '#d35400' },
  { class: 'Chieftain', baseClass: 'Marauder', color: '#c0392b' },
  // Shadow
  { class: 'Assassin', baseClass: 'Shadow', color: '#2c3e50' },
  { class: 'Trickster', baseClass: 'Shadow', color: '#34495e' },
  { class: 'Saboteur', baseClass: 'Shadow', color: '#7f8c8d' },
  // Templar
  { class: 'Inquisitor', baseClass: 'Templar', color: '#3498db' },
  { class: 'Hierophant', baseClass: 'Templar', color: '#2980b9' },
  { class: 'Guardian', baseClass: 'Templar', color: '#1abc9c' },
  // Scion
  { class: 'Ascendant', baseClass: 'Scion', color: '#95a5a6' },
];

async function scrapeClassBuilds(page, ascendancy) {
  const url = `https://poe.ninja/poe1/builds/keepers?class=${ascendancy.class}`;
  console.log(`\nScraping: ${ascendancy.class}`);
  console.log(`URL: ${url}`);

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('table, [class*="build"], [class*="table"]', { timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Extract top skills for this class
    const data = await page.evaluate(() => {
      const skills = [];

      // Look for skill gem entries - they're usually displayed with percentages
      // poe.ninja shows skills in a list/table format with usage %
      const skillElements = document.querySelectorAll('[class*="skill"], [class*="gem"], a[href*="skills="]');

      skillElements.forEach(el => {
        const text = el.textContent?.trim() || '';
        const href = el.getAttribute('href') || '';

        // Extract skill name from href or text
        let skillName = '';
        if (href.includes('skills=')) {
          const match = href.match(/skills=([^&]+)/);
          if (match) {
            skillName = decodeURIComponent(match[1].replace(/\+/g, ' '));
          }
        }

        if (!skillName && text && text.length > 2 && text.length < 50) {
          skillName = text;
        }

        // Look for percentage nearby
        const parent = el.closest('tr') || el.closest('div') || el.parentElement;
        let percentage = null;
        if (parent) {
          const percentMatch = parent.textContent?.match(/(\d+\.?\d*)%/);
          if (percentMatch) {
            percentage = parseFloat(percentMatch[1]);
          }
        }

        if (skillName && !skills.find(s => s.name === skillName)) {
          skills.push({
            name: skillName,
            percentage: percentage,
          });
        }
      });

      return { skills: skills.slice(0, 15) }; // Top 15 skills per class
    });

    console.log(`  Found ${data.skills.length} skills`);
    return {
      ...ascendancy,
      skills: data.skills,
    };

  } catch (error) {
    console.error(`  Error: ${error.message}`);
    return {
      ...ascendancy,
      skills: [],
      error: error.message,
    };
  }
}

async function main() {
  console.log('=== poe.ninja Popular Builds Scraper ===\n');
  console.log('Starting browser...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  const results = [];

  for (const ascendancy of ASCENDANCIES) {
    const data = await scrapeClassBuilds(page, ascendancy);
    results.push(data);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  await browser.close();

  // Save raw results
  const outputPath = path.join(__dirname, 'popular-builds.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nSaved to: ${outputPath}`);

  // Print summary
  console.log('\n=== Summary ===');
  let totalSkills = 0;
  results.forEach(r => {
    console.log(`${r.class}: ${r.skills.length} skills`);
    totalSkills += r.skills.length;
  });
  console.log(`\nTotal: ${totalSkills} skill/class combinations`);
}

main().catch(console.error);
