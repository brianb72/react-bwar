/*
    The Order of Battle tracks all units and their hierarchies.

    Structure:
        Side        An entire side in a battle. (Allies, Axis) 
        Force       An entire fighting force. (US, Commonwealth, Russia, Germany, Italy, Japan)
        Formation   A formation within a force. (1st SA Inf Div, 101st Airbourne, 15th Panzer Div)
        Unit        An unit within a formation. (2 Hussars, 8 IN Art, I/115 Arm Inf)

        The exact sizes of a Formation and Unit vary by scenario. 
        The above examples come from a scenario using divisions as formations and brigades as units.
        In multiplayer each player will control a side.

*/

import "../shared-types.js";

const arrayStringToInt = (arr) => {
  for (let i = 0; i < arr.length; ++i) {
    arr[i] = parseInt(arr[i]);
  }
  return arr;
};

export class OrderOfBattle {
  constructor() {
    this.reset();
  }

  reset() {
    this.oob = {
      sides: {},
      forces: {},
      formations: {},
      units: {},
    };
  }

  /* ************************************************************************
        Adding and removing
   ************************************************************************ */

  /**
   * Creates a side with a name and return a the newly created SideModel
   * @param {SideId} sideId Id of the side, must be unused
   * @param {string} sideName Name of side or empty string if no name
   * @returns {SideModel} SideModel of created side
   * @throws {Error} sideId not number, sideName not string sideId already exist
   */
  createSide(sideId, sideName) {
    // Test inputs
    if (typeof sideId !== "number") {
      throw new Error(
        `OrderOfBattle.createSide(): sideId is not a number [${JSON.stringify(
          sideId
        )}]`
      );
    }
    if (typeof sideName !== "string") {
      throw new Error(
        `OrderOfBattle.createSide(): sideName is not a string [${JSON.stringify(
          sideName
        )}]`
      );
    }
    if (this.oob.sides.hasOwnProperty(sideId)) {
      throw new Error(
        `OrderOfBattle.createSide(): sideId already exists [${JSON.stringify(
          sideId
        )}]`
      );
    }

    // Create the new SideModel
    const side = {
      sideId: sideId,
      name: sideName,
      forces: new Set(),
    };

    // Add the new object to the SideModel and return the new side
    this.oob.sides[side.sideId] = side;
    return side;
  }

  /**
   * Creates a force with a name and return the newly created ForceModel
   * @param {ForceId} forceId Id of the force, must be unused
   * @param {string} forceName Name of force or empty string if no name
   * @returns {ForceModel} ForceModel of created force
   * @throws {Error} forceId not number, forceName not string forceId already exist
   */
  createForce(forceId, forceName) {
    // Test inputs
    if (typeof forceId !== "number") {
      throw new Error(
        `OrderOfBattle.createForce(): forceId is not a number [${JSON.stringify(
          forceId
        )}]`
      );
    }
    if (typeof forceName !== "string") {
      throw new Error(
        `OrderOfBattle.createForce(): forceName is not a string  [${JSON.stringify(
          forceName
        )}]`
      );
    }
    if (this.oob.forces.hasOwnProperty(forceId)) {
      throw new Error(
        `OrderOfBattle.createForce(): forceId already exists [${JSON.stringify(
          forceId
        )}]`
      );
    }

    // Create the new force and assign an Id
    const force = {
      sideId: 0, // forces are optionally attached to sides with .setForceSide()
      forceId: forceId,
      name: forceName,
      formations: new Set(),
    };

    // Add the new force to the OOB and return the newly created object
    this.oob.forces[force.forceId] = force;
    return force;
  }

  /**
   * Creates a formation with a name and return the newly created FormationModel
   * Optionally attach to a force which must exist
   * @param {FormationId} formationId Id of the formation, must be unused
   * @param {string} formationName Name of formation or empty string if no name
   * @param {ForceId} attachedToForceId Id of the force this formation is attached to, or 0 if none
   * @returns {FormationModel} FormationModel of created formation
   * @throws {Error} formationId not number, formationName not string formationId already exist, attachedToForceId not a number, attachedToForceId does not exist
   */
  createFormation(formationId, formationName, attachedToForceId = 0) {
    // Test inputs
    if (typeof formationId !== "number") {
      throw new Error(
        `OrderOfBattle.createFormation(): formationId is not a number[${JSON.stringify(
          formationId
        )}]`
      );
    }
    if (typeof formationName !== "string") {
      throw new Error(
        `OrderOfBattle.createFormation(): formationName is not a string  [${JSON.stringify(
          formationName
        )}]`
      );
    }
    if (this.oob.formations.hasOwnProperty(formationId)) {
      throw new Error(
        `OrderOfBattle.createFormation(): formationId already exists [${JSON.stringify(
          formationId
        )}]`
      );
    }
    if (attachedToForceId) {
      if (typeof attachedToForceId !== "number") {
        throw new Error(
          `OrderOfBattle.createFormation(): attachedToForceId is not a number[${JSON.stringify(
            attachedToForceId
          )}]`
        );
      }
      if (!this.oob.forces.hasOwnProperty(attachedToForceId)) {
        throw new Error(
          `OrderOfBattle.createFormation(): attachedToForceId does not exist  [${JSON.stringify(
            attachedToForceId
          )}]`
        );
      }
    }

    // Create the new formation and set the force and formation id
    const formation = {
      forceId: attachedToForceId ? attachedToForceId : 0,
      formationId: formationId,
      name: formationName,
      units: new Set(),
    };

    // Add the new formation to the OOB
    this.oob.formations[formation.formationId] = formation;

    // If there is an attached force, add the formation to the force
    if (formation.forceId) {
      this.oob.forces[formation.forceId].formations.add(formation.formationId);
    }

    // Return the newly created formation
    return formation;
  }

  /**
   * Tests if a UnitModel passes basic checks. Only checks that the right keys and value types exist, but does not check if Id's actually exist, hex coordinates are on map, etc.
   * @param {UnitModel} unit UnitModel to test
   * @param
   * @return {boolean} True is unit has expected values, False if one or more values is missing or has an unexpected type, does not consider if values are actually valid just that they are there.
   */
  isUnitModelComplete(unit) {
    // The unit model must be an object
    if (typeof unit !== "object") {
      return false;
    }

    // Check the Id's to make sure they are integers. This is a special case where 0 is considered
    // "valid" for an Id because it is an integer. Any missing keys flag the unit as invalid.
    if (!Number.isInteger(unit.forceId)) {
      return false;
    }
    if (!Number.isInteger(unit.formationId)) {
      return false;
    }
    if (!Number.isInteger(unit.unitId)) {
      return false;
    }

    // Check if coordinates are integers but do not check if on map
    if (
      !Number.isInteger(unit.hexCoord?.x) ||
      !Number.isInteger(unit.hexCoord?.y)
    ) {
      return false;
    }

    // Strings must be strings, zero length strings are allowed
    if (typeof unit.name !== "string" || typeof unit.symbolName !== "string") {
      return false;
    }

    // All of the colors must exist and at least be strings
    const uc = unit.unitColors;
    if (
      typeof uc.counterForeground !== "string" ||
      typeof uc.counterBackground !== "string" ||
      typeof uc.symbolForeground !== "string" ||
      typeof uc.symbolBackground !== "string"
    ) {
      return false;
    }

    // The values object must at least exist
    if (typeof unit.values !== "object") {
      return false;
    }

    // Falling through to this point means the unit has passed all tests
    return true;
  }

  /**
   * Adds a UnitModel to the oob, and adds it to it's formation.
   * The UnitModel is checked for completeness and any model with missing or invalid data is rejected.
   * @param {UnitModel} unitModel to add to the oob
   * @returns {UnitModel} unitModel that was added to the oob
   * @throws {Error} isUnitModelComplete() check failed, forceId or formationId do not exist
   */
  addUnit(unitModel) {
    // Test inputs
    if (!this.isUnitModelComplete(unitModel)) {
      throw new Error(
        `OrderOfBattle.createUnit() unit fails isUnitModelComplete() check ${JSON.stringify(
          unitModel
        )}`
      );
    }

    // At this point everything is guaranteed to be there and be a the right type
    // Check if the forces and formations actually exist
    if (!this.oob.forces.hasOwnProperty(unitModel.forceId)) {
      throw new Error(
        `OrderOfBattle.createUnit() unknown force ${JSON.stringify(
          unitModel.forceId
        )} for unit ${JSON.stringify(unitModel)}`
      );
    }
    if (!this.oob.formations.hasOwnProperty(unitModel.formationId)) {
      throw new Error(
        `OrderOfBattle.createUnit() unknown formation ${JSON.stringify(
          unitModel.formationId
        )} for unit ${JSON.stringify(unitModel)}`
      );
    }

    // Add the new UnitModel to the OOB, set the formation, and return model
    this.oob.units[unitModel.unitId] = { ...unitModel };
    this.oob.formations[unitModel.formationId].units.add(unitModel.unitId);
    return unitModel;
  }

  /* ************************************************************************
        Lookup
   ************************************************************************ */

  /**
   * Gets an array of all UnitIds in the oob
   * @returns {Array.<number>} Array of UnitIds
   */
  getAllUnitIds() {
    const unitIds = arrayStringToInt(Object.keys(this.oob.units));
    return unitIds;
  }

  /**
   * Get a UnitModel by UnitId
   * @param {UnitId} unitId Id of unit to get
   * @returns {UnitModel | undefined} UnitModel of unitId or undefined if not found
   */
  getUnit(unitId) {
    if (typeof unitId !== "number") {
      throw new Error(
        `OrderOfBattle.getUnit(): unitId is not a number [${JSON.stringify(
          unitId
        )}]`
      );
    }
    return this.oob.units[unitId];
  }

  /**
   * Gets the SideId for UnitId
   * @param {UnitId} unitId Id of unit
   * @returns {number} SideId of Unit
   * @throws {Error} unitId not a number, could not find unit's forceId in sides
   */
  getSideIdForUnitId(unitId) {
    if (typeof unitId !== "number") {
      throw new Error(
        `OrderOfBattle.getSideIdForUnitId(): unitId is not a number [${JSON.stringify(
          unitId
        )}]`
      );
    }
    if (!this.oob.units.hasOwnProperty(unitId)) {
      throw new Error(
        `OrderOfBattle.getSideIdForUnitId(): unitId does not exist ${JSON.stringify(
          unitId
        )}`
      );
    }
    const forceId = this.oob.units[unitId].forceId;
    for (const side of Object.values(this.oob.sides)) {
      if (side.forces.has(forceId)) {
        return side.sideId;
      }
    }
    throw new Error(
      `OrderOfBattle.getSideIdForUnitId(): unitId ${JSON.stringify(
        unitId
      )} forceId ${JSON.stringify(forceId)} side not found!`
    );
  }

  /**
   * Tests if two units are on the same side
   * @param {UnitId} unitIdA Id of first unit
   * @param {UnitId} unitIdB Id of second unit
   * @returns {boolean} True if units are on same side
   * @throws {Error} unitIdA or unitIdB not a number, units do not exist, error looking up side
   */
  areUnitsOnSameSide(unitIdA, unitIdB) {
    if (typeof unitIdA !== "number") {
      throw new Error(
        `OrderOfBattle.areUnitsOnSameSide(): unitIdA is not a number [${JSON.stringify(
          unitIdA
        )}]`
      );
    }
    if (typeof unitIdB !== "number") {
      throw new Error(
        `OrderOfBattle.areUnitsOnSameSide(): unitIdB is not a number [${JSON.stringify(
          unitIdB
        )}]`
      );
    }

    try {
      return (
        this.getSideIdForUnitId(unitIdA) === this.getSideIdForUnitId(unitIdB)
      );
    } catch (e) {
      throw new Error(
        `OrderOfBattle.areUnitsOnSameSide(): Units [${JSON.stringify(
          unitIdA
        )}] and [${JSON.stringify(
          unitIdB
        )}] error looking up sides [${e}] [${JSON.stringify(this.oob.sides)}]`
      );
    }
  }

  /* ************************************************************************
        Setting parent
   ************************************************************************ */

  /**
   * Sets the side of a force, and removes it from old side
   * @param {ForceId} forceId Id of the force
   * @param {SideId} sideId Id of the side
   * @throws {Error} sideId or forceId do not exist
   */
  setForceSide(forceId, sideId) {
    // The force and side must exist
    if (!this.oob.sides.hasOwnProperty(sideId)) {
      throw new Error(
        `OrderOfBattle.setForceside(): sideId [${JSON.stringify(
          sideId
        )}] does not exist`
      );
    }
    if (!this.oob.forces.hasOwnProperty(forceId)) {
      throw new Error(
        `OrderOfBattle.setForceside(): forceId [${JSON.stringify(
          forceId
        )}] does not exist`
      );
    }

    // Remove the force from all existing sides, this doesn't delete the force itself.
    for (const side of Object.values(this.oob.sides)) {
      side.forces.delete(forceId);
    }

    // Add the force to the new side, and then set the forces new sideId
    this.oob.sides[sideId].forces.add(forceId);
    this.oob.forces[forceId].sideId = sideId;
  }

  /* ************************************************************************
        Removing
   ************************************************************************ */

  /**
   * Removes UnitId from FormationId
   * @param {UnitId} unitId Id of unit
   * @param {FormationId} formationId Id of formation
   * @throws {Error} unitId or formationId not a number, formationId does not exist
   */
  removeUnitIdFromFormationId(unitId, formationId) {
    if (typeof unitId !== "number") {
      throw new Error(
        `OrderOfBattle.removeUnitIdFromFormationId(): unitId is not a number [${JSON.stringify(
          unitId
        )}]`
      );
    }
    if (typeof formationId !== "number") {
      throw new Error(
        `OrderOfBattle.removeUnitIdFromFormationId(): formationId is not a number [${JSON.stringify(
          formationId
        )}]`
      );
    }
    if (!this.oob.formations.hasOwnProperty(formationId)) {
      throw new Error(
        `OrderOfBattle.removeUnitId(): formationId does not exist ${JSON.stringify(
          formationId
        )}`
      );
    }

    this.oob.formations[formationId].units.delete(unitId);
  }

  /**
   * Removes UnitId from the OOB, deleting the unit. Also removes unit from formation.
   * @param {UnitId} unitId Id of unit
   * @throws {Error} unitId not a number, unitId does not exist
   */
  removeUnitId(unitId) {
    if (typeof unitId !== "number") {
      throw new Error(
        `OrderOfBattle.removeUnitId(): unitId is not a number [${JSON.stringify(
          unitId
        )}]`
      );
    }
    if (!this.oob.units.hasOwnProperty(unitId)) {
      throw new Error(
        `OrderOfBattle.removeUnitId(): unitId does not exist ${JSON.stringify(
          unitId
        )}`
      );
    }

    const unit = this.getUnit(unitId);
    this.removeUnitIdFromFormationId(unitId, unit.formationId);
    delete this.oob.units[unitId];
  }

  /* ************************************************************************
        Updating
   ************************************************************************ */

  /**
   * Sets the values.percentCondition of a Unit
   * @param {UnitId} unitId Id of unit
   * @param {number} percentCondition Value between 0.0 and 1.0, used to scale combat values
   * @throws {Error} unitId not number, percentCondition not number, unitId does not exist
   */
  setUnitIdPercentCondition(unitId, percentCondition) {
    if (typeof unitId !== "number") {
      throw new Error(
        `OrderOfBattle.setUnitIdPercentCondition(): unitId is not a number [${JSON.stringify(
          unitId
        )}]`
      );
    }
    if (typeof percentCondition !== "number") {
      throw new Error(
        `OrderOfBattle.setUnitIdPercentCondition(): percentCondition is not a number [${JSON.stringify(
          percentCondition
        )}]`
      );
    }
    if (!this.oob.units.hasOwnProperty(unitId)) {
      throw new Error(
        `OrderOfBattle.setUnitIdPercentCondition(): unitId does not exist ${JSON.stringify(
          unitId
        )}`
      );
    }

    this.oob.units[unitId].values.percentCondition = percentCondition;
  }
}
