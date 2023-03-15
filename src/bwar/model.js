import { Hex, TerrainNames } from "./models.js";
import { Coordinates } from "./coordinates";
import "./shared-types.js";

export class BWARModel {
  /**
   *
   * @param {number} mapHexWidth Map width in hexes
   * @param {number} mapHexHeight Map height in hexes
   */
  constructor(mapHexWidth, mapHexHeight) {
    this.mapHexWidth = mapHexWidth;
    this.mapHexHeight = mapHexHeight;

    // Create the unit dictionary
    this.units = {};

    // Create the map array
    this.hexMap = new Array(mapHexHeight);
    for (let y = 0; y < mapHexHeight; ++y) {
      this.hexMap[y] = new Array(mapHexWidth);
      for (let x = 0; x < mapHexWidth; ++x) {
        this.hexMap[y][x] = new Hex({
          hexCoord: Coordinates.makeCart(x, y),
          terrainId: TerrainNames.Grass,
        });
      }
    }
  }

  /**
   * Tests if a hex coordinate is on the map
   * @param {CartCoordinate} hexCoord
   * @returns boolean True if coordinate is on map
   * @throws {Error} hexCoord invalid
   */
  isHexOnMap(hexCoord) {
    try {
      const { x, y } = hexCoord;
      return x >= 0 && x < this.mapHexWidth && y >= 0 && y < this.mapHexHeight;
    } catch {
      throw new Error(
        `BWARModel.isHexOnMap(): hexCoord is invalid [${hexCoord}]]`
      );
    }
  }

  /**
   * Get the HexModel for a hex
   * @param {CartCoordinate} hexCoord Coordinate of hex to get
   * @returns {HexModel | undefined}  HexModel of target hexCoord, or undefined if off map
   * @throws {Error} hexCoord invalid or bounds error accessing hexMap array
  */
  getHex(hexCoord) {
    try {
      if (!this.isHexOnMap(hexCoord)) {
        return undefined;
      }
      return this.hexMap[hexCoord.y][hexCoord.x];
    } catch {
      // Never?
      throw new Error(`BWARModel.getHex(): hexCoord is invalid [${hexCoord}]]`);
    }
  }

  /**
   * Get a UnitModel by UnitId
   * @param {UnitId} unitId Id of unit to get
   * @returns {UnitModel | undefined} UnitModel of unitId or undefined if not found
   */
  getUnit(unitId) {
    return this.units[unitId];
  }

  /**
   * Gets an array of all UnitId in the unit dictionary
   * @returns {Array.<number>} Array of UnitId
   */
  getAllUnitIds() {
    return Object.keys(this.units);
  }

  /**
   * Add a UnitModel to the unit list
   * @param {UnitModel} unit Unit to add to the list
   * @throws {Error} Invalid unit, already in units
   */
  addUnit(unit) {
    if (!unit || !Number.isInteger(unit.unitId)) {
      throw new Error(`BWARModel.addUnit(): Invalid unit [${unit}]`);
    }
    if (this.units.hasOwnProperty(unit.unitId)) {
      throw new Error(
        `BWARModel.addUnit(): Unit is already in units. [${unit}]`
      );
    }
    this.units[unit.unitId] = unit;
  }

  /**
   * Unit is removed from it's current hex and moved to a new hex
   * @param {UntId} unitId Id of Unit to move
   * @param {CartCoordinate} targetHexCoord Coordinate of hex to move to
   * @throws {Error} unitId not found, unit source hex not found, unit target hex not found
   */
  moveUnitIdToHexCoord(unitId, targetHexCoord) {
    // Get the unit
    const unit = this.getUnit(unitId);
    if (unit === undefined) {
      throw new Error(
        `BWARModel.moveUnitIdToHex(): Unit not found [${unitId}]`
      );
    }

    // Get the source hex
    const sourceHex = this.getHex(unit.hexCoord);
    if (sourceHex === undefined) {
      throw new Error(
        `BWARModel.moveUnitIdToHex(): Unit source hex found [${unitId.hexCoord}]`
      );
    }

    // Get the target hex
    const targetHex = this.getHex(targetHexCoord);
    if (targetHex === undefined) {
      throw new Error(
        `BWARModel.moveUnitIdToHex(): Unit target hex found [${targetHexCoord}]`
      );
    }

    // Move the unit to target and update source/target unitStacks
    unit.hexCoord = targetHexCoord;
    sourceHex.unitStack.removeUnitId(unitId);
    targetHex.unitStack.addUnitId(unitId);

    // DEBUG output message
    console.log(
      `Unit ${unitId} moved from ${sourceHex.hexCoord.x}, ${sourceHex.hexCoord.y} to ${targetHex.hexCoord.x}, ${targetHex.hexCoord.y}`
    );
  }
}
