import { BWARView } from "./view";
import { BWARModel } from "./model";
import { Coordinates } from "./coordinates";
import { TerrainNames, TerrainData } from "./models";
import "@svgdotjs/svg.panzoom.js";
import "./shared-types.js";

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export class BWARController {
  /**
   * Constructor
   * @param {number} mapHexWidth Number of hexes wide
   * @param {number} mapHexHeight Number of hexes tall
   * @param {Function} setHeaderTextMessage React useState() setter
   */
  constructor(mapHexWidth, mapHexHeight, setHeaderTextMessage) {
    console.log(
      `   ...BWAR Constructor mapSize: ${mapHexWidth} x ${mapHexHeight}`
    );
    this.view = undefined;
    this.mapHexWidth = mapHexWidth;
    this.mapHexHeight = mapHexHeight;
    this.mapSize = { height: mapHexHeight, width: mapHexWidth };
    this.setLastHexClicked = setHeaderTextMessage;
    this.model = new BWARModel(mapHexWidth, mapHexHeight);

    // Create a basic map
    this.scenarioCitiesAndRoads();
    
    // Create two sides and some units
    this.oobRedVsBlue();

    console.log("=== Order of battle ===");
    console.log(this.model.oob);
    console.log("===                 ===");
  }




  /**
   * Do anything needed on view creation
   */
  setupView() {
    this.view.createUnitCountersForAllUnits();
  }

  /**
   * Create a new view or reuse the old view, and attach to the target div
   * @param {Object} targetDivElement div in the DOM that holds the SVG
   */
  attachView(targetDivElement) {
    if (this.view) {
      console.log("   ...BWARVIEW exists, reusing");
    } else {
      this.view = new BWARView(
        this,
        this.model,
        this.mapHexWidth,
        this.mapHexHeight,
        this.setLastHexClicked
      );
      this.setupView();
    }
    const svgContainer = this.view.getSvgContainer();
    svgContainer.addTo(targetDivElement);
  }

  /* ************************************************************************
        View events
   ************************************************************************ */

  /**
   * Behavior: Set the currently selected hex to the clicked hex.
   * @param {CartCoordinate} hexCoord Coordinates of a hex that was single clicked.
   */
  view_hex_click(hexCoord) {
    console.log("click", hexCoord);
    this.view.setSelectedHex(hexCoord);
  }

  /**
   * Behavior: If the view's selected hex has units, the top unit in the stack pathfinds to the dblclicked hex,
   * and the dblclicked hex becomes the selected hex. If the selected hex has no units, the dblclicked hex becomes
   * the selected hex. If the selected hex and the dblclicked hex are the same and have units, cycle the unit stack.
   * If a unit tries to pathfind and there is no path, nothing happens.
   * @param {CartCoordinate} clickedHexCoord Coordinates of the hex that was double clicked.
   */
  view_hex_dblclick(clickedHexCoord) {
    console.log("dblclick", clickedHexCoord);

    // Get the hex that was double clicked
    const clickedHex = this.model.getHex(clickedHexCoord);
    if (clickedHex === undefined) {
      throw new Error(
        `BWARController.view_hex_dblclick(): Could not get double clicked hex [${JSON.stringify(
          clickedHexCoord
        )}]]`
      );
    }

    // Get the selected hex, and if it exists the top unit id
    const selectedHexCoord = this.view.getSelectedHexCoord();
    const selectedHex = this.model.getHex(selectedHexCoord);
    const topUnitId = selectedHex
      ? selectedHex.unitStack.getTopUnitId()
      : undefined;

    // If there is topUnitId, pathfind it to the clicked hex.
    // This also updates selected hex at the end of the animation, don't do it here.
    if (topUnitId !== undefined) {
      this.moveUnitIdToHexCoord(topUnitId, clickedHexCoord, true);
      return;
    }

    // The selected hex has no units, clicked hex becomes new selected hex.
    this.view.setSelectedHex(clickedHexCoord);
  }


  viewUnitAnimationEnded(numOfUnitsMoving) {
    this.setLastHexClicked(numOfUnitsMoving);
  }

  /* ************************************************************************
        Units utility
   ************************************************************************ */

  /**
   * Moves a unit by pathfinding between unit hex and target hex in both the view and model
   * @param {UnitId} unitId Id of unit to move
   * @param {CartCoordinate} targetHexCoord Hex coordinate to move unit to
   * @param {boolean} shouldUpdateSelectedHex Should the updated hex be set to targetHexCoord
   * @param {boolean} shouldAnimateMove Should the move be animated
   * @returns {boolean} True if a path was found and the unit moved, false if the unit did not move for any reason
   */
  moveUnitIdToHexCoord(unitId, targetHexCoord, shouldUpdateSelectedHex = true, shouldAnimateMove = true) {
    const unit = this.model.oob.getUnit(unitId);
    if (!unit) {
      throw new Error(
        `BWARController.moveUnitIdtoHexCoord(): unitId not found [${JSON.stringify(
          unitId
        )}]`
      );
    }
    const sourceHexCoord = unit.hexCoord;

    // Ignore if the source and target are the same
    if (Coordinates.isCoordsEqual(sourceHexCoord, targetHexCoord)) {
      return false;
    }

    // Pathfind to target, if path < 2 a route could not be found and the move is ignored
    const pathFindingHexCoords = this.model.pathfindBetweenHexes(
      sourceHexCoord,
      targetHexCoord
    );
    if (pathFindingHexCoords.length < 2) {
      return false;
    }

    // If there is a view, move the unit on the view
    if (this.view) {
      if (shouldAnimateMove) {
        this.view.animationMoveUnitOnPath(unitId, pathFindingHexCoords, shouldUpdateSelectedHex);
      } else {
        this.view.moveUnitIdToHexCoord(unitId, targetHexCoord);
      }
    }

    // Move the unit in the model
    this.model.moveUnitIdToHexCoord(unitId, targetHexCoord);
    return true;
  }

  /* ************************************************************************
        Misc utility
   ************************************************************************ */

  /**
   * Sets the terrainId of a hex
   * @param {number} x X coordinate
   * @param {number} y Y coordinate
   * @param {number} terrainId Id of terrain to set hex to
   */
  setMapTerrainId(x, y, terrainId) {
    const hexCoord = Coordinates.makeCart(x, y);
    const hex = this.model.getHex(hexCoord);
    hex.terrainId = terrainId;
    hex.moveCost = TerrainData[terrainId].moveCost;
  }


  /**
   * Draws a straight line between two hexes using a TerrainId as hex type
   * @param {CartCoordinate} sourceHexCoord Starting hex
   * @param {CartCoordinate} targetHexCoord Ending hex
   * @param {TerrainId} terrainId Draw line using TerrainId
   */
  lineBetweenHexes(sourceHexCoord, targetHexCoord, terrainId) {
    for (const lineHex of Coordinates.lineBetweenTwoHexes(sourceHexCoord, targetHexCoord)) {
      this.setMapTerrainId(lineHex.x, lineHex.y, terrainId);
    }
  }

  /**
   * Randomly walk all units on the map to another hex. Units will not end up on the same target hexes.
   */
  randomWalkAllUnits() {
    const toHexes = new Set();
    let targetCoord;
    for (const unitId of this.model.oob.getAllUnitIds()) {
      while (true) {
        targetCoord = Coordinates.makeCart(
          getRandomInt(this.mapHexWidth),
          getRandomInt(this.mapHexHeight)
        );
        const tKey = `${targetCoord.x},${targetCoord.y}`;
        if (!toHexes.has(tKey)) {
          toHexes.add(tKey);
          break;
        }
      }
      this.moveUnitIdToHexCoord(unitId, targetCoord, false);
    }
  }

  /**
   * Create a basic scenario with some cities and roads between them. There is a 50-50 chance
   * the roads will be created with pathfinding vs straight line.
   */
  scenarioCitiesAndRoads() {
    // Place random hills
    for (let terrainCount = 0; terrainCount < 300; ++terrainCount) {
      this.setMapTerrainId(
        getRandomInt(this.mapHexWidth),
        getRandomInt(this.mapHexHeight),
        TerrainNames.Hill
      );
    }

    // A list of cities
    const cities = [ { x: 6, y: 4 }, { x: 24, y: 2 }, { x: 42, y: 8 }, { x: 57, y: 4 },
      { x: 67, y: 3 }, { x: 67, y: 15 }, { x: 61, y: 25 }, { x: 38, y: 26 }, { x: 13, y: 25 },
      { x: 3, y: 20 }, { x: 7, y: 14 }, { x: 6, y: 4 }    ]

    // Walk through the cities
    for (let i = 1; i < cities.length; ++i) {
      let hexCoords;
      if (getRandomInt(10) < 5) {
        hexCoords = Coordinates.lineBetweenTwoHexes(cities[i-1], cities[i]);
      } else {
        hexCoords = this.model.pathfindBetweenHexes(cities[i-1], cities[i]);
      }
      // Draw the hexes on the path
      for (const drawToHex of hexCoords) {
        this.setMapTerrainId(drawToHex.x, drawToHex.y, TerrainNames.Road);
      }
      // Draw both cities
      this.setMapTerrainId(cities[i-1].x, cities[i-1].y, TerrainNames.City);
      this.setMapTerrainId(cities[i].x, cities[i].y, TerrainNames.City);
    }

  }

  /**
   * Setup sample Red vs Blue sides with units on the OOB
   */
  oobRedVsBlue() {
    const colorsRedForce = {
      counterForeground: "#000000",
      counterBackground: "#FF0000",
      symbolForeground: "#FFFFFF",
      symbolBackground: "#000000",
    };
    const colorsBlueForce = {
      counterForeground: "#000000",
      counterBackground: "#00FF00",
      symbolForeground: "#FFFFFF",
      symbolBackground: "#000000",
    };

    const oob = this.model.oob;
    const s_a = oob.createSide("Red Side");
    const s_a_force_1 = oob.createForce(s_a, "Red Force A-1");
    const s_a_formation_1 = oob.createFormation(
      s_a_force_1,
      "Red Formation A-1-1"
    );

    const s_b = oob.createSide("Blue Side");
    const s_b_force_1 = oob.createForce(s_b, "Blue Force B-1");
    const s_b_formation_1 = oob.createFormation(
      s_b_force_1,
      "Blue Formation B-1-1"
    );

    for (let redCount = 0; redCount < 20; ++redCount) {
      const s_a_hexCoord = Coordinates.makeCart(
        getRandomInt(this.mapHexWidth),
        getRandomInt(this.mapHexHeight)
      );
      const s_a_unit_1 = oob.createUnit(
        s_a_force_1,
        s_a_formation_1,
        "Red Unit A-1-1-1",
        s_a_hexCoord,
        colorsRedForce,
        "Infantry",
        "III",
        { attack: 5, defense: 5, moves: 5 }
      );
      this.model.insertUnitIdToUnitStack(s_a_unit_1, s_a_hexCoord);

      const s_b_hexCoord = Coordinates.makeCart(
        getRandomInt(this.mapHexWidth),
        getRandomInt(this.mapHexHeight)
      );
      const s_b_unit_1 = oob.createUnit(
        s_b_force_1,
        s_b_formation_1,
        "Blue Unit B-1-1-1",
        s_b_hexCoord,
        colorsBlueForce,
        "Infantry",
        "XX",
        { attack: 25, defense: 25, moves: 5 }
      );
      this.model.insertUnitIdToUnitStack(s_b_unit_1, s_b_hexCoord);
    }
  }
  
}
