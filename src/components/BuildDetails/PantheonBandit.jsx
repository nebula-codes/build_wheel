import { POE_CDN } from '../../utils/poeImages';

// Pantheon data with icons and effects
const MAJOR_PANTHEONS = {
  'Soul of the Brine King': {
    icon: 'Art/2DItems/Currency/CapturePantheonBrineKing.png',
    effect: 'Cannot be Stunned if you\'ve been Stunned Recently. 50% reduced Effect of Chill on you',
    upgrades: [
      'Cannot be Frozen if you\'ve been Frozen Recently',
      '30% increased Stun and Block Recovery',
      '50% reduced Effect of Chill on you',
    ],
    color: 'blue',
  },
  'Soul of Lunaris': {
    icon: 'Art/2DItems/Currency/CapturePantheonLunaris.png',
    effect: '1% additional Physical Damage Reduction for each nearby Enemy, 1% increased Movement Speed for each nearby Enemy',
    upgrades: [
      'Avoid Projectiles that have Chained',
      '5% chance to Dodge Attack Hits if you\'ve been Hit Recently',
      '1% to Maximum Physical Damage Reduction',
    ],
    color: 'purple',
  },
  'Soul of Solaris': {
    icon: 'Art/2DItems/Currency/CapturePantheonSolaris.png',
    effect: '6% additional Physical Damage Reduction while there is only one nearby Enemy. 20% chance to take 50% less Area Damage',
    upgrades: [
      '8% reduced Elemental Damage taken if you haven\'t been Hit Recently',
      '50% chance to avoid Ailments from Critical Strikes',
      'Take no Extra Damage from Critical Strikes if you\'ve taken a Critical Strike Recently',
    ],
    color: 'orange',
  },
  'Soul of Arakaali': {
    icon: 'Art/2DItems/Currency/CapturePantheonArakaali.png',
    effect: '5% reduced Damage taken from Damage Over Time. 10% chance to avoid Lightning Damage from Hits',
    upgrades: [
      '50% increased Recovery rate of Life and Energy Shield if you\'ve stopped taking Damage Over Time Recently',
      '+25% Chaos Resistance against Damage Over Time',
      '30% reduced Effect of Shock on you',
    ],
    color: 'green',
  },
};

const MINOR_PANTHEONS = {
  'Soul of Abberath': {
    icon: 'Art/2DItems/Currency/CapturePantheonAbberath.png',
    effect: '60% less Duration of Ignite on you',
    upgrades: ['Unaffected by Burning Ground'],
    color: 'red',
  },
  'Soul of Gruthkul': {
    icon: 'Art/2DItems/Currency/CapturePantheonGruthkul.png',
    effect: '1% additional Physical Damage Reduction for each Hit you\'ve taken Recently up to 5%',
    upgrades: ['Enemies that have Hit you with an Attack Recently have 8% reduced Attack Speed'],
    color: 'brown',
  },
  'Soul of Yugul': {
    icon: 'Art/2DItems/Currency/CapturePantheonYugul.png',
    effect: '50% reduced Effect of Chill on you. 50% reduced Reflected Damage taken',
    upgrades: ['You and your Minions take 50% reduced Reflected Damage'],
    color: 'cyan',
  },
  'Soul of Shakari': {
    icon: 'Art/2DItems/Currency/CapturePantheonShakari.png',
    effect: '5% reduced Chaos Damage taken. 25% reduced Chaos Damage over Time taken while on Caustic Ground',
    upgrades: ['You cannot be Poisoned while there are at least 3 Poisons on you', 'Immune to Poison'],
    color: 'green',
  },
  'Soul of Tukohama': {
    icon: 'Art/2DItems/Currency/CapturePantheonTukohama.png',
    effect: 'While stationary, gain 2% additional Physical Damage Reduction each second, up to 8%',
    upgrades: ['While stationary, gain 0.5% of Life Regenerated per second each second, up to 2%'],
    color: 'red',
  },
  'Soul of Ralakesh': {
    icon: 'Art/2DItems/Currency/CapturePantheonRalakesh.png',
    effect: '25% reduced Physical Damage over Time taken while moving. 25% chance to avoid Bleeding',
    upgrades: ['Cannot be Blinded', 'You cannot be Maimed'],
    color: 'gray',
  },
  'Soul of Garukhan': {
    icon: 'Art/2DItems/Currency/CapturePantheonGarukhan.png',
    effect: '+5% chance to Evade Attack Hits if you\'ve taken a Savage Hit Recently',
    upgrades: ['6% increased Movement Speed if you haven\'t been Hit Recently'],
    color: 'teal',
  },
  'Soul of Ryslatha': {
    icon: 'Art/2DItems/Currency/CapturePantheonRyslatha.png',
    effect: 'Life Flasks gain 3 Charges every 3 seconds if you haven\'t used a Life Flask Recently',
    upgrades: ['60% increased Life Recovery from Flasks used when on Low Life'],
    color: 'pink',
  },
};

// Bandit choices
const BANDITS = {
  'Kill All': {
    icon: null,
    effect: '+2 Passive Skill Points',
    color: 'gray',
  },
  'Help Oak': {
    icon: 'Art/2DArt/UIImages/InGame/Bandit/Oak.png',
    effect: '1% of Life Regenerated per second, 2% additional Physical Damage Reduction, 20% increased Physical Damage',
    color: 'green',
  },
  'Help Kraityn': {
    icon: 'Art/2DArt/UIImages/InGame/Bandit/Kraityn.png',
    effect: '6% increased Attack and Cast Speed, 10% chance to Avoid Elemental Ailments, 6% increased Movement Speed',
    color: 'blue',
  },
  'Help Alira': {
    icon: 'Art/2DArt/UIImages/InGame/Bandit/Alira.png',
    effect: '+5 Mana Regenerated per second, +20% to Global Critical Strike Multiplier, +15% to all Elemental Resistances',
    color: 'purple',
  },
};

const colorClasses = {
  blue: 'from-blue-900/40 border-blue-700/50 text-blue-300',
  purple: 'from-purple-900/40 border-purple-700/50 text-purple-300',
  orange: 'from-orange-900/40 border-orange-700/50 text-orange-300',
  green: 'from-green-900/40 border-green-700/50 text-green-300',
  red: 'from-red-900/40 border-red-700/50 text-red-300',
  brown: 'from-amber-900/40 border-amber-700/50 text-amber-300',
  cyan: 'from-cyan-900/40 border-cyan-700/50 text-cyan-300',
  gray: 'from-gray-800/40 border-gray-600/50 text-gray-300',
  teal: 'from-teal-900/40 border-teal-700/50 text-teal-300',
  pink: 'from-pink-900/40 border-pink-700/50 text-pink-300',
};

/**
 * Single pantheon display
 */
function PantheonChoice({ name, isMajor = false, className = '' }) {
  const pantheonData = isMajor ? MAJOR_PANTHEONS[name] : MINOR_PANTHEONS[name];

  if (!pantheonData) {
    return (
      <div className={`text-sm text-gray-400 ${className}`}>
        {name || 'Not selected'}
      </div>
    );
  }

  const { icon, effect, color } = pantheonData;

  return (
    <div className={`
      flex items-start gap-3 p-3 rounded-lg
      bg-gradient-to-r ${colorClasses[color]} to-transparent
      border
      ${className}
    `}>
      {/* Icon */}
      <div className="w-10 h-10 flex-shrink-0 bg-black/40 rounded overflow-hidden">
        {icon && (
          <img
            src={`${POE_CDN}/${icon}`}
            alt={name}
            className="w-full h-full object-contain"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white">{name}</div>
        <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">
          {effect}
        </div>
      </div>

      {/* Type badge */}
      <div className={`
        text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider
        ${isMajor ? 'bg-amber-800/50 text-amber-300' : 'bg-gray-700/50 text-gray-400'}
      `}>
        {isMajor ? 'Major' : 'Minor'}
      </div>
    </div>
  );
}

/**
 * Bandit choice display
 */
function BanditChoice({ choice, className = '' }) {
  const banditData = BANDITS[choice];

  if (!banditData) {
    return (
      <div className={`text-sm text-gray-400 ${className}`}>
        {choice || 'Not selected'}
      </div>
    );
  }

  const { effect, color } = banditData;

  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-lg
      bg-gradient-to-r ${colorClasses[color]} to-transparent
      border
      ${className}
    `}>
      {/* Icon placeholder */}
      <div className="w-8 h-8 flex-shrink-0 bg-black/40 rounded flex items-center justify-center text-lg">
        {choice === 'Kill All' ? '💀' : '👤'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white">{choice}</div>
        <div className="text-[11px] text-gray-400 mt-0.5 leading-snug">
          {effect}
        </div>
      </div>
    </div>
  );
}

/**
 * Full Pantheon and Bandit display for a build
 */
export default function PantheonBandit({ majorPantheon, minorPantheon, bandit, className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Pantheon Section */}
      <div>
        <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
          <span>Pantheon</span>
          <span className="flex-1 h-px bg-gray-800" />
        </h4>
        <div className="space-y-2">
          <PantheonChoice name={majorPantheon} isMajor={true} />
          <PantheonChoice name={minorPantheon} isMajor={false} />
        </div>
      </div>

      {/* Bandit Section */}
      <div>
        <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
          <span>Bandit</span>
          <span className="flex-1 h-px bg-gray-800" />
        </h4>
        <BanditChoice choice={bandit} />
      </div>
    </div>
  );
}

// Export individual components
export { PantheonChoice, BanditChoice, MAJOR_PANTHEONS, MINOR_PANTHEONS, BANDITS };
