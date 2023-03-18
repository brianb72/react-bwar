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

import { Unit } from "./models";
import "./shared-types.js";

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
      // Holds the highest value Id that was used in each group. If 0 no value was used yet.
      idCounters: {
        sides: 0,
        forces: 0,
        formations: 0,
        units: 0,
      },
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
   * Creates a side with a name and return an assigned Id
   * @param {string} sideName Name of side or empty string if no name
   * @returns {SideId} Id of the new side
   * @throws {Error} sideName not string
   */
  createSide(sideName) {
    // Test inputs
    if (typeof sideName !== "string") {
      throw new Error(
        `OrderOfBattle.createSide(): sideName is not a string [${JSON.stringify(
          sideName
        )}]`
      );
    }

    // Create the new object and assign an Id
    const side = {
      sideId: ++this.oob.idCounters.sides,
      name: sideName,
      forces: new Set(),
    };

    // Add the new object to the OOB and return the assigned Id
    this.oob.sides[side.sideId] = side;
    return side.sideId;
  }

  /**
   * Create a new force with a name, attach it to a side, and return an assigned Id
   * @param {SideId} sideId Id of side to place force in
   * @param {string} forceName Name of force
   * @returns {number} ForceId assigned to new force
   * @throws {Error} sideId not number, forceName not string, sideId does not exist
   */
  createForce(sideId, forceName) {
    // Test inputs
    if (typeof sideId !== "number") {
      throw new Error(
        `OrderOfBattle.createForce(): sideId is not a number [${JSON.stringify(
          sideId
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
    if (!this.oob.sides.hasOwnProperty(sideId)) {
      throw new Error(
        `OrderOfBattle.createForce(): sideId does not exist  [${JSON.stringify(
          forceName
        )}]`
      );
    }

    // Create the new object and assign an Id
    const force = {
      sideId: sideId,
      forceId: ++this.oob.idCounters.forces,
      name: forceName,
      formations: new Set(),
    };

    // Add the new object to the OOB, set the side and return the assigned Id
    this.oob.forces[force.forceId] = force;
    this.setForceSide(force.forceId, sideId);
    return force.forceId;
  }

  /**
   * Create a new formation with a name, attach it to a force, and return an assigned Id
   * @param {ForceId} forceId Id of force to place formation in
   * @param {string} formationName Name of formation
   * @returns {number} FormationId assigned to new formation
   * @throws {Error} forceId not number, formationName not string, forceId does not exist
   */
  createFormation(forceId, formationName) {
    // Test inputs
    if (typeof forceId !== "number") {
      throw new Error(
        `OrderOfBattle.createForce(): forceId is not a number [${JSON.stringify(
          forceId
        )}]`
      );
    }
    if (typeof formationName !== "string") {
      throw new Error(
        `OrderOfBattle.createForce(): formationName is not a string  [${JSON.stringify(
          formationName
        )}]`
      );
    }
    if (!this.oob.forces.hasOwnProperty(forceId)) {
      throw new Error(
        `OrderOfBattle.createForce(): forceId does not exist  [${JSON.stringify(
          forceId
        )}]`
      );
    }

    // Create the new object and assign an Id
    const formation = {
      forceId: forceId,
      formationId: ++this.oob.idCounters.formations,
      name: formationName,
      units: new Set(),
    };

    // Add the new object to the OOB, add it to it's formation, and return the assigned Id
    this.oob.formations[formation.formationId] = formation;
    this.oob.forces[forceId].formations.add(formation.formationId);
    return formation.formationId;
  }

  createUnit(
    forceId,
    formationId,
    unitName,
    hexCoord,
    unitColors,
    symbolName,
    unitSize,
    values
  ) {
    // Test inputs
    if (typeof forceId !== "number") {
      throw new Error(
        `OrderOfBattle.createForce(): forceId is not a number [${JSON.stringify(
          forceId
        )}]`
      );
    }
    if (typeof formationId !== "number") {
      throw new Error(
        `OrderOfBattle.createForce(): formationId is not a number [${JSON.stringify(
          formationId
        )}]`
      );
    }
    if (typeof unitName !== "string") {
      throw new Error(
        `OrderOfBattle.createForce(): unitName is not a string  [${JSON.stringify(
          unitName
        )}]`
      );
    }
    if (!this.oob.forces.hasOwnProperty(forceId)) {
      throw new Error(
        `OrderOfBattle.createUnit() unknown force ${JSON.stringify(
          forceId
        )} for unit ${JSON.stringify(unitName)}`
      );
    }
    if (!this.oob.formations.hasOwnProperty(formationId)) {
      throw new Error(
        `OrderOfBattle.createUnit() unknown formation ${JSON.stringify(
          formationId
        )} for unit ${JSON.stringify(unitName)}`
      );
    }

    // Create the new object and assign an Id
    const unit = new Unit({
      unitId: ++this.oob.idCounters.units,
      forceId: forceId,
      formationId: formationId,
      name: unitName,
      hexCoord: { ...hexCoord },
      unitColors: { ...unitColors },
      symbolName: symbolName,
      unitSize: unitSize,
      values: { ...values },
    });

    // Add the new object to the OOB, set the side and return the assigned Id
    this.oob.units[unit.unitId] = unit;
    this.oob.formations[formationId].units.add(unit.unitId);
    return unit.unitId;
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
        )}] and [${JSON.stringify(unitIdB)}] error looking up sides [${e}]`
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
    for (let sid of Object.keys(this.oob.sides)) {
      this.oob.sides[sid].forces.delete(forceId);
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
