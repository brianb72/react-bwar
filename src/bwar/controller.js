import { SVG } from "@svgdotjs/svg.js";
import { BWARView } from "./view";
import { BWARModel } from "./model";
import { Coordinates } from "./tools/coordinates";
import { TerrainNames, TerrainData } from "./models";
import { CombatEngine } from "./tools/combat-engine";
import { CRUSADER41 } from "./scenarios/crusader41";
import "@svgdotjs/svg.panzoom.js";
import "./shared-types.js";

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export class BWARController {
  /**
   * Constructor
   * @param {Object} reactSetters React useState() setters
   */
  constructor(reactSetters) {
    this.view = undefined; // Start with no view until .attachView() is called

    // Use a Scenario
    this.scenario = CRUSADER41;
    this.mapHexWidth = this.scenario.mapHexWidth;
    this.mapHexHeight = this.scenario.mapHexHeight;
    console.log(
      `   ...BWAR Constructor Scenario [${this.scenario.name}]: ${
        this.mapHexWidth
      } x ${this.mapHexHeight} [${this.mapHexWidth * this.mapHexHeight}]`
    );
    this.reactSetHeaderTextMessage = reactSetters.setHeaderTextMessage;
    this.reactSetTreeViewData = reactSetters.setTreeViewData;
    this.reactSetSelectedUnitId = reactSetters.setSelectedUnitId;
    this.reactSetUnitData = reactSetters.setUnitData;
    this.reactSetHexdata = reactSetters.setHexData;

    // Loading will not finish until the view is created
    this.reactSetHeaderTextMessage("Loading...");

    this.model = new BWARModel(this.scenario);
    this.combatEngine = new CombatEngine(this.model);

    console.log("=== Order of battle ===");
    console.log(this.model.oob.oob);
    console.log("===                 ===");

    const treeViewData = this.model.oob.getDataForTreeView();
    this.reactSetTreeViewData(treeViewData);
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
        this.reactSetHeaderTextMessage
      );
      this.setupView();
      this.reactSetHeaderTextMessage("Scenario Ready");
    }
    const svgContainer = this.view.getSvgContainer();
    svgContainer.addTo(targetDivElement);
  }

  /* ************************************************************************
        Controller events - Outside calling controller
   ************************************************************************ */

  setSelectedUnitId(unitId) {
    if (unitId === 0) {
      this.updateReactUnitBox(0);
      return;
    }
    const unit = this.model.oob.getUnit(unitId);
    if (unit === undefined) {
      throw new Error(
        `BWARController.setSelectedUnitId(): Could not get unit for unitId [${JSON.stringify(
          unitId
        )}]]`
      );
    }

    const hex = this.model.getHex(unit.hexCoord);
    if (hex === undefined) {
      throw new Error(
        `BWARController.setSelectedUnitId(): Could not get hex for unit [${JSON.stringify(
          unit
        )}]]`
      );
    }

    this.updateReactUnitBox(unit.unitId);
    this.updateReactHexBox(unit.hexCoord);
    hex.unitStack.moveUnitIdToTop(unitId);
    this.view.stackUnitCountersInHex(unit.hexCoord);
    this.view.panToHex(unit.hexCoord);
    this.view.setSelectedHex(unit.hexCoord);
  }

  /**
   * Randomly walk all units on the map to another hex. Units will not end up on the same target hexes.
   */
  randomWalkAllUnits() {
    const toHexes = new Set();
    let targetCoord;
    this.reactSetHeaderTextMessage("Please wait...");
    const unitIds = this.model.oob.getAllUnitIds();
    for (const unitId of unitIds) {
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
      this.moveUnitIdToHexCoord(unitId, targetCoord, false, true, true);
    }
    this.reactSetHeaderTextMessage(
      `Moving units: ${this.view.state.numOfUnitsMoving}`
    );
  }

  /**
   * Toggles displaying coordinates on the view.
   */
  toggleShowCoordinates() {
    this.view.toggleShowCoordinates();
  }

  /* ************************************************************************
        View events - View calling controller
   ************************************************************************ */

  /**
   * Behavior: Set the currently selected hex to the clicked hex.
   * @param {CartCoordinate} clickedHexCoord Coordinates of a hex that was single clicked.
   */
  view_hex_click(clickedHexCoord) {
    if (!clickedHexCoord) {
      this.reactSetHeaderTextMessage("None");
      this.reactSetSelectedUnitId(0);
      this.updateReactUnitBox(0)
      this.updateReactHexBox(undefined);
      return
    }

    if (
      Coordinates.isCoordsEqual(
        this.view.getSelectedHexCoord(),
        clickedHexCoord
      )
    ) {
      this.view.stackUnitCountersInHex(clickedHexCoord, true);
    }
    this.view.setSelectedHex(clickedHexCoord);
    const clickedHex = this.model.getHex(clickedHexCoord);
    if (clickedHex === undefined) {
      throw new Error(
        `BWARController.view_hex_click(): Could not get clicked hex [${JSON.stringify(
          clickedHexCoord
        )}]]`
      );
    }
    const topUnitId = clickedHex.unitStack.getTopUnitId();
    if (topUnitId) {
      const unit = this.model.oob.getUnit(topUnitId);
      if (unit === undefined) {
        this.reactSetSelectedUnitId(0);
        throw new Error(
          `BWARController.view_hex_click(): Could not get unitId [${JSON.stringify(
            topUnitId
          )}]]`
        );
      }
      this.reactSetHeaderTextMessage(`[${unit.symbolName}] ${unit.name}`);
      this.reactSetSelectedUnitId(unit.unitId);
      this.updateReactUnitBox(unit.unitId)
      this.updateReactHexBox(clickedHexCoord);

    } else {
      this.reactSetHeaderTextMessage("None");
      this.reactSetSelectedUnitId(0);
      this.updateReactUnitBox(0)
      this.updateReactHexBox(clickedHexCoord);
    }
  }

  /**
   * Behavior: If the view's selected hex has units, the top unit in the stack pathfinds to the dblclicked hex,
   * and the dblclicked hex becomes the selected hex. If the selected hex has no units, the dblclicked hex becomes
   * the selected hex. If the selected hex and the dblclicked hex are the same and have units, cycle the unit stack.
   * If a unit tries to pathfind and there is no path, nothing happens.
   * @param {CartCoordinate} clickedHexCoord Coordinates of the hex that was double clicked.
   */
  view_hex_dblclick(clickedHexCoord) {
    // Get the hex that was double clicked
    const clickedHex = this.model.getHex(clickedHexCoord);
    if (clickedHex === undefined) {
      throw new Error(
        `BWARController.view_hex_dblclick(): Could not get double clicked hex [${JSON.stringify(
          clickedHexCoord
        )}]]`
      );
    }

    // Get the selected hex coordinates from the view
    const selectedHexCoord = this.view.getSelectedHexCoord();

    // If the dblclicked hex is the same as the selected hex, cycle the units in the stack
    if (Coordinates.isCoordsEqual(selectedHexCoord, clickedHexCoord)) {
      clickedHex.unitStack.cycleUnits();
      this.view.stackUnitCountersInHex(clickedHexCoord);
      const newTopUnitId = clickedHex.unitStack.getTopUnitId();
      const newTopUnit = this.model.oob.getUnit(newTopUnitId);
      if (newTopUnit === undefined) {
        throw new Error(
          `BWARController.view_hex_dblclick(): Could not new top unit of hex [${JSON.stringify(
            newTopUnitId
          )}]`
        );
      }
      this.reactSetHeaderTextMessage(
        `[${newTopUnit.symbolName}] ${newTopUnit.name}`
      );
      return;
    }

    // Get the selected hex and it's top unit
    const selectedHex = selectedHexCoord
      ? this.model.getHex(selectedHexCoord)
      : undefined;
    const selectedHexTopUnitId = selectedHex
      ? selectedHex.unitStack.getTopUnitId()
      : undefined;

    // If the selected hex has no units, the clicked hex becomes the new selected hex
    if (selectedHexTopUnitId === undefined) {
      this.view.setSelectedHex(clickedHexCoord);
      return;
    }

    // Find the top unit of the clicked hex
    const clickedHexTopUnitId = clickedHex.unitStack.getTopUnitId();

    // If there is no unit, move there
    if (!clickedHexTopUnitId) {
      this.moveUnitIdToHexCoord(
        selectedHexTopUnitId,
        clickedHexCoord,
        true,
        true,
        false
      );
      return;
    }

    // If the clicked hex unit is our side, move there
    if (
      this.model.oob.areUnitsOnSameSide(
        selectedHexTopUnitId,
        clickedHexTopUnitId
      )
    ) {
      this.moveUnitIdToHexCoord(
        selectedHexTopUnitId,
        clickedHexCoord,
        true,
        true,
        false
      );
      return;
    }

    // The clicked hex unit is not our side, start combat
    const attackerHexCoord = selectedHexCoord;
    const defenderHexCoord = clickedHexCoord;

    // Combat hexes must be adjacent, otherwise abort
    if (Coordinates.hexDistance(attackerHexCoord, defenderHexCoord) > 1) {
      this.reactSetHeaderTextMessage("Too far");
      return;
    }

    const attackerUnitId = selectedHexTopUnitId;
    const defenderUnitId = clickedHexTopUnitId;

    const { attResultCondition, defResultCondition } =
      this.combatEngine.combatSingle(attackerUnitId, defenderUnitId);

    // If the defender was destroyed remove it, otherwise update condition
    if (defResultCondition > 0) {
      this.model.oob.setUnitIdPercentCondition(
        defenderUnitId,
        defResultCondition
      );
      this.view.updateUnitIdCounter(defenderUnitId);
    } else {
      this.view.removeUnitId(defenderUnitId);
      this.model.removeUnitId(defenderUnitId);
    }

    // If the attacker was destroyed remove it, otherwise update condition
    if (attResultCondition > 0) {
      // Attacker Survived
      this.model.oob.setUnitIdPercentCondition(
        attackerUnitId,
        attResultCondition
      );
      this.view.updateUnitIdCounter(attackerUnitId);
      // If the defender died, and the target stack has no more units, move into it
      if (
        defResultCondition <= 0 &&
        clickedHex.unitStack.getUnitCountInStack() < 1
      ) {
        // Move in, this will trigger a restack after the animation finishes
        this.model.moveUnitIdToHexCoord(attackerUnitId, defenderHexCoord);
        this.view.animationMoveUnitOnPath(
          attackerUnitId,
          [attackerHexCoord, defenderHexCoord],
          true
        );
      } else {
        // If there are more units in the hex, just restack both
        this.view.stackUnitCountersInHex(attackerHexCoord);
        this.view.stackUnitCountersInHex(defenderHexCoord);
      }
    } else {
      // Attacker Destroyed
      this.view.removeUnitId(attackerUnitId);
      this.model.removeUnitId(attackerUnitId);
      // restack both
      this.view.stackUnitCountersInHex(attackerHexCoord);
      this.view.stackUnitCountersInHex(defenderHexCoord);
    }

    // Update the header based on the result
    if (defResultCondition > 0 && attResultCondition > 0) {
      this.reactSetHeaderTextMessage("Defender Held");
    } else if (defResultCondition <= 0 && attResultCondition > 0) {
      this.reactSetHeaderTextMessage("Attacker Won");
    } else if (defResultCondition > 0 && attResultCondition <= 0) {
      this.reactSetHeaderTextMessage("Defender Won");
    } else {
      this.reactSetHeaderTextMessage("Both Destroyed");
    }
  }

  /**
   * Reports how many units on the view are currently running animations
   * @returns {number} How many units are currently running animations
   */
  getNumberOfUnitsAnimating() {
    if (this.view) {
      return this.view.state.numOfUnitsMoving;
    } else {
      return 0;
    }
  }

  /**
   * Called by the view every time an animation ends with reporting enabled. Update the header and button.
   * @param {numbers} numOfUnitsMoving How many units are currently running animations
   */
  viewUnitAnimationEnded(numOfUnitsMoving) {
    if (numOfUnitsMoving) {
      this.reactSetHeaderTextMessage(`Moving units: ${numOfUnitsMoving}`);
    } else {
      this.reactSetHeaderTextMessage("None");
    }
  }

  /* ************************************************************************
        Units utility
   ************************************************************************ */


  updateReactUnitBox(unitId) {
    if (unitId === 0) { 
      this.reactSetUnitData({}) 
      return;
    }

    const unit = this.model.oob.getUnit(unitId);
    if (unit === undefined) {
      throw new Error(
        `BWARController.updateReactUnitBox(): Could not get unitId [${JSON.stringify(
          unitId
        )}]`
      );
    }

    const newSvg = SVG()
    const unitSvg = unit.svgLayers.base.clone().move(0,0).transform({})
    const bbox = unitSvg.bbox()
    unitSvg.addTo(newSvg)
    newSvg.size(bbox.width, bbox.height)

    this.reactSetUnitData({
      symbolName: unit.symbolName,
      forceName: this.model.oob.getForceName(unit.forceId),
      formationName: this.model.oob.getFormationName(unit.formationId),
      unitName: this.model.oob.getUnitName(unit.unitId),
      valueString: `${unit.values.attackSoft || 0} - ${unit.values.attackHard || 0} - ${unit.values.defense || 0}`,
      svgUnit: newSvg,
    })
  }

  updateReactHexBox(hexCoord) {
    if (!hexCoord) { 
      this.reactSetHexdata({})
      return
    }

    const hex = this.model.getHex(hexCoord);
    if (hex === undefined) {
      throw new Error(
        `BWARController.updateReactHexBox(): Could not get hex [${JSON.stringify(
          hexCoord
        )}]`
      );
    }
    
    const newSvg = SVG()
    const hexSvg = hex.hexSvg.clone().move(0, 0).transform({})
    hexSvg.attr("stroke-width", 1)
    const bbox = hexSvg.bbox()
    hexSvg.addTo(newSvg)
    newSvg.size(bbox.width * 1.05, bbox.height * 1.05)

    this.reactSetHexdata({ 
      terrainName: TerrainData[hex.terrainId]?.name,
      svgHex: newSvg,
    })
  }

  /**
   * Moves a unit by pathfinding between unit hex and target hex in both the view and model
   * @param {UnitId} unitId Id of unit to move
   * @param {CartCoordinate} targetHexCoord Hex coordinate to move unit to
   * @param {boolean} shouldUpdateSelectedHex Should the updated hex be set to targetHexCoord
   * @param {boolean} shouldAnimateMove Should the move be animated
   * @returns {boolean} True if a path was found and the unit moved, false if the unit did not move for any reason
   */
  moveUnitIdToHexCoord(
    unitId,
    targetHexCoord,
    shouldUpdateSelectedHex = true,
    shouldAnimateMove = true,
    shouldSignalMoveEnd = true
  ) {
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
        this.view.animationMoveUnitOnPath(
          unitId,
          pathFindingHexCoords,
          shouldUpdateSelectedHex,
          shouldSignalMoveEnd
        );
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
    for (const lineHex of Coordinates.lineBetweenTwoHexes(
      sourceHexCoord,
      targetHexCoord
    )) {
      this.setMapTerrainId(lineHex.x, lineHex.y, terrainId);
    }
  }

  scenarioCombatTesting() {
    // Colors
    const colorsRedForce = {
      counterForeground: "#000000",
      counterBackground: "#FF0000",
      symbolForeground: "#FFFFFF",
      symbolBackground: "#505050",
    };
    const colorsBlueForce = {
      counterForeground: "#000000",
      counterBackground: "#1E90FF",
      symbolForeground: "#000000",
      symbolBackground: "#DCDCDC",
    };

    // Create basic terrain
    this.lineBetweenHexes({ x: 2, y: 1 }, { x: 6, y: 2 }, TerrainNames.Road);
    this.setMapTerrainId(1, 2, TerrainNames.City);
    this.setMapTerrainId(7, 2, TerrainNames.City);

    // Create overall structure of both sides
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

    // Unit vaules to use
    const valuesInfantry = {
      attackSoft: 5,
      attackHard: 1,
      defend: 5,
      moves: 3,
      unitSize: "III",
      percentCondition: 1.0,
      unitType: "Soft",
    };
    const valuesTank = {
      attackSoft: 5,
      attackHard: 5,
      defend: 8,
      moves: 8,
      unitSize: "I",
      percentCondition: 1.0,
      unitType: "Hard",
    };
    const valuesMechInfantry = {
      attackSoft: 6,
      attackHard: 3,
      defend: 5,
      moves: 6,
      unitSize: "II",
      percentCondition: 1.0,
      unitType: "Hard",
    };

    const createRedUnit = (x, y, symbolName, values) => {
      const redHexCoord = Coordinates.makeCart(x, y);
      const s_a_unit_1 = oob.createUnit(
        s_a_force_1,
        s_a_formation_1,
        "Red Unit A-1-1-1",
        redHexCoord,
        colorsRedForce,
        symbolName,
        "III",
        values
      );
      this.model.insertUnitIdToUnitStack(s_a_unit_1, redHexCoord);
    };

    const createBlueUnit = (x, y, symbolName, values) => {
      const blueHexCoord = Coordinates.makeCart(x, y);
      const s_b_unit_1 = oob.createUnit(
        s_b_force_1,
        s_b_formation_1,
        "Blue Unit B-1-1-1",
        blueHexCoord,
        colorsBlueForce,
        symbolName,
        "III",
        values
      );
      this.model.insertUnitIdToUnitStack(s_b_unit_1, blueHexCoord);
    };

    createRedUnit(1, 2, "Mechanized Infantry", valuesMechInfantry);
    createRedUnit(3, 2, "Infantry", valuesInfantry);
    createRedUnit(2, 2, "Infantry", valuesInfantry);
    createRedUnit(3, 1, "Infantry", valuesInfantry);
    createRedUnit(2, 1, "Tank", valuesTank);

    createBlueUnit(7, 2, "Mechanized Infantry", valuesMechInfantry);
    createBlueUnit(4, 2, "Infantry", valuesInfantry);
    createBlueUnit(3, 3, "Infantry", valuesInfantry);
    createBlueUnit(4, 1, "Infantry", valuesInfantry);
    createBlueUnit(5, 2, "Tank", valuesTank);
  }
}
