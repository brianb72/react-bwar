import { Hex, TerrainNames, TerrainData } from "./models.js";
import { Coordinates } from "./coordinates";
import TinyQueue from "tinyqueue";
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

    const defaultHexTerrainId = TerrainNames.Grass;

    // Create the map array
    this.hexMap = new Array(mapHexHeight);
    for (let y = 0; y < mapHexHeight; ++y) {
      this.hexMap[y] = new Array(mapHexWidth);
      for (let x = 0; x < mapHexWidth; ++x) {
        this.hexMap[y][x] = new Hex({
          hexCoord: Coordinates.makeCart(x, y),
          terrainId: defaultHexTerrainId,
          moveCost: TerrainData[defaultHexTerrainId].moveCost,
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

  /**
   * Pathfind between two hexes on the map. Both hexes must be on map. This operation is expensive on large maps.
   * @param {CartCoordinate} sourceHexCoord Hex to start from
   * @param {CartCoordinate} targetHexCoord Hex to travel to
   * @returns {Array.<CartCoordinate>} Array of hex coordinates on the found path, or empty if no path.
   * @throws {Error} Source or target not on map, sanity exceeded, could not find neighbor hex
   */
  pathfindBetweenHexes(sourceHexCoord, targetHexCoord) {
    // Source hex must be valid and be on map
    if (!this.isHexOnMap(sourceHexCoord)) {
      throw new Error(
        `BWARModel.moveUnitIdToHex(): Source hex not on map [${sourceHexCoord}]`
      );
    }

    // Target hex must be valid and be on map
    if (!this.isHexOnMap(targetHexCoord)) {
      throw new Error(
        `BWARModel.moveUnitIdToHex(): Target hex not on map [${targetHexCoord}]`
      );
    }

    // Frontiner contains neighboring hexes to be explored, lower values of priority are higher priority
    const frontier = new TinyQueue([], function (a, b) {
      return a.priority - b.priority;
    });

    // Push the source coordinate onto the frontier as the first hex
    frontier.push({
      coord: { x: sourceHexCoord.x, y: sourceHexCoord.y },
      priority: 0,
      distance: 0,
      lastDir: undefined,
    });

    // Dictionaries to track which direction we came from and cost so far, seed with no initial direction and 0 cost
    const dictCameFrom = {};
    const dictCostSoFar = {};
    let curKey = `${sourceHexCoord.x},${sourceHexCoord.y}`;
    dictCameFrom[curKey] = undefined;
    dictCostSoFar[curKey] = 0;

    // Sanity check for while loop to avoid infinite loop. If sanity less than 0, abort.
    var sanity = 100000; // TODO find best value
    var pathFound = false;

    // Loop through the frontier pulling the lowest priority hex
    while (frontier.length) {
      if (--sanity < 0) {
        throw new Error(
          "BWARModel.pathfindBetweenHexes(): Pathfinding failed on sanity < 0 check to avoid infinite loop"
        );
      }

      // Get the lowest priority frontier hex from the priority queue.
      // If that hex is our target, a path has been found, break now.
      const frontierHex = frontier.pop();
      const curHexCoord = frontierHex.coord;
      if (
        curHexCoord.x === targetHexCoord.x &&
        curHexCoord.y === targetHexCoord.y
      ) {
        pathFound = true;
        break;
      }
      curKey = `${curHexCoord.x},${curHexCoord.y}`;

      // Get a list of neighboring hex coordinates and loop through them
      var neighborList = Coordinates.neighborsOf(curHexCoord);
      for (let i = 0, le = neighborList.length; i < le; ++i) {
        // Get the hex for the current neighbor coordinates
        const neiCoord = neighborList[i];

        if (!this.isHexOnMap(neiCoord)) {
          continue;
        }

        let hexNei = this.getHex(neiCoord);
        if (hexNei === undefined) {
          throw new Error(
            `BWARModel.pathfindBetweenHexes(): Could not get neighboring hex ${neiCoord.x},${neiCoord.y}`
          );
        }

        // Hexes with undefined movement costs cannot be entered, ignore
        if (hexNei.moveCost === undefined) {
          continue;
        }

        // Calculate total cost off traveling from hexStart to hexNei
        const neiKey = `${neiCoord.x},${neiCoord.y}`;
        const newCost = dictCostSoFar[curKey] + hexNei.moveCost;

        /* Look up the neighbor hex in the cost dictionary and see if it was
                 visited in the past with a cheaper cost than newCost. */
        if (
          dictCostSoFar.hasOwnProperty(neiKey) &&
          newCost >= dictCostSoFar[neiKey]
        ) {
          /* The hex was visited in the past with a less expensive path than the path
                     being considered here. Continue and keep the old path. */
          continue;
        }

        /* The hex was either not visited, or the path being considered here
                 has a lower cost. Add/replace the neighbors values in the dictionaries. */
        dictCostSoFar[neiKey] = newCost;
        dictCameFrom[neiKey] = curHexCoord;

        /* The neighbor hex will be pushed onto the Priority Queue.
              The priority is newCost + A* Herustic value * directionExtraCost
              For the priority value a lower value is higher priority. The lowest
              priority value will be .pop()ed off the queue.
            directionExtraCost adds a penalty for moving in the same direction
              two steps in a row. Without this bias, paths that go left/right on
              the hex map tend to move up as they travel right, then travel down
              to reach the target. Or down at first, then up. This creates a U shaped
              path that does not look straight. If two neighbors have the same herustic,
              their order will be determined by the order that neighborsOf() returns,
              which encourages moving in the same direction.
              By adding a penalty to moving in the same direction twice, the path
              is encouraged to zig/zag as it travels, making left/right paths look
              more 'straight'
            Additional biases can be added to adjust the way paths look on the screen.
        */
        let distance = Coordinates.hexDistance(targetHexCoord, neiCoord);
        const neiDirection = Coordinates.neighborsWhichDirection(
          curHexCoord,
          neiCoord
        );
        const directionExtraCost =
          neiDirection === frontierHex.lastDir ? 0.1 : 0;
        const heuristic = distance * hexNei.moveCost;
        const priority = newCost + heuristic + directionExtraCost;

        // Push the neighbor onto frontier queue
        frontier.push({
          coord: neiCoord,
          priority: priority,
          distance: distance,
          lastDir: neiDirection,
        });
      }
    }

    // Frontier walking loop has finished, if we did not find a path return empty array
    if (!pathFound) {
      return [];
    }
    sanity = 10000; // TODO adjust value

    // Use dirCameFrom to walk backwards from endCoord to startCoord.
    var pathBack = [targetHexCoord];
    curKey = `${targetHexCoord.x},${targetHexCoord.y}`;

    while (dictCameFrom[curKey] !== undefined) {
      if (sanity-- < 0) {
        throw new Error(
          `BWARModel.pathfindBetweenHexes(): Sanity value hit in while() loop backwalking path`
        );
      }
      const cameFromCoord = dictCameFrom[curKey];
      pathBack.push(cameFromCoord);
      curKey = `${cameFromCoord.x},${cameFromCoord.y}`;
    }

    // Return the reversed path which walks from from sourceHexCoord to targetHexCoord with the least cost
    return pathBack.reverse();
  }
}
