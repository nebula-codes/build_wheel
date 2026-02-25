#!/usr/bin/env node

/**
 * Applies the scraped data from scraped-data.json to poe1.js
 * Use this after scrape-poeninja.js has been run to re-apply data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dryRun = process.argv.includes('--dry-run');

function updatePoe1File(results) {
  const poe1Path = path.join(__dirname, '..', 'src', 'data', 'games', 'poe1.js');
  console.log(`\nUpdating ${poe1Path}...${dryRun ? ' (DRY RUN)' : ''}`);

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

  if (dryRun) {
    console.log(`\n[DRY RUN] Would update ${updatedCount} builds. No files changed.`);
    return;
  }

  // Create backup before writing
  const bakPath = poe1Path + '.bak';
  fs.copyFileSync(poe1Path, bakPath);
  console.log(`  Backup created: ${bakPath}`);

  fs.writeFileSync(poe1Path, content);

  // Verify the output is valid JS by attempting a dynamic import check
  try {
    // Basic syntax check: ensure the file is parseable
    new Function(content.replace(/^export /gm, '').replace(/^import .*/gm, ''));
    console.log(`  Syntax verification passed.`);
  } catch (err) {
    console.error(`  WARNING: Output file may have syntax errors: ${err.message}`);
    console.error(`  Backup available at: ${bakPath}`);
  }

  console.log(`\nFile updated! ${updatedCount} builds modified.`);
}

// Read scraped data
const scrapedDataPath = path.join(__dirname, 'scraped-data.json');
const results = JSON.parse(fs.readFileSync(scrapedDataPath, 'utf-8'));

console.log(`Loaded ${results.length} build results from scraped-data.json`);
updatePoe1File(results);
