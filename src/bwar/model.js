import { Unit, Hex, TerrainNames } from "./models.js";
import { Coordinates } from "./coordinates";
import "./shared-types.js";

export class BWARModel {
  constructor(mapHexWidth, mapHexHeight, scenario) {
    this.mapHexWidth = mapHexWidth;
    this.mapHexHeight = mapHexHeight;
    this.scenario = scenario;

    // Create the unit dictionary
    this.units = {}

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
   * @returns {boolean} True if coordinate is on map
   */
  isHexOnMap(hexCoord) {
    try {
      const { x, y } = hexCoord;
      return x >= 0 && x < this.mapHexWidth && y >= 0 && y < this.mapHexHeight;
    } catch {
      console.log("bwar/model isHexOnMap invalid cordinates: ", hexCoord);
      return false;
    }
  }

  /**
   * Gets a HexModel by CartCoordinate
   * @param {CartCoordinate} hexCoord Coordinate of hex to get
   * @returns {HexModel | undefined}   Hex object requested
   */
  getHex(hexCoord) {
    try {
      if (!this.isHexOnMap(hexCoord)) {
        return undefined;
      }
      return this.hexMap[hexCoord.y][hexCoord.x];
    } catch {
      console.log("bwar/model isHexOnMap invalid cordinates: ", hexCoord);
      return undefined;
    }
  }


  /**
   * Get a UnitModel by UnitId
   * @param {UnitId} unitId Id of unit to get
   * @returns {UnitModel}
   */
  getUnit(unitId) {
    return this.units[unitId]
  }

  /**
   * Add a UnitModel to the unit list
   * @param {UnitModel} unit Unit to add to the list
   * @throws {Error}    Invalid unit or Already in units
   */
  addUnit(unit) {
    if (!unit || !Number.isInteger(unit.unitId)) {
        throw new Error(`BWARModel.addUnit(): Invalid unit [${unit}]`)
    }
    if (this.units.hasOwnProperty(unit.unitId)) {
        throw new Error(`BWARModel.addUnit(): Unit is already in units. [${unit}]`)
    }
    this.units[unit.unitId] = unit;
  }

}
