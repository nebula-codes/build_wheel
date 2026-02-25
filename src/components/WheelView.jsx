import { forwardRef } from 'react';
import Wheel from './Wheel';
import ResultDisplay from './ResultDisplay';

const WheelView = forwardRef(function WheelView({
  classWheelRef,
  skillWheelRef,
  lockedClass,
  availableClasses,
  displayedSkills,
  selectedClass,
  selectedSkill,
  isSpinning,
  selectedGameId,
  onClassSpinComplete,
  onSkillSpinComplete,
  onTick,
}, ref) {
  return (
    <>
      {/* Wheels */}
      <div className="flex flex-wrap items-start justify-center gap-8 mb-8">
        <div className={`bg-[#1a1a24] rounded-xl p-6 border border-gray-800 ${lockedClass ? 'ring-2 ring-diablo-orange/50' : ''}`}>
          {lockedClass && (
            <div className="text-center mb-2">
              <span className="text-xs text-diablo-orange flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Locked
              </span>
            </div>
          )}
          <Wheel
            ref={classWheelRef}
            items={lockedClass ? [lockedClass] : availableClasses}
            title="Class"
            onSpinComplete={onClassSpinComplete}
            locked={!!lockedClass}
            onTick={onTick}
          />
        </div>
        <div className="bg-[#1a1a24] rounded-xl p-6 border border-gray-800">
          <Wheel
            ref={skillWheelRef}
            items={displayedSkills}
            title="Build"
            onSpinComplete={onSkillSpinComplete}
            onTick={onTick}
          />
        </div>
      </div>

      {/* Results */}
      <ResultDisplay
        selectedClass={selectedClass}
        selectedSkill={selectedSkill}
        isSpinning={isSpinning}
        gameId={selectedGameId}
      />
    </>
  );
});

export default WheelView;
