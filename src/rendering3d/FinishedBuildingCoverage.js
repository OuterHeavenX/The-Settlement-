/* Presentation-only coverage registry for current BuildingDefs.
 * This file contains no gameplay values and never mutates simulation state.
 */
export const FinishedBuildingCoverage={
 cottage:"residential",
 farm:"agriculture",
 lumber:"industry",quarry:"industry",mason:"industry",mill:"industry",bakery:"industry",ironMine:"industry",smelter:"industry",blacksmith:"industry",
 archery:"military",wall:"military",gate:"military",training:"military",barracks:"military",
 warehouse:"civic-commerce",mainHall:"civic-commerce",market:"civic-commerce",
 road:"organic-road"
};
export function missingFinishedBuildingTypes(){
 const defs=globalThis.Settlement?.BuildingDefs||{};
 return Object.keys(defs).filter(id=>!FinishedBuildingCoverage[id]);
}
