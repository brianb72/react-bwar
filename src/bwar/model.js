import { Hex, TerrainNames, TerrainData } from "./models.js";
import { Coordinates } from "./coordinates";
import { OrderOfBattle } from "./order-of-battle";
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

    // Create the order of battle
    this.oob = new OrderOfBattle();

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
        `BWARModel.isHexOnMap(): hexCoord is invalid [${JSON.stringify(
          hexCoord
        )}]]`
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
      throw new Error(
        `BWARModel.getHex(): hexCoord is invalid [${JSON.stringify(hexCoord)}]]`
      );
    }
  }

  /**
   * Add a unit to a hexes unitStack, does not verify if unit exists in other stacks.
   * @param {UnitId} unit UnitId to add to the stack
   * @param {CartCoordinate} targetHexCoord Coordinate of hex to add unit to
   * @throws {Error} Invalid unit, already in units
   */
  insertUnitIdToUnitStack(unitId, targetHexCoord) {
    // Test the inputs
    if (!Number.isInteger(unitId)) {
      throw new Error(
        `BWARModel.insertUnitIdToUnitStack(): Invalid unitId [${unitId}]`
      );
    }

    // Look up the target hex, this will also test targetHexCoord
    const targetHex = this.getHex(targetHexCoord);
    if (!targetHex) {
      throw new Error(
        `BWARModel.insertUnitIdToUnitStack(): targetHexCoord is not on map or invalid. [${JSON.stringify(
          targetHexCoord
        )}]`
      );
    }

    // Add the unitId to the stack
    targetHex.unitStack.addUnitId(unitId);
  }

  /**
   * Removes a unit to a hexes unitStack, no error if unit is not in stack
   * @param {UnitId} unit UnitId to remove from the stack
   * @param {CartCoordinate} targetHexCoord Coordinate of hex to add unit to
   * @throws {Error} Invalid unit, Invalid hex
   */
  removeUnitIdFromUnitStack(unitId, targetHexCoord) {
    // Test the inputs
    if (!Number.isInteger(unitId)) {
      throw new Error(
        `BWARModel.insertUnitIdToUnitStack(): Invalid unitId [${unitId}]`
      );
    }

    // Look up the target hex, this will also test targetHexCoord
    const targetHex = this.getHex(targetHexCoord);
    if (!targetHex) {
      throw new Error(
        `BWARModel.insertUnitIdToUnitStack(): targetHexCoord is not on map or invalid. [${JSON.stringify(
          targetHexCoord
        )}]`
      );
    }

    // Add the unitId to the stack
    targetHex.unitStack.removeUnitId(unitId);
  }

  /**
   * Removes a unit from the OOB and the unitStack of the unit's hex
   * @param {UnitId} unitId Id of unit
   */
  removeUnitId(unitId) {
    // Load the unit
    const unit = this.oob.getUnit(unitId);
    if (unit === undefined) {
      throw new Error(
        `BWARModel.removeUnitId(): Can't load unit Id [${unitId}]`
      );
    }

    // Remove the unit from it's hex unitStack
    this.removeUnitIdFromUnitStack(unitId, unit.hexCoord);

    // Remove the unit from the OOB
    this.oob.removeUnitId(unitId);
  }

  /**
   * Unit is removed from it's current hex and moved to a new hex
   * @param {UntId} unitId Id of Unit to move
   * @param {CartCoordinate} targetHexCoord Coordinate of hex to move to
   * @throws {Error} unitId not found, unit source hex not found, unit target hex not found
   */
  moveUnitIdToHexCoord(unitId, targetHexCoord) {
    // Get the unit
    const unit = this.oob.getUnit(unitId);
    if (unit === undefined) {
      throw new Error(
        `BWARModel.moveUnitIdToHex(): Unit not found [${unitId}]`
      );
    }

    // Get the source hex
    const sourceHex = this.getHex(unit.hexCoord);
    if (sourceHex === undefined) {
      throw new Error(
        `BWARModel.moveUnitIdToHex(): Unit source hex found [${JSON.stringify(
          unitId.hexCoord
        )}]`
      );
    }

    // Get the target hex
    const targetHex = this.getHex(targetHexCoord);
    if (targetHex === undefined) {
      throw new Error(
        `BWARModel.moveUnitIdToHex(): Unit target hex found [${JSON.stringify(
          targetHexCoord
        )}]`
      );
    }

    // Move the unit to target and update source/target unitStacks
    unit.hexCoord = targetHexCoord;
    sourceHex.unitStack.removeUnitId(unitId);
    targetHex.unitStack.addUnitId(unitId);
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
        `BWARModel.moveUnitIdToHex(): Source hex not on map [${JSON.stringify(
          sourceHexCoord
        )}]`
      );
    }

    // Target hex must be valid and be on map
    if (!this.isHexOnMap(targetHexCoord)) {
      throw new Error(
        `BWARModel.moveUnitIdToHex(): Target hex not on map [${JSON.stringify(
          targetHexCoord
        )}]`
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
        // Get the next neighbor coordinate from the list
        const neiCoord = neighborList[i];

        // Neighborlist may contain off map hexes, ignore them
        if (!this.isHexOnMap(neiCoord)) {
          continue;
        }

        // Get the neighbor hex
        let hexNei = this.getHex(neiCoord);
        if (hexNei === undefined) {
          throw new Error(
            `BWARModel.pathfindBetweenHexes(): Could not get neighboring hex ${JSON.stringify(
              neiCoord
            )}`
          );
        }

        // If the neighbors movement cost is undefined it cannot be entered, ignore it
        if (hexNei.moveCost === undefined) {
          continue;
        }

        // Calculate total cost off traveling from hexStart to hexNei
        const neiKey = `${neiCoord.x},${neiCoord.y}`;
        const newCost = dictCostSoFar[curKey] + hexNei.moveCost;

        // Look up the neighbor hex in the cost dictionary to see if it was visited in the past with a cheaper cost
        if (
          dictCostSoFar.hasOwnProperty(neiKey) &&
          newCost >= dictCostSoFar[neiKey]
        ) {
          // This hex was previously visited with a less expensive path, continue and keep the old path information
          continue;
        }

        // The neighbor hex was either not visited or was previously visited with a more expensive path. Our path will become the new less path.
        dictCostSoFar[neiKey] = newCost;
        dictCameFrom[neiKey] = curHexCoord;

        /*
          Hexes are pushed onto the priority queue with a priority value.
          The value is: costOfStep + (A* Heuristic Value)
          Lower values are considered "less expensive" paths and more desirable.
          Using the normal algorithm, paths that visually travel left-right tend to look strange if all step costs are equal.
          Paths will travel NE and go "up", then switch to SE and go "down" to reach the target. "NE NE NE SE SE SE"
          This will cause the path to be "V" shaped.
          The reason is because when hexes have the same cost, the algorithm chooses the path that
          is the earliest hex returned by neighborsOf(). Therefore the order of neighborsOf() is biasing step choice.
          To fix this, whenever the algorithm tries to move 2 steps in the same direction, a very small
          cost is added to that step. Normal move costs can be values like 1-10, but the bias can be 0.1.
          This bias encourages the algorithm to step in different directions each time, so that the
          step pattern is no longer "NE NE NE SE SE SE" but "NE SE NE SE NE SE". This path look more like a straight horizontal line on the screen.
          The priority value then becomes: costOfStep + (A* Heuristic Value) + directionBias
          Additional bias terms can be added if needed to adjust the way that paths appear.
          The pathfinding engine could also be passed values to control additional bias so the caller
          could control how the path looks on the screen.
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
