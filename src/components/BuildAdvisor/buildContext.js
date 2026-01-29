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
  sections.push(`## Build Overview
- **Build Name:** ${build.name}
- **Class:** ${build.className || build.baseClass || 'Unknown'}
- **Ascendancy:** ${build.ascendancyName || build.ascendancy?.[0] || 'None selected'}
- **Tier:** ${build.tier || 'Unrated'}
- **Difficulty:** ${build.difficulty || 'Unknown'}
- **Playstyle:** ${build.playstyle || 'Unknown'}
- **Damage Type:** ${build.damageType || 'Unknown'}
- **Source:** ${build.source || 'User Import'}`);

  // Description
  if (build.description) {
    sections.push(`## Build Description
${build.description}`);
  }

  // Skills and Gems
  if (build.skills && build.skills.length > 0) {
    sections.push(`## Main Skills & Gems
${build.skills.map((s, i) => `${i + 1}. ${s}`).join('\n')}`);
  }

  // Gem links (from PoB)
  if (build.gems && build.gems.length > 0) {
    const enabledGems = build.gems.filter(g => g.enabled !== false);
    const mainSkills = enabledGems.filter(g => g.isMainSkill);
    const supportGems = enabledGems.filter(g => !g.isMainSkill);

    if (mainSkills.length > 0) {
      sections.push(`## Main Skill Gems
${mainSkills.map(g => `- ${g.name}${g.level ? ` (Level ${g.level})` : ''}`).join('\n')}`);
    }

    if (supportGems.length > 0) {
      sections.push(`## Support Gems
${supportGems.slice(0, 20).map(g => `- ${g.name}`).join('\n')}${supportGems.length > 20 ? `\n... and ${supportGems.length - 20} more` : ''}`);
    }
  }

  // Key Items
  if (build.keyItems && build.keyItems.length > 0) {
    sections.push(`## Key/Required Items
${build.keyItems.map(item => `- ${item}`).join('\n')}`);
  }

  // Equipment (from PoB)
  if (build.equipment && build.equipment.length > 0) {
    const uniques = build.equipment.filter(e => e.rarity === 'Unique');
    const rares = build.equipment.filter(e => e.rarity === 'Rare');

    if (uniques.length > 0) {
      sections.push(`## Unique Items Equipped
${uniques.map(e => `- ${e.name} (${e.slot || 'Unknown slot'})`).join('\n')}`);
    }

    if (rares.length > 0) {
      sections.push(`## Rare Items
${rares.map(e => `- ${e.slot}: ${e.name || 'Rare'}`).join('\n')}`);
    }
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

  // PoB stats (if available)
  if (build.stats) {
    const statLines = [];
    if (build.stats.life) statLines.push(`- Life: ${build.stats.life}`);
    if (build.stats.energyShield) statLines.push(`- Energy Shield: ${build.stats.energyShield}`);
    if (build.stats.dps) statLines.push(`- DPS: ${build.stats.dps}`);
    if (build.stats.armor) statLines.push(`- Armour: ${build.stats.armor}`);
    if (build.stats.evasion) statLines.push(`- Evasion: ${build.stats.evasion}`);

    if (statLines.length > 0) {
      sections.push(`## Character Stats\n${statLines.join('\n')}`);
    }
  }

  return sections.join('\n\n');
}

/**
 * Create the system prompt for the AI advisor
 */
export function createSystemPrompt(buildContext) {
  return `You are an expert Path of Exile build advisor with deep knowledge of game mechanics, items, skills, and the current meta. You're helping a player with the following build:

${buildContext}

Your role is to:
1. Answer questions about this specific build
2. Suggest upgrades and item alternatives at different budget levels
3. Explain mechanics and interactions relevant to the build
4. Help with leveling strategies and gem progression
5. Identify potential weaknesses and how to address them
6. Suggest map mods to avoid and content the build excels at
7. Provide tips for improving DPS or survivability

Guidelines:
- Be specific to THIS build - reference the actual items, gems, and mechanics listed above
- When suggesting items, consider budget constraints (mention approximate costs in Divine Orbs when relevant)
- For gem questions, explain socket colors needed and support gem interactions
- If asked about alternatives, explain trade-offs
- Use PoE terminology correctly (e.g., "map juice", "league start", "endgame", etc.)
- If the build info is incomplete, acknowledge what's missing and give general advice
- Keep responses concise but informative - players want actionable advice

Current league context: Assume the current league is 3.27 Keepers of the Flame unless specified otherwise.`;
}

/**
 * Generate suggested questions based on build data
 */
export function generateSuggestedQuestions(build) {
  const questions = [];

  // Generic questions that apply to most builds
  questions.push('What should I prioritize upgrading first?');
  questions.push('What map mods should I avoid with this build?');

  // Progression questions
  if (build.progression) {
    questions.push('How do I progress from budget to endgame gear?');
  } else {
    questions.push('What\'s a good progression path for this build?');
  }

  // Item-specific questions
  if (build.keyItems && build.keyItems.length > 0) {
    questions.push(`What are good alternatives to ${build.keyItems[0]}?`);
  }

  // Gem questions
  if (build.skills && build.skills.length > 0) {
    questions.push(`What support gems should I prioritize for ${build.skills[0]}?`);
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

  return questions.slice(0, 8); // Return up to 8 suggestions
}
