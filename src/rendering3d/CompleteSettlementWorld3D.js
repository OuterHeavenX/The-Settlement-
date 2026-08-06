/* Final current-building Three.js presentation checkpoint.
 * Simulation remains authoritative; this layer only verifies visual coverage.
 */
import {CivicCommerceWorld3D} from "./CivicCommerceWorld3D.js";
import {missingFinishedBuildingTypes} from "./FinishedBuildingCoverage.js";

export class CompleteSettlementWorld3D extends CivicCommerceWorld3D{
 init(){
  const ok=super.init();if(!ok)return false;
  const missing=missingFinishedBuildingTypes();
  if(missing.length)console.warn("The Settlement: current BuildingDefs still using generic Three.js fallback:",missing);
  else console.info("The Settlement: all current BuildingDefs have finished Three.js presentation coverage");
  return true;
 }
}
