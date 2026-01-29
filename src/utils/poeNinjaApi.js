// poe.ninja API integration for live build data

const POE_NINJA_API = 'https://poe.ninja/api/data';
const POE_NINJA_BUILDS_API = 'https://poe.ninja/api/data/builds';

// Cache for API responses
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch with caching
 */
async function fetchWithCache(url, ttl = CACHE_TTL) {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();

    cache.set(url, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    // Return cached data if available, even if expired
    if (cached) {
      console.warn('Using stale cache due to fetch error:', error);
      return cached.data;
    }
    throw error;
  }
}

/**
 * Get current league name
 */
export async function getCurrentLeague() {
  try {
    // Try to fetch league info from poe.ninja
    const data = await fetchWithCache(`${POE_NINJA_API}/getindexstate`);
    return data?.economyLeagues?.[0]?.name || 'Settlers';
  } catch {
    return 'Settlers'; // Default fallback
  }
}

/**
 * Fetch build statistics from poe.ninja
 */
export async function fetchBuildStats(league = null) {
  const leagueName = league || await getCurrentLeague();

  try {
    const url = `${POE_NINJA_BUILDS_API}/buildoverview?league=${encodeURIComponent(leagueName)}`;
    const data = await fetchWithCache(url);

    return {
      totalBuilds: data?.total || 0,
      classes: data?.classes || [],
      keystones: data?.keystoneStats || [],
      skills: data?.skillStats || [],
      items: data?.uniqueItemStats || [],
      ascendancies: data?.ascendancyStats || [],
      league: leagueName,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Failed to fetch build stats:', error);
    return null;
  }
}

/**
 * Fetch skill usage statistics
 */
export async function fetchSkillStats(league = null) {
  const leagueName = league || await getCurrentLeague();

  try {
    const url = `${POE_NINJA_BUILDS_API}/skillstats?league=${encodeURIComponent(leagueName)}`;
    const data = await fetchWithCache(url);

    return data?.skillStats?.map(skill => ({
      name: skill.name,
      count: skill.count,
      percentage: skill.percentage,
      dps: skill.dps,
      link: skill.link,
    })) || [];
  } catch (error) {
    console.error('Failed to fetch skill stats:', error);
    return [];
  }
}

/**
 * Fetch unique item usage statistics
 */
export async function fetchItemStats(league = null, type = 'UniqueArmour') {
  const leagueName = league || await getCurrentLeague();

  try {
    const url = `${POE_NINJA_API}/itemoverview?league=${encodeURIComponent(leagueName)}&type=${type}`;
    const data = await fetchWithCache(url);

    return data?.lines?.map(item => ({
      name: item.name,
      baseType: item.baseType,
      chaosValue: item.chaosValue,
      divineValue: item.divineValue,
      icon: item.icon,
      links: item.links,
      itemClass: item.itemClass,
      sparkline: item.sparkline?.data || [],
    })) || [];
  } catch (error) {
    console.error('Failed to fetch item stats:', error);
    return [];
  }
}

/**
 * Fetch currency exchange rates
 */
export async function fetchCurrencyRates(league = null) {
  const leagueName = league || await getCurrentLeague();

  try {
    const url = `${POE_NINJA_API}/currencyoverview?league=${encodeURIComponent(leagueName)}&type=Currency`;
    const data = await fetchWithCache(url);

    const rates = {};
    data?.lines?.forEach(item => {
      rates[item.currencyTypeName] = {
        chaosEquivalent: item.chaosEquivalent,
        icon: item.icon,
        change: item.receiveSparkLine?.totalChange || 0,
      };
    });

    return rates;
  } catch (error) {
    console.error('Failed to fetch currency rates:', error);
    return {};
  }
}

/**
 * Fetch top builds for a specific skill
 */
export async function fetchTopBuildsForSkill(skillName, league = null, limit = 10) {
  const leagueName = league || await getCurrentLeague();

  try {
    const url = `${POE_NINJA_BUILDS_API}/builds?league=${encodeURIComponent(leagueName)}&skill=${encodeURIComponent(skillName)}&limit=${limit}`;
    const data = await fetchWithCache(url);

    return data?.builds?.map(build => ({
      account: build.account,
      character: build.character,
      class: build.class,
      level: build.level,
      life: build.life,
      energyShield: build.energyShield,
      dps: build.dps,
      treeUrl: build.treeUrl,
      profileUrl: `https://poe.ninja/builds/challenge/${build.account}/${build.character}`,
      mainSkill: build.mainSkill,
      keystones: build.keystones || [],
      uniqueItems: build.uniqueItems || [],
    })) || [];
  } catch (error) {
    console.error('Failed to fetch top builds:', error);
    return [];
  }
}

/**
 * Fetch builds by ascendancy class
 */
export async function fetchBuildsByAscendancy(ascendancy, league = null, limit = 20) {
  const leagueName = league || await getCurrentLeague();

  try {
    const url = `${POE_NINJA_BUILDS_API}/builds?league=${encodeURIComponent(leagueName)}&class=${encodeURIComponent(ascendancy)}&limit=${limit}`;
    const data = await fetchWithCache(url);

    return data?.builds?.map(build => ({
      account: build.account,
      character: build.character,
      class: build.class,
      ascendancy: build.ascendancy,
      level: build.level,
      life: build.life,
      energyShield: build.energyShield,
      dps: build.dps,
      treeUrl: build.treeUrl,
      profileUrl: `https://poe.ninja/builds/challenge/${build.account}/${build.character}`,
      mainSkill: build.mainSkill,
      allSkills: build.allSkills || [],
      keystones: build.keystones || [],
      uniqueItems: build.uniqueItems || [],
    })) || [];
  } catch (error) {
    console.error('Failed to fetch builds by ascendancy:', error);
    return [];
  }
}

/**
 * Get trending keystones (most used)
 */
export async function fetchTrendingKeystones(league = null, limit = 20) {
  const stats = await fetchBuildStats(league);
  if (!stats?.keystones) return [];

  return stats.keystones
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(ks => ({
      name: ks.name,
      count: ks.count,
      percentage: ((ks.count / stats.totalBuilds) * 100).toFixed(1),
    }));
}

/**
 * Get ascendancy popularity rankings
 */
export async function fetchAscendancyRankings(league = null) {
  const stats = await fetchBuildStats(league);
  if (!stats?.ascendancies) return [];

  return stats.ascendancies
    .sort((a, b) => b.count - a.count)
    .map((asc, idx) => ({
      rank: idx + 1,
      name: asc.name,
      count: asc.count,
      percentage: ((asc.count / stats.totalBuilds) * 100).toFixed(1),
    }));
}

/**
 * Search for specific builds
 */
export async function searchBuilds(query, options = {}) {
  const { league, skill, ascendancy, keystone, item, limit = 20 } = options;
  const leagueName = league || await getCurrentLeague();

  let url = `${POE_NINJA_BUILDS_API}/builds?league=${encodeURIComponent(leagueName)}&limit=${limit}`;

  if (skill) url += `&skill=${encodeURIComponent(skill)}`;
  if (ascendancy) url += `&class=${encodeURIComponent(ascendancy)}`;
  if (keystone) url += `&keystone=${encodeURIComponent(keystone)}`;
  if (item) url += `&item=${encodeURIComponent(item)}`;

  try {
    const data = await fetchWithCache(url, 60000); // 1 minute cache for searches

    let results = data?.builds || [];

    // Filter by query if provided
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(build =>
        build.character?.toLowerCase().includes(q) ||
        build.mainSkill?.toLowerCase().includes(q) ||
        build.class?.toLowerCase().includes(q)
      );
    }

    return results.map(build => ({
      account: build.account,
      character: build.character,
      class: build.class,
      level: build.level,
      life: build.life,
      energyShield: build.energyShield,
      dps: build.dps,
      treeUrl: build.treeUrl,
      profileUrl: `https://poe.ninja/builds/challenge/${build.account}/${build.character}`,
      mainSkill: build.mainSkill,
      keystones: build.keystones || [],
      uniqueItems: build.uniqueItems || [],
    }));
  } catch (error) {
    console.error('Failed to search builds:', error);
    return [];
  }
}

/**
 * Get skill gem price data
 */
export async function fetchGemPrices(league = null) {
  const leagueName = league || await getCurrentLeague();

  try {
    const url = `${POE_NINJA_API}/itemoverview?league=${encodeURIComponent(leagueName)}&type=SkillGem`;
    const data = await fetchWithCache(url);

    return data?.lines?.map(gem => ({
      name: gem.name,
      variant: gem.variant,
      level: gem.gemLevel,
      quality: gem.gemQuality,
      corrupted: gem.corrupted,
      chaosValue: gem.chaosValue,
      divineValue: gem.divineValue,
      icon: gem.icon,
      listingCount: gem.listingCount,
    })) || [];
  } catch (error) {
    console.error('Failed to fetch gem prices:', error);
    return [];
  }
}

// Export a hook-friendly version
export function usePoeNinjaData() {
  return {
    getCurrentLeague,
    fetchBuildStats,
    fetchSkillStats,
    fetchItemStats,
    fetchCurrencyRates,
    fetchTopBuildsForSkill,
    fetchBuildsByAscendancy,
    fetchTrendingKeystones,
    fetchAscendancyRankings,
    searchBuilds,
    fetchGemPrices,
  };
}
