export const SPIN_ACTIONS = {
  SPIN_START: 'SPIN_START',
  CLASS_SELECTED: 'CLASS_SELECTED',
  SKILL_SELECTED: 'SKILL_SELECTED',
  SET_SPINNING_CLASS: 'SET_SPINNING_CLASS',
  SPIN_COMPLETE: 'SPIN_COMPLETE',
  RESET: 'RESET',
};

export const initialSpinState = {
  isSpinning: false,
  spinningClass: null,
  selectedClass: null,
  selectedSkill: null,
  spinHistory: [],
};

export function spinReducer(state, action) {
  switch (action.type) {
    case SPIN_ACTIONS.SPIN_START:
      return {
        ...state,
        isSpinning: true,
        selectedClass: action.lockedClass || null,
        selectedSkill: null,
        spinningClass: action.lockedClass || null,
      };

    case SPIN_ACTIONS.CLASS_SELECTED:
      return {
        ...state,
        selectedClass: action.cls,
        spinningClass: action.cls,
      };

    case SPIN_ACTIONS.SKILL_SELECTED:
      return {
        ...state,
        selectedSkill: action.skill,
        spinningClass: null,
        isSpinning: false,
        spinHistory: [
          {
            id: Date.now(),
            class: action.cls || state.selectedClass,
            skill: action.skill,
            timestamp: new Date(),
          },
          ...state.spinHistory.slice(0, 9),
        ],
      };

    case SPIN_ACTIONS.SET_SPINNING_CLASS:
      return {
        ...state,
        spinningClass: action.cls,
      };

    case SPIN_ACTIONS.SPIN_COMPLETE:
      return {
        ...state,
        isSpinning: false,
        spinningClass: null,
      };

    case SPIN_ACTIONS.RESET:
      return {
        ...state,
        selectedClass: null,
        selectedSkill: null,
        spinningClass: null,
      };

    default:
      return state;
  }
}
