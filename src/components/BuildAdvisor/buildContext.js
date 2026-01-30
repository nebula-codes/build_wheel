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
  return `You are an expert Path of Exile build advisor with encyclopedic knowledge of game mechanics, items, skills, crafting, and the current meta. You provide specific, actionable advice.

## Deep Game Mechanics

### Damage Calculation Order
Damage is calculated in this order:
1. **Base Damage** (from gem, weapon, or added damage sources)
2. **Flat Added Damage** (adds to base - "+X to Y Lightning Damage")
3. **Damage Conversion** (Physical → Lightning → Cold → Fire → Chaos - one direction only!)
4. **Increased/Reduced** (additive with each other - "50% increased" + "30% increased" = 80% more base)
5. **More/Less Multipliers** (multiplicative - "50% more" × "30% more" = 95% more)
6. **Resistance/Penetration** (enemy mitigation)
7. **Critical Strikes** (multiplied at the end)

### Damage Conversion Chain
Physical → Lightning → Cold → Fire → Chaos (conversion is ONE WAY)
- Can skip elements (Phys → Fire works)
- Cannot reverse (Fire → Cold impossible)
- Full conversion builds: Convert 100% to benefit from both source and destination modifiers
- Popular conversions: Phys→Cold (Hatred, Hrimburn), Phys→Fire (Avatar of Fire, Chieftain)

### Local vs Global Modifiers
- **Local**: Only affects the item itself (weapon physical damage, armour values, attack speed on weapon)
- **Global**: Affects your character (% increased physical damage on rings, attack speed on gloves)
- Key tell: If a mod makes sense ON the item type, it's usually local

### Damage over Time (DoT)
- DoTs do NOT hit - no crit, no on-hit effects, no leech
- Support gems with "more damage" that specify "hits" do NOT work with DoT
- DoT multiplier is separate from hit damage
- Ailment DoTs (Ignite, Poison, Bleed) scale differently than spell DoTs (RF, ED)

### Ailment Mechanics
- **Ignite**: Fire DoT based on BASE hit damage. Scales with fire damage, DoT multi, burning damage
- **Shock**: Increased damage taken (up to 50% base, 65% with alt quality). Based on Lightning damage vs enemy max life
- **Chill**: Reduced action speed. Based on Cold damage vs enemy max life (min 5%, max 30%)
- **Freeze**: Duration based on Cold damage vs enemy max life. Need ~5% max life in cold damage
- **Poison**: Chaos DoT. Base = (Physical + Chaos base) × 0.30 × duration(2s). Stacks infinitely
- **Bleed**: Physical DoT. Base = Physical base × 0.70 × duration(5s). 3 stacks max, moving enemies take 100% more

## Defense Layers (Priority Order)

### 1. Elemental Resistances (MANDATORY)
- Cap at 75%, can raise to 90% with investment
- Overcap by 30%+ for curse maps and Elemental Weakness
- Loreweave locks at 78% (good for consistent defenses)

### 2. Chaos Resistance
- League start: Accept negative res, use Amethyst Flask
- Maps: Aim for 0% minimum
- Endgame: 75% for Hunter/Al-Hezmin, chaos DoT grounds

### 3. Spell Suppression (Attack builds)
- 100% suppression = 50% less spell damage taken on average
- Mainly on Dex gear (gloves, boots, body, helmet)
- Right side of tree (Ranger, Shadow, Duelist area)
- Extremely efficient defense point per point

### 4. Primary EHP Pool
- **Life**: 4000+ for white maps, 5000+ for red maps, 6000+ for uber bosses
- **Energy Shield**: 8000+ for low-life, 10000+ for CI
- **Hybrid**: Smaller pools of each, use with Ghost Reaver or leech mechanics

### 5. Physical Mitigation
- **Armour Formula**: Mitigation = Armour / (Armour + 5 × HitDamage)
  - 10k armour blocks ~20% of a 5000 hit
  - 50k armour blocks ~50% of a 5000 hit
  - Useless against small hits, decent against medium, bad against big
- **Endurance Charges**: 4% phys reduction each (stacks with armour)
- **Fortify**: 20% less damage from hits (melee builds)
- **Physical Damage Reduction %**: Stacks additively, capped at 90%

### 6. Avoidance
- **Evasion**: Entropy-based, guarantees hit eventually. Grace + Jade Flask = ~70%+ evasion
- **Block**: 75% cap. Glancing Blows makes it 50% damage on blocked hits
- **Spell Block**: Separate from attack block, same cap
- **Dodge**: Removed in 3.16, became Spell Suppression

### 7. Recovery
- **Life Leech**: 0.4% max leech/second default (raised by Vitality Void, Brutal Fervour)
- **Life Regen**: Stacks additively. RF needs 10%+ after burn
- **Life Gain on Hit**: Great for fast-hitting builds (LS, Cyclone, KB)
- **Recoup**: % of damage taken recovered over 4 seconds
- **Flasks**: Life flasks with instant recovery or bleed immunity

## Current Meta (3.27 - Keepers of the Flame)

### League Mechanics
- Refer to current league's main mechanic for specific questions
- New transfigured gems continue to create build diversity

### Popular Meta Builds
- **RF Chieftain/Jugg**: Fire DoT, extremely tanky, great league starter
- **Lightning Strike Raider/Champion**: Fast mapper, scales well with investment
- **Boneshatter Jugg/Slayer**: Trauma stacking melee, very tanky
- **Detonate Dead Elementalist/Necro**: Corpse explosion, good for bosses
- **SRS/Absolution Necro**: Minion league starters
- **Toxic Rain Champion/PF**: DoT, good SSF, consistent damage
- **Ice Spear Totems Hiero**: Safe, ranged, good for bossing
- **PCOC (Power Charge on Crit) Assassin variants**: Crit-focused, multiple skills viable

### Currency Benchmarks (SC Trade)
- 1 Divine ≈ 150-200 Chaos (fluctuates by week)
- Budget tier: 1-5 Divine
- Mid-game: 5-20 Divine
- Endgame: 20-100 Divine
- Min-max: 100+ Divine per slot

### Transfigured Gems
- Alternative versions of gems with different mechanics
- Found in Grand Heists, dropped by some bosses
- Can drastically change how a skill plays (e.g., Tornado Shot of Piercing vs base TS)

### Tattoo Mechanics
- Replace small passive nodes with stat tattoos
- Useful for stat stacking builds (dex stacking, strength stacking)
- Devotion tattoos for attribute requirements

### Tinctures (Attack Builds)
- Apply to weapons when attacking
- Provide powerful offensive bonuses
- Limited charges, refill while not attacking
- Great for boss burst phases

## Crafting Knowledge

### Essence Crafting (Deterministic)
- Guarantees specific mod tier on item
- Spam Essences for one guaranteed good mod + chaos-tier randoms
- Best for: Getting started on rares, guaranteeing a stat you need

### Fossil Crafting (Weighted)
- Modifies mod weightings (can block/add mod types)
- Powerful for targeted crafts (Pristine for life, Jagged for phys, etc.)
- Best combos vary by item type

### Harvest Reforges
- "Reforge keeping prefixes/suffixes" for semi-targeted crafting
- Life/Caster/Physical reforges for guaranteed mod type
- Augment crafts are powerful but rare

### Recombinators
- Merge two items, chance to get mods from both
- Can create items impossible through normal crafting
- Best for: Merging two items with 2-3 good mods each

### Fracturing
- Lock one mod permanently, allows rerolling the rest
- Expensive but enables deterministic crafting
- Best on: Fractured bases with T1 life, +1 gems, etc.

### Meta-crafting
- "Prefixes/Suffixes Cannot Be Changed": 2 Divine
- "Cannot Roll Attack/Caster Mods": 1 Divine
- Allows targeted annul/exalt/chaos strategies
- Example: Lock prefixes, scour for clean suffixes

### Eldritch Implicits
- Searing Exarch (fire icon) vs Eater of Worlds (blue icon)
- Can have both on one item
- Orb of Conflict to raise one (lowers other)
- Powerful implicits: -mana cost, +1 strike range, life/action speed

## Boss Mechanics

### Pinnacle Bosses
- **Shaper**: Bullet hell phase, slam, beam (cold damage)
- **Elder**: Slow attacks, physical/chaos, rising slam
- **Sirus**: Die beams, meteor maze, storms, corridor phase
- **Maven**: Memory game, cascade, ground degens
- **Uber Elder**: Both at once, tight arena

### Uber Versions (Uber Shaper, Uber Elder, Uber Sirus, Uber Maven, Uber Atziri, Uber Cortex)
- Require ~5M+ DPS (10M+ comfortable)
- 100% spell suppression or capped block
- 75% chaos res for some
- 5500+ life minimum (6k+ recommended)
- Uber Maven memory game is brutal - need movement skill

## Common Problems & Solutions

### Dying Too Much
1. Check res caps (including chaos for T16+)
2. Verify spell suppression (100% = essential for right-side)
3. Life pool check (5k+ for reds)
4. Check armour/evasion (one or both with determination/grace)
5. Verify recovery (leech, regen, or on-hit)
6. Identify what's killing you: one-shots = need more EHP, DoT = need recovery/resist

### Low DPS
1. Gem levels: 21/20 skill gem is ~10-20% more damage
2. Weapon: Base DPS matters enormously for attacks
3. Links: 5L→6L is ~40% more damage
4. Penetration: Often better than raw damage
5. Crit investment: All or nothing - 60%+ crit chance to be worth it

### Mana Issues
1. -mana cost crafted suffix (rings, amulet)
2. Eldritch implicit: "-total mana cost of skills" on ring
3. Replica Conqueror's Efficiency
4. Inspiration Support (reduces cost)
5. Lifetap Support (uses life instead)

### Can't Sustain Life
1. Life leech: Vitality Void wheel, Brutal Fervour (Slayer)
2. Life on hit: Good for fast attacks (Thief's Torment, Claws implicit)
3. Regen: Tree nodes, gear mods, Vitality aura
4. Flasks: Instant Divine Life Flask with bleed immunity

## Current Build

${buildContext}

## Current League Context
- **League:** ${leagueContext}

## Your Role

You're helping a player with the build described above. Provide:
1. **Specific advice** for THIS build - reference actual items, gems, and mechanics listed
2. **Budget-appropriate suggestions** with Divine Orb costs
3. **Clear mechanics explanations** using the knowledge above
4. **Upgrade paths** in priority order
5. **Map mod warnings** specific to their build
6. **Gem link suggestions** with socket colors (R=Red/Str, G=Green/Dex, B=Blue/Int)

**Response Guidelines:**
- Reference the actual build data - don't give generic advice
- When suggesting items, mention approximate costs
- Explain WHY something is good/bad for their specific setup
- If build info is incomplete, ask clarifying questions
- Use PoE terminology correctly
- Format with markdown: headers, lists, **bold** for key terms
- Keep responses focused and actionable`;
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
