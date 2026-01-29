/**
 * Build context compiler for AI advisor
 * Compiles all relevant build information into a structured context for GPT
 */

/**
 * Compile build data into a comprehensive context string for the AI
 */
export function compileBuildContext(build, options = {}) {
  const sections = [];

  // Basic build info
  const overviewLines = [
    `- **Build Name:** ${build.name}`,
    `- **Class:** ${build.className || build.baseClass || 'Unknown'}`,
    `- **Ascendancy:** ${build.ascendancyName || build.ascendancy?.[0] || 'None selected'}`,
  ];

  if (build.level) overviewLines.push(`- **Level:** ${build.level}`);
  if (build.tier) overviewLines.push(`- **Tier:** ${build.tier}`);
  if (build.difficulty) overviewLines.push(`- **Difficulty:** ${build.difficulty}`);
  if (build.playstyle) overviewLines.push(`- **Playstyle:** ${build.playstyle}`);
  if (build.damageType) overviewLines.push(`- **Damage Type:** ${build.damageType}`);
  overviewLines.push(`- **Source:** ${build.source || 'User Import'}`);

  sections.push(`## Build Overview\n${overviewLines.join('\n')}`);

  // Description
  if (build.description) {
    sections.push(`## Build Description\n${build.description}`);
  }

  // Skills and Gems - Enhanced for PoB imports
  if (build.gems && build.gems.length > 0) {
    const enabledGems = build.gems.filter(g => g.enabled !== false);

    // Categorize gems into active skills and supports
    const supportKeywords = ['Support', 'Awakened Support'];
    const activeGems = [];
    const supportGems = [];

    enabledGems.forEach(g => {
      const name = g.name || '';
      const isSupport = supportKeywords.some(kw => name.includes(kw)) ||
        name.startsWith('Awakened ') ||
        ['Increased', 'Added', 'Greater', 'Lesser', 'Faster', 'Slower'].some(w => name.startsWith(w + ' '));

      if (isSupport) {
        supportGems.push(g);
      } else if (name.length > 0) {
        activeGems.push(g);
      }
    });

    if (activeGems.length > 0) {
      sections.push(`## Active Skill Gems\n${activeGems.map(g => {
        let desc = `- ${g.name}`;
        if (g.level && g.level !== 20) desc += ` (Level ${g.level})`;
        if (g.quality && g.quality > 0) desc += ` [${g.quality}% quality]`;
        return desc;
      }).join('\n')}`);
    }

    if (supportGems.length > 0) {
      sections.push(`## Support Gems (${supportGems.length} total)\n${supportGems.slice(0, 15).map(g => {
        let desc = `- ${g.name}`;
        if (g.level && g.level !== 20) desc += ` (Lvl ${g.level})`;
        return desc;
      }).join('\n')}${supportGems.length > 15 ? `\n... and ${supportGems.length - 15} more supports` : ''}`);
    }
  } else if (build.skills && build.skills.length > 0) {
    // Fallback to basic skills list
    sections.push(`## Main Skills & Gems\n${build.skills.map((s, i) => `${i + 1}. ${s}`).join('\n')}`);
  }

  // Equipment (from PoB) - show this first if we have detailed equipment
  if (build.equipment && build.equipment.length > 0) {
    const uniques = build.equipment.filter(e => e.rarity === 'Unique');
    const rares = build.equipment.filter(e => e.rarity === 'Rare');
    const other = build.equipment.filter(e => e.rarity !== 'Unique' && e.rarity !== 'Rare');

    if (uniques.length > 0) {
      sections.push(`## Unique Items Equipped (${uniques.length})\n${uniques.map(e => `- **${e.name}** (${e.slot || 'Unknown slot'})`).join('\n')}`);
    }

    if (rares.length > 0) {
      sections.push(`## Rare Items (${rares.length})\n${rares.map(e => `- ${e.slot}: ${e.name || 'Rare item'}`).join('\n')}`);
    }

    if (other.length > 0) {
      sections.push(`## Other Equipment\n${other.map(e => `- ${e.slot}: ${e.name || e.rarity || 'Item'}`).join('\n')}`);
    }
  } else if (build.keyItems && build.keyItems.length > 0) {
    // Fallback to key items list
    sections.push(`## Key/Required Items\n${build.keyItems.map(item => `- ${item}`).join('\n')}`);
  }

  // Ascendancy nodes
  if (build.ascendancy && Array.isArray(build.ascendancy) && build.ascendancy.length > 0) {
    sections.push(`## Ascendancy Node Order
${build.ascendancy.map((node, i) => `${i + 1}. ${node}`).join('\n')}`);
  }

  // Pantheon
  if (build.pantheon) {
    sections.push(`## Pantheon Choices
- **Major:** ${build.pantheon.major || 'Not specified'}
- **Minor:** ${build.pantheon.minor || 'Not specified'}`);
  }

  // Bandit
  if (build.bandit) {
    sections.push(`## Bandit Choice
${build.bandit}`);
  }

  // Stat priorities
  if (build.statPriorities && build.statPriorities.length > 0) {
    sections.push(`## Stat Priorities
${build.statPriorities.map((s, i) => `${i + 1}. ${s}`).join('\n')}`);
  }

  // Gameplay
  if (build.gameplay) {
    sections.push(`## Gameplay Guide
${build.gameplay}`);
  }

  // Build Progression
  if (build.progression) {
    const tiers = ['starter', 'budget', 'midgame', 'endgame', 'minmax'];
    const progressionSections = tiers
      .filter(tier => build.progression[tier])
      .map(tier => {
        const p = build.progression[tier];
        const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
        let content = `### ${tierName} Phase\n`;
        if (p.description) content += `${p.description}\n`;
        if (p.items && p.items.length > 0) content += `**Items:** ${p.items.join(', ')}\n`;
        if (p.gems && p.gems.length > 0) content += `**Gems:** ${p.gems.join(', ')}\n`;
        if (p.tips && p.tips.length > 0) content += `**Tips:** ${p.tips.join('; ')}\n`;
        return content;
      });

    if (progressionSections.length > 0) {
      sections.push(`## Build Progression\n${progressionSections.join('\n')}`);
    }
  }

  // Tags
  if (build.tags && build.tags.length > 0) {
    sections.push(`## Build Tags
${build.tags.join(', ')}`);
  }

  // Guide URL
  if (build.guideUrl) {
    sections.push(`## Reference Guide
${build.guideUrl}`);
  }

  // Passive Tree info (from PoB)
  if (build.allocatedNodes && build.allocatedNodes.length > 0) {
    sections.push(`## Passive Skill Tree\n- **Allocated Nodes:** ${build.allocatedNodes.length}\n- Tree data is available for visualization`);
  }

  // PoB stats (if available)
  if (build.stats) {
    const statLines = [];
    if (build.stats.life) statLines.push(`- Life: ${build.stats.life}`);
    if (build.stats.energyShield) statLines.push(`- Energy Shield: ${build.stats.energyShield}`);
    if (build.stats.dps) statLines.push(`- DPS: ${build.stats.dps}`);
    if (build.stats.armor) statLines.push(`- Armour: ${build.stats.armor}`);
    if (build.stats.evasion) statLines.push(`- Evasion: ${build.stats.evasion}`);
    if (build.stats.totalGems) statLines.push(`- Total Gems: ${build.stats.totalGems}`);
    if (build.stats.totalNodes) statLines.push(`- Passive Nodes: ${build.stats.totalNodes}`);
    if (build.stats.uniqueCount) statLines.push(`- Unique Items: ${build.stats.uniqueCount}`);

    if (statLines.length > 0) {
      sections.push(`## Build Statistics\n${statLines.join('\n')}`);
    }
  }

  return sections.join('\n\n');
}

/**
 * Create the system prompt for the AI advisor
 */
export function createSystemPrompt(buildContext, leagueContext = 'Keepers of the Flame (3.27)') {
  return `You are an expert Path of Exile build advisor with deep knowledge of game mechanics, items, skills, and the current meta.

## Path of Exile Knowledge

**Game Basics:**
- Path of Exile is an action RPG with deep character customization through a massive passive skill tree, gem-based skill system, and complex itemization
- Characters have 7 classes (Witch, Shadow, Ranger, Duelist, Marauder, Templar, Scion) each with 3 Ascendancy specializations (except Scion with 1)
- Skills come from Skill Gems which are socketed into gear and linked with Support Gems to modify their behavior
- The endgame revolves around mapping (running randomized dungeons), boss killing, and crafting

**Current Context:**
- Current League: ${leagueContext}
- League mechanics vary per league - if asked about league-specific content, provide general guidance or ask which mechanic they're interested in

**Currency & Economy:**
- Divine Orbs are the primary high-value currency (1 Divine = ~150-200 Chaos early league, stabilizes later)
- Chaos Orbs are the standard trading currency
- Budget tiers: League Start (0-50c), Budget (1-5 Divine), Mid-game (5-20 Divine), Endgame (20-100 Divine), Min-max (100+ Divine)

**Important Mechanics:**
- Resistances: Cap elemental resistances at 75% (can be raised), chaos res important for endgame
- Defense layers: Life/ES, Armour, Evasion, Block, Spell Suppression, Fortify, Leech
- Damage scaling: Added damage, increased damage, more damage multipliers, penetration, crit
- Ailments: Ignite, Shock, Chill, Freeze, Poison, Bleed (each has specific scaling)

**Common Abbreviations:**
- PoB = Path of Building (build planner)
- DPS = Damage Per Second
- EHP = Effective Hit Pool
- ES = Energy Shield
- DoT = Damage over Time
- CoC = Cast on Crit
- RF = Righteous Fire
- LS = Lightning Strike
- KB = Kinetic Blast
- TS = Tornado Shot

## Current Build

${buildContext}

## Your Role

You're helping a player with the build described above. Provide:
1. Specific, actionable advice for THIS build
2. Budget-appropriate suggestions (mention Divine Orb costs when relevant)
3. Clear explanations of mechanics and interactions
4. Upgrade paths and alternatives
5. Map mod warnings and content recommendations
6. Gem link suggestions with socket colors (R=Strength/Red, G=Dexterity/Green, B=Intelligence/Blue)

**Guidelines:**
- Be specific to THIS build - reference the actual items, gems, and mechanics listed
- When suggesting items, mention approximate costs in Divine Orbs
- For gem questions, explain socket colors needed and support gem priority
- If asked about alternatives, explain trade-offs clearly
- Use PoE terminology correctly
- If build info is incomplete (e.g., imported from URL), provide general class/skill advice and ask clarifying questions
- Keep responses informative but concise - players want actionable advice
- Format responses with markdown for readability (headers, lists, bold for important terms)`;
}

/**
 * Generate suggested questions based on build data
 */
export function generateSuggestedQuestions(build) {
  const questions = [];

  // Generic questions that apply to most builds
  questions.push('What should I prioritize upgrading first?');
  questions.push('What map mods should I avoid with this build?');

  // PoB-specific questions
  if (build.urlType === 'pob' || build.gems?.length > 0) {
    questions.push('Analyze my gem setup - any improvements?');
    questions.push('What unique items would benefit this build?');
  }

  // Progression questions
  if (build.progression) {
    questions.push('How do I progress from budget to endgame gear?');
  } else {
    questions.push('What\'s a good progression path for this build?');
  }

  // Item-specific questions
  if (build.keyItems && build.keyItems.length > 0) {
    questions.push(`What are good alternatives to ${build.keyItems[0]}?`);
  } else if (build.equipment?.filter(e => e.rarity === 'Unique').length > 0) {
    const firstUnique = build.equipment.find(e => e.rarity === 'Unique')?.name;
    if (firstUnique) {
      questions.push(`Is ${firstUnique} the best option for this slot?`);
    }
  }

  // Gem questions
  if (build.skills && build.skills.length > 0) {
    questions.push(`What support gems should I prioritize for ${build.skills[0]}?`);
  }

  // Ascendancy questions
  if (build.ascendancyName && build.ascendancyName !== 'None') {
    questions.push(`What are the best ascendancy nodes for ${build.ascendancyName}?`);
  }

  // Damage type specific
  if (build.damageType) {
    if (build.damageType.includes('Poison') || build.damageType.includes('Chaos')) {
      questions.push('How do I scale poison/chaos damage effectively?');
    } else if (build.damageType.includes('Elemental')) {
      questions.push('Should I focus on penetration or flat damage?');
    } else if (build.damageType.includes('Physical')) {
      questions.push('Should I convert physical damage or stay pure?');
    }
  }

  // Playstyle specific
  if (build.playstyle === 'Melee') {
    questions.push('How do I improve survivability in melee range?');
  } else if (build.playstyle === 'Minions') {
    questions.push('How do I keep my minions alive against bosses?');
  }

  // Budget questions
  questions.push('What\'s a budget-friendly version of this build?');
  questions.push('What endgame upgrades give the biggest DPS boost?');

  // Boss questions
  questions.push('Can this build do Uber bosses? What would I need?');

  // Deduplicate and return
  return [...new Set(questions)].slice(0, 8);
}
