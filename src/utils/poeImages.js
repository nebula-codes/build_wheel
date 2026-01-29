// PoE Image URL utilities
// Uses the official PoE CDN for game images

const POE_CDN = 'https://web.poecdn.com/image';
const POE_WIKI_CDN = 'https://www.poewiki.net/wiki/Special:FilePath';

// Gem name to icon path mapping (common gems)
const GEM_ICONS = {
  // Attack gems
  'Arc': 'Art/2DItems/Gems/Arc.png',
  'Archmage Support': 'Art/2DItems/Gems/Support/ArchmageSupport.png',
  'Barrage': 'Art/2DItems/Gems/Barrage.png',
  'Barrage Support': 'Art/2DItems/Gems/Support/BarrageSupport.png',
  'Blade Flurry': 'Art/2DItems/Gems/BladeFlurry.png',
  'Blade Vortex': 'Art/2DItems/Gems/BladeVortex.png',
  'Bladestorm': 'Art/2DItems/Gems/Bladestorm.png',
  'Blink Arrow': 'Art/2DItems/Gems/BlinkArrow.png',
  'Blood Rage': 'Art/2DItems/Gems/BloodRage.png',
  'Boneshatter': 'Art/2DItems/Gems/Boneshatter.png',
  'Burning Arrow': 'Art/2DItems/Gems/BurningArrow.png',
  'Caustic Arrow': 'Art/2DItems/Gems/CausticArrow.png',
  'Cleave': 'Art/2DItems/Gems/Cleave.png',
  'Cobra Lash': 'Art/2DItems/Gems/CobraLash.png',
  'Consecrated Path': 'Art/2DItems/Gems/ConsecratedPath.png',
  'Corrupting Fever': 'Art/2DItems/Gems/CorruptingFever.png',
  'Crackling Lance': 'Art/2DItems/Gems/CracklingLance.png',
  'Cyclone': 'Art/2DItems/Gems/Cyclone.png',
  'Dark Pact': 'Art/2DItems/Gems/DarkPact.png',
  'Detonate Dead': 'Art/2DItems/Gems/DetonateDead.png',
  'Discharge': 'Art/2DItems/Gems/Discharge.png',
  'Dominating Blow': 'Art/2DItems/Gems/DominatingBlow.png',
  'Double Strike': 'Art/2DItems/Gems/DoubleStrike.png',
  'Earthshatter': 'Art/2DItems/Gems/Earthshatter.png',
  'Earthquake': 'Art/2DItems/Gems/Earthquake.png',
  'Elemental Hit': 'Art/2DItems/Gems/ElementalHit.png',
  'Elemental Hit of the Spectrum': 'Art/2DItems/Gems/ElementalHit.png',
  'Ensnaring Arrow': 'Art/2DItems/Gems/EnsnaringArrow.png',
  'Essence Drain': 'Art/2DItems/Gems/EssenceDrain.png',
  'Ethereal Knives': 'Art/2DItems/Gems/EtherealKnives.png',
  'Exsanguinate': 'Art/2DItems/Gems/Exsanguinate.png',
  'Eye of Winter': 'Art/2DItems/Gems/EyeOfWinter.png',
  'Fireball': 'Art/2DItems/Gems/Fireball.png',
  'Flame Dash': 'Art/2DItems/Gems/FlameDash.png',
  'Flameblast': 'Art/2DItems/Gems/Flameblast.png',
  'Flicker Strike': 'Art/2DItems/Gems/FlickerStrike.png',
  'Forbidden Rite': 'Art/2DItems/Gems/ForbiddenRite.png',
  'Freezing Pulse': 'Art/2DItems/Gems/FreezingPulse.png',
  'Frenzy': 'Art/2DItems/Gems/Frenzy.png',
  'Frost Blades': 'Art/2DItems/Gems/FrostBlades.png',
  'Frost Bomb': 'Art/2DItems/Gems/FrostBomb.png',
  'Frostbolt': 'Art/2DItems/Gems/Frostbolt.png',
  'Galvanic Arrow': 'Art/2DItems/Gems/GalvanicArrow.png',
  'Glacial Cascade': 'Art/2DItems/Gems/GlacialCascade.png',
  'Glacial Hammer': 'Art/2DItems/Gems/GlacialHammer.png',
  'Ground Slam': 'Art/2DItems/Gems/GroundSlam.png',
  'Heavy Strike': 'Art/2DItems/Gems/HeavyStrike.png',
  'Herald of Agony': 'Art/2DItems/Gems/HeraldOfAgony.png',
  'Herald of Ash': 'Art/2DItems/Gems/HeraldOfAsh.png',
  'Herald of Ice': 'Art/2DItems/Gems/HeraldOfIce.png',
  'Herald of Purity': 'Art/2DItems/Gems/HeraldOfPurity.png',
  'Herald of Thunder': 'Art/2DItems/Gems/HeraldOfThunder.png',
  'Ice Crash': 'Art/2DItems/Gems/IceCrash.png',
  'Ice Nova': 'Art/2DItems/Gems/IceNova.png',
  'Ice Shot': 'Art/2DItems/Gems/IceShot.png',
  'Ice Spear': 'Art/2DItems/Gems/IceSpear.png',
  'Infernal Blow': 'Art/2DItems/Gems/InfernalBlow.png',
  'Incinerate': 'Art/2DItems/Gems/Incinerate.png',
  'Kinetic Blast': 'Art/2DItems/Gems/KineticBlast.png',
  'Kinetic Bolt': 'Art/2DItems/Gems/KineticBolt.png',
  'Lacerate': 'Art/2DItems/Gems/Lacerate.png',
  'Lancing Steel': 'Art/2DItems/Gems/LancingSteel.png',
  'Lightning Arrow': 'Art/2DItems/Gems/LightningArrow.png',
  'Lightning Strike': 'Art/2DItems/Gems/LightningStrike.png',
  'Lightning Tendrils': 'Art/2DItems/Gems/LightningTendrils.png',
  'Magma Orb': 'Art/2DItems/Gems/MagmaOrb.png',
  'Molten Strike': 'Art/2DItems/Gems/MoltenStrike.png',
  'Orb of Storms': 'Art/2DItems/Gems/OrbOfStorms.png',
  'Perforate': 'Art/2DItems/Gems/Perforate.png',
  'Pestilent Strike': 'Art/2DItems/Gems/PestilentStrike.png',
  'Plague Bearer': 'Art/2DItems/Gems/PlagueBearer.png',
  'Power Siphon': 'Art/2DItems/Gems/PowerSiphon.png',
  'Puncture': 'Art/2DItems/Gems/Puncture.png',
  'Purifying Flame': 'Art/2DItems/Gems/PurifyingFlame.png',
  'Rain of Arrows': 'Art/2DItems/Gems/RainOfArrows.png',
  'Raise Spectre': 'Art/2DItems/Gems/RaiseSpectre.png',
  'Raise Zombie': 'Art/2DItems/Gems/RaiseZombie.png',
  'Reap': 'Art/2DItems/Gems/Reap.png',
  'Reave': 'Art/2DItems/Gems/Reave.png',
  'Reckoning': 'Art/2DItems/Gems/Reckoning.png',
  'Righteous Fire': 'Art/2DItems/Gems/RighteousFire.png',
  'Rolling Magma': 'Art/2DItems/Gems/RollingMagma.png',
  'Scourge Arrow': 'Art/2DItems/Gems/ScourgeArrow.png',
  'Shattering Steel': 'Art/2DItems/Gems/ShatteringSteel.png',
  'Shield Charge': 'Art/2DItems/Gems/ShieldCharge.png',
  'Shockwave Totem': 'Art/2DItems/Gems/ShockwaveTotem.png',
  'Smite': 'Art/2DItems/Gems/Smite.png',
  'Spark': 'Art/2DItems/Gems/Spark.png',
  'Spectral Helix': 'Art/2DItems/Gems/SpectralHelix.png',
  'Spectral Shield Throw': 'Art/2DItems/Gems/SpectralShieldThrow.png',
  'Spectral Throw': 'Art/2DItems/Gems/SpectralThrow.png',
  'Spirit Offering': 'Art/2DItems/Gems/SpiritOffering.png',
  'Split Arrow': 'Art/2DItems/Gems/SplitArrow.png',
  'Static Strike': 'Art/2DItems/Gems/StaticStrike.png',
  'Storm Brand': 'Art/2DItems/Gems/StormBrand.png',
  'Storm Burst': 'Art/2DItems/Gems/StormBurst.png',
  'Storm Call': 'Art/2DItems/Gems/StormCall.png',
  'Storm Rain': 'Art/2DItems/Gems/StormRain.png',
  'Sunder': 'Art/2DItems/Gems/Sunder.png',
  'Summon Carrion Golem': 'Art/2DItems/Gems/CarrionGolem.png',
  'Summon Chaos Golem': 'Art/2DItems/Gems/ChaosGolem.png',
  'Summon Flame Golem': 'Art/2DItems/Gems/FlameGolem.png',
  'Summon Holy Relic': 'Art/2DItems/Gems/HolyRelic.png',
  'Summon Ice Golem': 'Art/2DItems/Gems/IceGolem.png',
  'Summon Lightning Golem': 'Art/2DItems/Gems/LightningGolem.png',
  'Summon Raging Spirit': 'Art/2DItems/Gems/SummonRagingSpirit.png',
  'Summon Skeletons': 'Art/2DItems/Gems/SummonSkeletons.png',
  'Summon Stone Golem': 'Art/2DItems/Gems/StoneGolem.png',
  'Sweep': 'Art/2DItems/Gems/Sweep.png',
  'Tectonic Slam': 'Art/2DItems/Gems/TectonicSlam.png',
  'Tornado': 'Art/2DItems/Gems/Tornado.png',
  'Tornado Shot': 'Art/2DItems/Gems/TornadoShot.png',
  'Toxic Rain': 'Art/2DItems/Gems/ToxicRain.png',
  'Venom Gyre': 'Art/2DItems/Gems/VenomGyre.png',
  'Vigilant Strike': 'Art/2DItems/Gems/VigilantStrike.png',
  'Viper Strike': 'Art/2DItems/Gems/ViperStrike.png',
  'Volatile Dead': 'Art/2DItems/Gems/VolatileDead.png',
  'Voltaxic Burst': 'Art/2DItems/Gems/VoltaxicBurst.png',
  'Wave of Conviction': 'Art/2DItems/Gems/WaveOfConviction.png',
  'Whirling Blades': 'Art/2DItems/Gems/WhirlingBlades.png',
  'Wild Strike': 'Art/2DItems/Gems/WildStrike.png',
  'Winter Orb': 'Art/2DItems/Gems/WinterOrb.png',
  'Withering Step': 'Art/2DItems/Gems/WitheringStep.png',
  'Wrath': 'Art/2DItems/Gems/Wrath.png',

  // Support gems
  'Added Cold Damage Support': 'Art/2DItems/Gems/Support/AddedColdDamage.png',
  'Added Fire Damage Support': 'Art/2DItems/Gems/Support/AddedFireDamage.png',
  'Added Lightning Damage Support': 'Art/2DItems/Gems/Support/AddedLightningDamage.png',
  'Awakened Added Cold Damage Support': 'Art/2DItems/Gems/Support/AddedColdDamageAwakened.png',
  'Awakened Added Fire Damage Support': 'Art/2DItems/Gems/Support/AddedFireDamageAwakened.png',
  'Awakened Added Lightning Damage Support': 'Art/2DItems/Gems/Support/AddedLightningDamageAwakened.png',
  'Ancestral Call Support': 'Art/2DItems/Gems/Support/AncestralCall.png',
  'Brutality Support': 'Art/2DItems/Gems/Support/Brutality.png',
  'Cast on Critical Strike Support': 'Art/2DItems/Gems/Support/CastOnCrit.png',
  'Cast when Damage Taken Support': 'Art/2DItems/Gems/Support/CastOnDamageTaken.png',
  'Chain Support': 'Art/2DItems/Gems/Support/Chain.png',
  'Combustion Support': 'Art/2DItems/Gems/Support/Combustion.png',
  'Concentrated Effect Support': 'Art/2DItems/Gems/Support/ConcentratedEffect.png',
  'Controlled Destruction Support': 'Art/2DItems/Gems/Support/ControlledDestruction.png',
  'Cruelty Support': 'Art/2DItems/Gems/Support/Cruelty.png',
  'Deadly Ailments Support': 'Art/2DItems/Gems/Support/DeadlyAilments.png',
  'Efficacy Support': 'Art/2DItems/Gems/Support/Efficacy.png',
  'Elemental Damage with Attacks Support': 'Art/2DItems/Gems/Support/ElementalDamageWithAttacks.png',
  'Elemental Focus Support': 'Art/2DItems/Gems/Support/ElementalFocus.png',
  'Empower Support': 'Art/2DItems/Gems/Support/Empower.png',
  'Faster Attacks Support': 'Art/2DItems/Gems/Support/FasterAttacks.png',
  'Faster Casting Support': 'Art/2DItems/Gems/Support/FasterCasting.png',
  'Fork Support': 'Art/2DItems/Gems/Support/Fork.png',
  'Greater Multiple Projectiles Support': 'Art/2DItems/Gems/Support/GreaterMultipleProjectiles.png',
  'Hypothermia Support': 'Art/2DItems/Gems/Support/Hypothermia.png',
  'Impale Support': 'Art/2DItems/Gems/Support/Impale.png',
  'Increased Critical Damage Support': 'Art/2DItems/Gems/Support/IncreasedCriticalDamage.png',
  'Increased Critical Strikes Support': 'Art/2DItems/Gems/Support/IncreasedCriticalStrikes.png',
  'Infused Channelling Support': 'Art/2DItems/Gems/Support/InfusedChannelling.png',
  'Inspiration Support': 'Art/2DItems/Gems/Support/Inspiration.png',
  'Intensify Support': 'Art/2DItems/Gems/Support/Intensify.png',
  'Less Duration Support': 'Art/2DItems/Gems/Support/LessDuration.png',
  'Lifetap Support': 'Art/2DItems/Gems/Support/LifeTap.png',
  'Manaforged Arrows Support': 'Art/2DItems/Gems/Support/ManaforgedArrows.png',
  'Melee Physical Damage Support': 'Art/2DItems/Gems/Support/MeleePhysicalDamage.png',
  'Melee Splash Support': 'Art/2DItems/Gems/Support/MeleeSplash.png',
  'Minion Damage Support': 'Art/2DItems/Gems/Support/MinionDamage.png',
  'Mirage Archer Support': 'Art/2DItems/Gems/Support/MirageArcher.png',
  'Multiple Totems Support': 'Art/2DItems/Gems/Support/MultipleTotems.png',
  'Multistrike Support': 'Art/2DItems/Gems/Support/Multistrike.png',
  'Nightblade Support': 'Art/2DItems/Gems/Support/Nightblade.png',
  'Physical to Lightning Support': 'Art/2DItems/Gems/Support/PhysicalToLightning.png',
  'Pierce Support': 'Art/2DItems/Gems/Support/Pierce.png',
  'Pinpoint Support': 'Art/2DItems/Gems/Support/Pinpoint.png',
  'Rage Support': 'Art/2DItems/Gems/Support/Rage.png',
  'Returning Projectiles Support': 'Art/2DItems/Gems/Support/ReturningProjectiles.png',
  'Spell Echo Support': 'Art/2DItems/Gems/Support/SpellEcho.png',
  'Spell Totem Support': 'Art/2DItems/Gems/Support/SpellTotem.png',
  'Swift Affliction Support': 'Art/2DItems/Gems/Support/SwiftAffliction.png',
  'Trinity Support': 'Art/2DItems/Gems/Support/Trinity.png',
  'Unbound Ailments Support': 'Art/2DItems/Gems/Support/UnboundAilments.png',
  'Unleash Support': 'Art/2DItems/Gems/Support/Unleash.png',
  'Vicious Projectiles Support': 'Art/2DItems/Gems/Support/ViciousProjectiles.png',
  'Vile Toxins Support': 'Art/2DItems/Gems/Support/VileToxins.png',
  'Void Manipulation Support': 'Art/2DItems/Gems/Support/VoidManipulation.png',

  // Auras
  'Anger': 'Art/2DItems/Gems/Anger.png',
  'Clarity': 'Art/2DItems/Gems/Clarity.png',
  'Determination': 'Art/2DItems/Gems/Determination.png',
  'Discipline': 'Art/2DItems/Gems/Discipline.png',
  'Grace': 'Art/2DItems/Gems/Grace.png',
  'Haste': 'Art/2DItems/Gems/Haste.png',
  'Hatred': 'Art/2DItems/Gems/Hatred.png',
  'Malevolence': 'Art/2DItems/Gems/Malevolence.png',
  'Precision': 'Art/2DItems/Gems/Precision.png',
  'Pride': 'Art/2DItems/Gems/Pride.png',
  'Purity of Elements': 'Art/2DItems/Gems/PurityOfElements.png',
  'Purity of Fire': 'Art/2DItems/Gems/PurityOfFire.png',
  'Purity of Ice': 'Art/2DItems/Gems/PurityOfIce.png',
  'Purity of Lightning': 'Art/2DItems/Gems/PurityOfLightning.png',
  'Vitality': 'Art/2DItems/Gems/Vitality.png',
  'Wrath': 'Art/2DItems/Gems/Wrath.png',
  'Zealotry': 'Art/2DItems/Gems/Zealotry.png',

  // Curses & Marks
  'Assassin\'s Mark': 'Art/2DItems/Gems/AssassinsMark.png',
  'Conductivity': 'Art/2DItems/Gems/Conductivity.png',
  'Despair': 'Art/2DItems/Gems/Despair.png',
  'Elemental Weakness': 'Art/2DItems/Gems/ElementalWeakness.png',
  'Enfeeble': 'Art/2DItems/Gems/Enfeeble.png',
  'Flammability': 'Art/2DItems/Gems/Flammability.png',
  'Frostbite': 'Art/2DItems/Gems/Frostbite.png',
  'Mark On Hit Support': 'Art/2DItems/Gems/Support/MarkOnHit.png',
  'Poacher\'s Mark': 'Art/2DItems/Gems/PoachersMark.png',
  'Projectile Weakness': 'Art/2DItems/Gems/ProjectileWeakness.png',
  'Punishment': 'Art/2DItems/Gems/Punishment.png',
  'Sniper\'s Mark': 'Art/2DItems/Gems/SnipersMark.png',
  'Temporal Chains': 'Art/2DItems/Gems/TemporalChains.png',
  'Vulnerability': 'Art/2DItems/Gems/Vulnerability.png',
  'Warlord\'s Mark': 'Art/2DItems/Gems/WarlordsMark.png',

  // Utility
  'Ancestral Protector': 'Art/2DItems/Gems/AncestralProtector.png',
  'Ancestral Warchief': 'Art/2DItems/Gems/AncestralWarchief.png',
  'Arcanist Brand': 'Art/2DItems/Gems/ArcanistBrand.png',
  'Berserk': 'Art/2DItems/Gems/Berserk.png',
  'Bone Armour': 'Art/2DItems/Gems/BoneArmour.png',
  'Convocation': 'Art/2DItems/Gems/Convocation.png',
  'Dash': 'Art/2DItems/Gems/Dash.png',
  'Desecrate': 'Art/2DItems/Gems/Desecrate.png',
  'Enduring Cry': 'Art/2DItems/Gems/EnduringCry.png',
  'Flesh and Stone': 'Art/2DItems/Gems/FleshAndStone.png',
  'Flesh Offering': 'Art/2DItems/Gems/FleshOffering.png',
  'Frostblink': 'Art/2DItems/Gems/Frostblink.png',
  'Immortal Call': 'Art/2DItems/Gems/ImmortalCall.png',
  'Leap Slam': 'Art/2DItems/Gems/LeapSlam.png',
  'Molten Shell': 'Art/2DItems/Gems/MoltenShell.png',
  'Phase Run': 'Art/2DItems/Gems/PhaseRun.png',
  'Portal': 'Art/2DItems/Gems/Portal.png',
  'Rallying Cry': 'Art/2DItems/Gems/RallyingCry.png',
  'Seismic Cry': 'Art/2DItems/Gems/SeismicCry.png',
  'Steelskin': 'Art/2DItems/Gems/Steelskin.png',
  'Vaal Grace': 'Art/2DItems/Gems/VaalGems/VaalGrace.png',
  'Vaal Haste': 'Art/2DItems/Gems/VaalGems/VaalHaste.png',
  'Vaal Molten Shell': 'Art/2DItems/Gems/VaalGems/VaalMoltenShell.png',
};

// Unique item icons mapping
const UNIQUE_ICONS = {
  // Weapons
  'Ashes of the Stars': 'Art/2DItems/Amulets/AshesOfTheStars.png',
  'Crystallised Omniscience': 'Art/2DItems/Amulets/CrystallisedOmniscience.png',
  'Death Rush': 'Art/2DItems/Rings/DeathRush.png',
  'Death\'s Opus': 'Art/2DItems/Weapons/TwoHandWeapons/Bows/DeathsOpus.png',
  'Dying Sun': 'Art/2DItems/Flasks/DyingSun.png',
  'Headhunter': 'Art/2DItems/Belts/Headhunter.png',
  'Hyrri\'s Ire': 'Art/2DItems/Armours/BodyArmours/HyrrisIre.png',
  'Hyrri\'s Truth': 'Art/2DItems/Amulets/HyrrisTruth.png',
  'Imperial Claw': 'Art/2DItems/Weapons/OneHandWeapons/Claws/ImperialClaw.png',
  'Kaom\'s Spirit': 'Art/2DItems/Armours/Gloves/KaomsSpirit.png',
  'Mageblood': 'Art/2DItems/Belts/Mageblood.png',
  'Perseverance': 'Art/2DItems/Belts/Perseverance.png',
  'Piscator\'s Vigil': 'Art/2DItems/Weapons/OneHandWeapons/Wands/PiscatorsVigil.png',
  'Replica Alberon\'s Warpath': 'Art/2DItems/Armours/Boots/AlberonsWarpath.png',
  'The Taming': 'Art/2DItems/Rings/TheTaming.png',
  'Wasp Nest': 'Art/2DItems/Weapons/OneHandWeapons/Claws/WaspNest.png',
  'Yoke of Suffering': 'Art/2DItems/Amulets/YokeOfSuffering.png',
  'Crown of Eyes': 'Art/2DItems/Armours/Helmets/CrownOfEyes.png',
  'Dendrobate': 'Art/2DItems/Armours/BodyArmours/Dendrobate.png',
  'Coralito\'s Signature': 'Art/2DItems/Flasks/CoralitosSignature.png',
  'Aegis Aurora': 'Art/2DItems/Armours/Shields/AegisAurora.png',
  'Melding of the Flesh': 'Art/2DItems/Jewels/MeldingOfTheFlesh.png',
  'Forbidden Flame': 'Art/2DItems/Jewels/ForbiddenFlame.png',
  'Forbidden Flesh': 'Art/2DItems/Jewels/ForbiddenFlesh.png',
  'Watcher\'s Eye': 'Art/2DItems/Jewels/WatchersEye.png',
  'Thread of Hope': 'Art/2DItems/Jewels/ThreadOfHope.png',
  'Unnatural Instinct': 'Art/2DItems/Jewels/UnnaturalInstinct.png',
  'Voices': 'Art/2DItems/Jewels/Voices.png',
};

// Flask icons
const FLASK_ICONS = {
  'Divine Life Flask': 'Art/2DItems/Flasks/LifeFlask7.png',
  'Eternal Life Flask': 'Art/2DItems/Flasks/LifeFlask6.png',
  'Divine Mana Flask': 'Art/2DItems/Flasks/ManaFlask7.png',
  'Quicksilver Flask': 'Art/2DItems/Flasks/QuicksilverFlask.png',
  'Granite Flask': 'Art/2DItems/Flasks/GraniteFlask.png',
  'Jade Flask': 'Art/2DItems/Flasks/JadeFlask.png',
  'Quartz Flask': 'Art/2DItems/Flasks/QuartzFlask.png',
  'Basalt Flask': 'Art/2DItems/Flasks/BasaltFlask.png',
  'Ruby Flask': 'Art/2DItems/Flasks/RubyFlask.png',
  'Sapphire Flask': 'Art/2DItems/Flasks/SapphireFlask.png',
  'Topaz Flask': 'Art/2DItems/Flasks/TopazFlask.png',
  'Amethyst Flask': 'Art/2DItems/Flasks/AmethystFlask.png',
  'Diamond Flask': 'Art/2DItems/Flasks/DiamondFlask.png',
  'Silver Flask': 'Art/2DItems/Flasks/SilverFlask.png',
  'Sulphur Flask': 'Art/2DItems/Flasks/SulphurFlask.png',
  'Bismuth Flask': 'Art/2DItems/Flasks/BismuthFlask.png',
  'Stibnite Flask': 'Art/2DItems/Flasks/StibniteFlask.png',
  'Aquamarine Flask': 'Art/2DItems/Flasks/AquamarineFlask.png',
  'Dying Sun': 'Art/2DItems/Flasks/DyingSun.png',
  'Bottled Faith': 'Art/2DItems/Flasks/BottledFaith.png',
  'Taste of Hate': 'Art/2DItems/Flasks/TasteOfHate.png',
  'Atziri\'s Promise': 'Art/2DItems/Flasks/AtzirisPromise.png',
  'Sin\'s Rebirth': 'Art/2DItems/Flasks/SinsRebirth.png',
  'The Wise Oak': 'Art/2DItems/Flasks/TheWiseOak.png',
  'Lion\'s Roar': 'Art/2DItems/Flasks/LionsRoar.png',
  'Cinderswallow Urn': 'Art/2DItems/Flasks/CinderswallowUrn.png',
  'Divination Distillate': 'Art/2DItems/Flasks/DivinationDistillate.png',
  'Progenesis': 'Art/2DItems/Flasks/Progenesis.png',
  'Coruscating Elixir': 'Art/2DItems/Flasks/CoruscatingElixir.png',
};

/**
 * Get the CDN URL for a gem icon
 */
export function getGemIconUrl(gemName) {
  // Clean up the gem name (remove Support suffix for matching)
  const cleanName = gemName.replace(' Support', '').trim();

  // Try exact match first
  if (GEM_ICONS[gemName]) {
    return `${POE_CDN}/${GEM_ICONS[gemName]}`;
  }

  // Try with Support suffix
  if (GEM_ICONS[`${cleanName} Support`]) {
    return `${POE_CDN}/${GEM_ICONS[`${cleanName} Support`]}`;
  }

  // Try clean name
  if (GEM_ICONS[cleanName]) {
    return `${POE_CDN}/${GEM_ICONS[cleanName]}`;
  }

  // Generate a path based on naming conventions
  const normalized = gemName
    .replace(/['\s]/g, '')
    .replace(/Support$/, '');

  return `${POE_CDN}/Art/2DItems/Gems/${normalized}.png`;
}

/**
 * Get the CDN URL for a unique item icon
 */
export function getUniqueIconUrl(itemName) {
  if (UNIQUE_ICONS[itemName]) {
    return `${POE_CDN}/${UNIQUE_ICONS[itemName]}`;
  }

  // Return a placeholder for unknown items
  return null;
}

/**
 * Get the CDN URL for a flask icon
 */
export function getFlaskIconUrl(flaskName) {
  if (FLASK_ICONS[flaskName]) {
    return `${POE_CDN}/${FLASK_ICONS[flaskName]}`;
  }
  return null;
}

/**
 * Get socket color based on gem type/name
 */
export function getGemSocketColor(gemName) {
  const name = gemName.toLowerCase();

  // Intelligence gems (blue)
  const intKeywords = ['arc', 'frost', 'ice', 'cold', 'spark', 'lightning', 'storm', 'orb', 'nova',
    'spectre', 'zombie', 'skeleton', 'golem', 'raging spirit', 'minion', 'offering', 'convocation',
    'wrath', 'discipline', 'clarity', 'hatred', 'zealotry', 'spell', 'essence drain', 'contagion',
    'blight', 'ethereal', 'blade vortex', 'freezing pulse', 'fireball', 'incinerate', 'discharge',
    'detonate dead', 'volatile dead', 'cremation', 'purity', 'conductivity', 'frostbite', 'enfeeble',
    'temporal chains', 'elemental weakness', 'assassin\'s mark', 'controlled destruction', 'efficacy',
    'faster casting', 'spell echo', 'unleash', 'intensify', 'pinpoint', 'archmage'];

  // Dexterity gems (green)
  const dexKeywords = ['arrow', 'shot', 'barrage', 'tornado', 'rain', 'projectile', 'pierce', 'chain',
    'fork', 'split', 'cobra', 'venom', 'viper', 'poison', 'toxic', 'caustic', 'plague', 'mirage archer',
    'ballista', 'trap', 'mine', 'grace', 'haste', 'phase run', 'dash', 'blink', 'smoke', 'withering step',
    'nightblade', 'elusive', 'mark on hit', 'sniper\'s mark', 'poacher\'s mark', 'faster attacks',
    'vicious projectiles', 'deadly ailments', 'swift affliction', 'unbound ailments', 'trinity',
    'greater multiple projectiles', 'lesser multiple projectiles', 'returning projectiles', 'far shot'];

  // Strength gems (red)
  const strKeywords = ['strike', 'slam', 'blow', 'smash', 'crush', 'cleave', 'sweep', 'cyclone',
    'earthquake', 'sunder', 'perforate', 'lacerate', 'bladestorm', 'reave', 'flicker', 'molten',
    'infernal', 'tectonic', 'consecrated', 'ground slam', 'heavy strike', 'double strike', 'rage',
    'berserk', 'ancestral', 'warchief', 'protector', 'totem', 'herald of ash', 'anger', 'determination',
    'pride', 'vitality', 'blood', 'vulnerability', 'punishment', 'warlord\'s mark', 'melee physical',
    'melee splash', 'multistrike', 'brutality', 'impale', 'fortify', 'pulverise', 'fist of war',
    'shockwave', 'ruthless', 'endurance', 'enduring cry', 'rallying cry', 'seismic cry', 'intimidating cry',
    'immortal call', 'molten shell', 'steelskin', 'boneshatter', 'dominating blow'];

  // Check keywords
  for (const kw of strKeywords) {
    if (name.includes(kw)) return 'red';
  }
  for (const dexKeywords2 of dexKeywords) {
    if (name.includes(dexKeywords2)) return 'green';
  }
  for (const intKw of intKeywords) {
    if (name.includes(intKw)) return 'blue';
  }

  // Support gems - check the name ending
  if (name.includes('support')) {
    // Default support color based on common patterns
    if (name.includes('physical') || name.includes('melee') || name.includes('attack')) return 'red';
    if (name.includes('projectile') || name.includes('trap') || name.includes('mine')) return 'green';
    return 'blue';
  }

  // Default to blue for spells
  return 'blue';
}

/**
 * Get gem type (active, support, aura, etc.)
 */
export function getGemType(gemName) {
  const name = gemName.toLowerCase();

  if (name.includes('support')) return 'support';
  if (name.includes('herald')) return 'herald';
  if (['anger', 'wrath', 'hatred', 'grace', 'haste', 'determination', 'discipline',
       'clarity', 'vitality', 'precision', 'pride', 'malevolence', 'zealotry',
       'purity of elements', 'purity of fire', 'purity of ice', 'purity of lightning'].some(a => name.includes(a))) {
    return 'aura';
  }
  if (['mark', 'curse', 'conductivity', 'flammability', 'frostbite', 'despair',
       'enfeeble', 'temporal chains', 'vulnerability', 'punishment', 'elemental weakness',
       'projectile weakness'].some(c => name.includes(c))) {
    return 'curse';
  }
  if (name.includes('vaal')) return 'vaal';
  if (['flame dash', 'dash', 'blink arrow', 'leap slam', 'whirling blades',
       'shield charge', 'frostblink', 'phase run', 'withering step', 'smoke mine'].some(m => name.includes(m))) {
    return 'movement';
  }

  return 'active';
}

// Export constants for external use
export { POE_CDN, GEM_ICONS, UNIQUE_ICONS, FLASK_ICONS };
