import { BWARView } from "./view";
import { BWARModel } from "./model";
import { Coordinates } from "./coordinates";
import { TerrainNames, TerrainData } from "./models";

import "@svgdotjs/svg.panzoom.js";
import "./shared-types.js";

export class BWARController {
  /**
   * Constructor
   * @param {number} mapHexWidth Number of hexes wide
   * @param {number} mapHexHeight Number of hexes tall
   * @param {Function} setLastHexClicked React useState() setter
   */
  constructor(mapHexWidth, mapHexHeight, setLastHexClicked) {
    console.log(
      `   ...BWAR Constructor mapSize: ${mapHexWidth} x ${mapHexHeight}`
    );
    this.view = undefined;
    this.mapHexWidth = mapHexWidth;
    this.mapHexHeight = mapHexHeight;
    this.mapSize = { height: mapHexHeight, width: mapHexWidth };
    this.setLastHexClicked = setLastHexClicked;
    this.model = new BWARModel(mapHexWidth, mapHexHeight);

    // Add some map terrain
    this.setMapTerrainId(0, 2, TerrainNames.Water);
    this.setMapTerrainId(1, 2, TerrainNames.Water);
    this.setMapTerrainId(2, 2, TerrainNames.Water);
    this.setMapTerrainId(2, 3, TerrainNames.Water);
    this.setMapTerrainId(3, 4, TerrainNames.Water);
    this.setMapTerrainId(4, 3, TerrainNames.Road);
    this.setMapTerrainId(5, 4, TerrainNames.Water);
    this.setMapTerrainId(6, 3, TerrainNames.Water);
    this.setMapTerrainId(4, 4, TerrainNames.Road);
    this.setMapTerrainId(4, 5, TerrainNames.Road);
    this.setMapTerrainId(4, 6, TerrainNames.Road);
    this.setMapTerrainId(4, 2, TerrainNames.Road);
    this.setMapTerrainId(4, 1, TerrainNames.Road);
    this.setMapTerrainId(5, 1, TerrainNames.Road);
    this.setMapTerrainId(6, 0, TerrainNames.Road);
    this.setMapTerrainId(6, 0, TerrainNames.Road);
    this.setMapTerrainId(1, 5, TerrainNames.Hill);
    this.setMapTerrainId(0, 5, TerrainNames.Hill);
    this.setMapTerrainId(0, 4, TerrainNames.Hill);

    // Create some sides and units. Numbers used here are just string names, the actual
    // id's that get used are decided by oob

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
    const s_a_hexCoord = Coordinates.makeCart(4, 4);
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

    const s_b = oob.createSide("Blue Side");
    const s_b_force_1 = oob.createForce(s_b, "Blue Force B-1");
    const s_b_formation_1 = oob.createFormation(
      s_b_force_1,
      "Blue Formation B-1-1"
    );
    const s_b_hexCoord = Coordinates.makeCart(3, 3);
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

    console.log("=== Order of battle ===");
    console.log(oob.oob);
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

  /* ************************************************************************
        Units utility
   ************************************************************************ */

  /**
   * Moves a unit by pathfinding between unit hex and target hex in both the view and model
   * @param {UnitId} unitId Id of unit to move
   * @param {CartCoordinate} targetHexCoord Hex coordinate to move unit to
   * @returns {boolean} True if a path was found and the unit moved, false if the unit did not move for any reason
   */
  moveUnitIdToHexCoord(unitId, targetHexCoord, animate = true) {
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
      if (animate) {
        this.view.animationMoveUnitOnPath(unitId, pathFindingHexCoords, true);
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
}
