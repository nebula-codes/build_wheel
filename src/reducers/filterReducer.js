export const FILTER_ACTIONS = {
  TOGGLE_CLASS: 'TOGGLE_CLASS',
  TOGGLE_SKILL: 'TOGGLE_SKILL',
  SET_DIFFICULTY: 'SET_DIFFICULTY',
  SET_PLAYSTYLE: 'SET_PLAYSTYLE',
  LOCK_CLASS: 'LOCK_CLASS',
  LOCK_BUILD: 'LOCK_BUILD',
  RESET_FILTERS: 'RESET_FILTERS',
};

export function createInitialFilterState(gameId) {
  return {
    excludedClasses: gameId === 'poe1' ? ['raider'] : [],
    excludedSkills: [],
    difficultyFilter: 'all',
    playstyleFilter: 'all',
    lockedClass: null,
    lockedBuild: null,
  };
}

export function filterReducer(state, action) {
  switch (action.type) {
    case FILTER_ACTIONS.TOGGLE_CLASS: {
      const classId = action.classId;
      const excluded = state.excludedClasses.includes(classId)
        ? state.excludedClasses.filter(id => id !== classId)
        : [...state.excludedClasses, classId];
      return {
        ...state,
        excludedClasses: excluded,
        lockedClass: state.lockedClass?.id === classId ? null : state.lockedClass,
      };
    }

    case FILTER_ACTIONS.TOGGLE_SKILL: {
      const skillId = action.skillId;
      const excluded = state.excludedSkills.includes(skillId)
        ? state.excludedSkills.filter(id => id !== skillId)
        : [...state.excludedSkills, skillId];
      return {
        ...state,
        excludedSkills: excluded,
      };
    }

    case FILTER_ACTIONS.SET_DIFFICULTY:
      return { ...state, difficultyFilter: action.value };

    case FILTER_ACTIONS.SET_PLAYSTYLE:
      return { ...state, playstyleFilter: action.value };

    case FILTER_ACTIONS.LOCK_CLASS:
      return {
        ...state,
        lockedClass: state.lockedClass?.id === action.cls.id ? null : action.cls,
      };

    case FILTER_ACTIONS.LOCK_BUILD:
      return {
        ...state,
        lockedBuild: state.lockedBuild?.id === action.build?.id ? null : action.build,
      };

    case FILTER_ACTIONS.RESET_FILTERS:
      return createInitialFilterState(action.gameId);

    default:
      return state;
  }
}
