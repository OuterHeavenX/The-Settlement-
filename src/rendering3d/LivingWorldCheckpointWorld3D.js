/* Final first-checkpoint wrapper.
 * Legacy hero citizen duplicates remain suppressed. Door budgeting/events now live
 * in LivingWorldAtmosphereWorld3D so there is only one hardened implementation.
 */
import {LivingWorldAtmosphereWorld3D} from "./LivingWorldAtmosphereWorld3D.js";

export class LivingWorldCheckpointWorld3D extends LivingWorldAtmosphereWorld3D{
 syncHeroPresentation(){super.syncHeroPresentation();if(this.heroCitizenRoot)this.heroCitizenRoot.visible=false}
}
