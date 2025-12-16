#!/usr/bin/env node

/**
 * Merges poe.ninja builds into the existing poe1.js structure
 * Keeps existing Maxroll builds and adds new poe.ninja builds
 *
 * Usage: node scripts/merge-poe1-builds.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the generated poe.ninja builds JSON
const ninjaBuildsPath = path.join(__dirname, 'poe1-ninja-builds.json');
const ninjaBuilds = JSON.parse(fs.readFileSync(ninjaBuildsPath, 'utf-8'));

// Create a map of class -> skills
const ninjaBuildsByClass = {};
ninjaBuilds.forEach(cls => {
  ninjaBuildsByClass[cls.id] = cls.skills;
});

// Read current poe1.js
const poe1Path = path.join(__dirname, '..', 'src', 'data', 'games', 'poe1.js');
let poe1Content = fs.readFileSync(poe1Path, 'utf-8');

// For each ascendancy, find existing builds and add new ones
Object.entries(ninjaBuildsByClass).forEach(([classId, ninjaSkills]) => {
  console.log(`Processing ${classId}: ${ninjaSkills.length} poe.ninja builds`);

  // Find the class section in poe1.js
  const classPattern = new RegExp(`id:\\s*['"]${classId}['"]`);
  const match = poe1Content.match(classPattern);

  if (!match) {
    console.log(`  Class ${classId} not found in poe1.js - skipping`);
    return;
  }

  // Find the skills array for this class
  const classStart = match.index;
  const afterClass = poe1Content.substring(classStart);

  // Find the skills: [ for this class
  const skillsMatch = afterClass.match(/skills:\s*\[/);
  if (!skillsMatch) {
    console.log(`  Could not find skills array for ${classId}`);
    return;
  }

  const skillsStart = classStart + skillsMatch.index + skillsMatch[0].length;

  // Find existing skill IDs to avoid duplicates
  const existingIds = new Set();
  const existingIdPattern = /id:\s*['"]([^'"]+)['"]/g;
  let idMatch;

  // Look for existing skills in this class (up to next class or end)
  const classSection = afterClass.substring(0, afterClass.indexOf('\n    },\n    {') || afterClass.length);
  while ((idMatch = existingIdPattern.exec(classSection)) !== null) {
    existingIds.add(idMatch[1]);
  }

  // Filter out duplicates
  const newSkills = ninjaSkills.filter(skill => !existingIds.has(skill.id));

  if (newSkills.length === 0) {
    console.log(`  No new skills to add (all ${ninjaSkills.length} already exist)`);
    return;
  }

  console.log(`  Adding ${newSkills.length} new skills (${ninjaSkills.length - newSkills.length} duplicates skipped)`);

  // Format the new skills
  const skillsStr = newSkills.map(skill => `
        {
          id: '${skill.id}',
          name: '${skill.name}',
          tier: '${skill.tier}',
          description: '${skill.description.replace(/'/g, "\\'")}',
          playstyle: '${skill.playstyle}',
          damageType: '${skill.damageType}',
          difficulty: '${skill.difficulty}',
          popularity: ${skill.popularity},
          tags: ${JSON.stringify(skill.tags)},
          source: 'poe.ninja',
          league: '${skill.league}',
          guideUrl: '${skill.guideUrl}',
          plannerUrl: null,
        },`).join('');

  // Insert after the first skill (before the closing bracket or next skill)
  // We'll find the position after the opening [ and insert there
  poe1Content = poe1Content.substring(0, skillsStart) + skillsStr + poe1Content.substring(skillsStart);
});

// Write the merged content
fs.writeFileSync(poe1Path, poe1Content);
console.log(`\nMerged builds saved to: ${poe1Path}`);

// Count total builds
const totalBuildsMatch = poe1Content.match(/id:\s*['"]/g);
console.log(`Total builds in file: ~${totalBuildsMatch ? totalBuildsMatch.length / 2 : 'unknown'}`);
