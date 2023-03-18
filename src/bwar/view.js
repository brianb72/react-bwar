import { SVG } from "@svgdotjs/svg.js";
import { Coordinates } from "./coordinates";
import { TerrainData, SvgLayers } from "./models";
import { SymbolDraw } from "./symbol-draw";
import "./shared-types.js";

const HEXPIXELRADIUS = 57; // Sets size of hexes in pixels
const PIXELCOUNTERWIDTH = 64;
const PIXELCOUNTERHEIGHT = 56;

export class BWARView {
  /**
   * Constructor
   * @param {Object} controller The controller this view is attached to
   * @param {Object} model The model to be used by this view
   * @param {number} mapHexWidth Number of hexes wide
   * @param {number} mapHexHeight Number of hexes tall
   * @param {Function} setLastHexClicked React useState() setter to update text on DOM
   */
  constructor(controller, model, mapHexWidth, mapHexHeight, setLastHexClicked) {
    console.log(
      `   ...BWARView Constructor mapSize: ${mapHexWidth} x ${mapHexHeight} [${
        mapHexWidth * mapHexHeight
      }]`
    );
    this.controller = controller;
    this.model = model;
    this.mapHexWidth = mapHexWidth;
    this.mapHexHeight = mapHexHeight;
    this.setLastHexClicked = setLastHexClicked;

    const hexPixelWidth = HEXPIXELRADIUS * 2;
    const hexPixelHeight = HEXPIXELRADIUS * Math.sqrt(3);

    // Holds information about hex, pixel, and map geometry
    this.geometry = {
      mapHexWidth: mapHexWidth,
      mapHexHeight: mapHexHeight,
      mapPixelWidth: HEXPIXELRADIUS * 2 * mapHexWidth * 1.1,
      mapPixelHeight: HEXPIXELRADIUS * 2 * mapHexHeight * 1.1,
      hexPixelWidth: hexPixelWidth,
      hexPixelHeight: hexPixelHeight,
      hexPixelCorners: [
        [hexPixelWidth, hexPixelHeight * 0.5],
        [hexPixelWidth * 0.75, hexPixelHeight],
        [hexPixelWidth * 0.25, hexPixelHeight],
        [0, hexPixelHeight * 0.5],
        [hexPixelWidth * 0.25, 0],
        [hexPixelWidth * 0.75, 0],
      ],
      unitCounters: {
        pixelCounterWidth: 64,
        pixelCounterHeight: 56,
        pixelSymbolWidth: PIXELCOUNTERWIDTH * 0.62,
        pixelSymbolHeight: PIXELCOUNTERHEIGHT * 0.45,
        rounding: 6,
        percentTopSide: 0.11, // Sets the position of the values boxes
        percentBottomSide: 0.75,
        percentLeftSide: 0.17,
        percentRightSide: 0.83,
        percentStatusBox: 0.13,
        roundingStatusBox: 2,
      },
      selectedHexStrokeWidth: 15,
    };

    // Holds information about the current state of the view
    this.state = {
      shouldDisplayHexCoordinates: true, // Should the hex coordinates be shown on the view?
      selectedHexCoord: undefined, // One hex can be selected and will draw with a thicker border
      numOfUnitsMoving: 0, // Number of units with running animation timelines
    };

    // Holds the main svgContainer and all child groups
    this.svgGroups = {
      svgContainer: undefined, // The main SVG() object attached to the DOM
      hexesBase: undefined, // Hex outlines
      hexesCoords: undefined, // Hex coordinate text
      unitsBase: undefined, // Unit Counters
    };

    // Create the SVG layer and the initial view, on large maps this may be expensive
    this.createSVGContainer();
    const startCreate = performance.now();
    this.drawInitialView();
    const finishCreate = performance.now();
    console.log(
      `   ...-BWARView Full map creation complete in ${Math.round(
        finishCreate - startCreate
      )}ms-`
    );
  }

  /**
   * Gets the svgContainer SVG() object that is attached to the DOM
   * @returns Object SVG()
   */
  getSvgContainer() {
    return this.svgGroups.svgContainer;
  }

  /* ************************************************************************
        Creation and setup
   ************************************************************************ */

  /**
   * Creates the SVG() that will be attached to the DOM
   */
  createSVGContainer() {
    const g = this.geometry;
    // Create the main SVG document with a viewbox set to mapsize and panzoom
    this.svgGroups.svgContainer = SVG()
      .size(g.mapPixelWidth, g.mapPixelHeight)
      .viewbox(`0 0 ${g.mapPixelWidth} ${g.mapPixelHeight}`)
      .panZoom({ zoomMin: 1, zoomMax: 20, zoomFactor: 0.1 })
      .zoom(1.2, { x: -g.mapPixelWidth / 2, y: -g.mapPixelHeight / 2 })
      .attr("id", "container");

    let clicks = 0;
    let clickTimer = 0;
    const dblClickTimeSpan = 250; // 200-300 seems to work, but higher values have noticeable delay in selecting a hex

    // Detect if this event is a single click or double click
    const clickHandler = (e) => {
      clicks++;
      if (clicks === 1) {
        clickTimer = setTimeout(() => {
          clicks = 0;
          // handle single click, now we are sure it is not a double click
          const { x, y } = this.svgGroups.svgContainer.point(e.pageX, e.pageY);
          const hexCoord = this.pixelToHex(Coordinates.makeCart(x, y));
          this.lastHexClicked = hexCoord;
          this.controller.view_hex_click(hexCoord);
        }, dblClickTimeSpan);
      }
      if (clicks === 2) {
        // it is the second click in double-click event
        clearTimeout(clickTimer);
        clicks = 0;
      }
    };

    // Add click handlers for click and dblclick
    this.svgGroups.svgContainer.click((e) => clickHandler(e));
    this.svgGroups.svgContainer.dblclick((e) => {
      const { x, y } = this.svgGroups.svgContainer.point(e.pageX, e.pageY);
      const hexCoord = this.pixelToHex(Coordinates.makeCart(x, y));
      this.lastHexClicked = hexCoord;
      this.controller.view_hex_dblclick(hexCoord);
    });
  }

  /**
   * Clear the svgContainer and draw the initial scene
   */
  drawInitialView() {
    const g = this.geometry;
    const gr = this.svgGroups;
    const vs = this.state;

    const startTime = performance.now();

    // Create the groups that will hold each layer
    this.svgGroups.svgContainer.clear();
    gr.hexesBase = gr.svgContainer.group().attr("id", "hexsBase");
    gr.hexesCoords = gr.svgContainer.group().attr("id", "hexsCoords");
    gr.unitsBase = gr.svgContainer.group().attr("id", "unitsBase");

    // Walk the map and create each hex
    for (let hexX = 0; hexX < g.mapHexWidth; ++hexX) {
      for (let hexY = 0; hexY < g.mapHexHeight; ++hexY) {
        const hexCoord = Coordinates.makeCart(hexX, hexY);
        // Calculate where it is
        const hexPixelOrigin = this.hexToPixel(hexCoord);
        const hexPixelCenter = Coordinates.makeCart(
          hexPixelOrigin.x - g.hexPixelWidth / 2,
          hexPixelOrigin.y - g.hexPixelHeight / 2
        );

        // Get the hex from the model
        const hex = this.model.getHex(hexCoord);
        const fillColor = TerrainData[hex.terrainId].color;

        // Draw the hex outline
        hex.hexSvg = gr.hexesBase
          .polygon(g.hexPixelCorners)
          .fill(fillColor)
          .stroke({ width: 1, color: "Black" })
          .move(hexPixelCenter.x, hexPixelCenter.y);
      }
    }

    const endTime = performance.now();
    console.log(
      `   ...BWARView created hexes in ${Math.round(endTime - startTime)}ms`
    );

    // Creating hex coordinate labels and having them visible is expensive. If coordinates
    // are not to be shown, do not create them and hide the hexes coordinate SVG layer.
    // If it is to be shown, create the coordinate labels.
    // The layer can be created at a later time if needed.
    if (vs.shouldDisplayHexCoordinates) {
      this.drawHexCoordinateLabels();
    } else {
      gr.hexesCoords.hide();
    }
  }

  /**
   * Draw the hex coordinate SVG layer
   * @returns
   */
  drawHexCoordinateLabels() {
    const g = this.geometry;
    const gr = this.svgGroups;

    // Check if the labels have already been created, silently ignore if they have
    if (gr.hexesCoords.first() === undefined) {
      console.log("skipping");
      return;
    }

    const startTime = performance.now();

    // Walk the map and create each hex
    for (let hexX = 0; hexX < g.mapHexWidth; ++hexX) {
      for (let hexY = 0; hexY < g.mapHexHeight; ++hexY) {
        const hexCoord = Coordinates.makeCart(hexX, hexY);
        // Calculate where it is
        const hexPixelOrigin = this.hexToPixel(hexCoord);
        const hexPixelCenter = Coordinates.makeCart(
          hexPixelOrigin.x - g.hexPixelWidth / 2,
          hexPixelOrigin.y - g.hexPixelHeight / 2
        );

        gr.hexesCoords
          .plain(`${hexX},${hexY}`)
          .font({
            family: "Verdana",
            size: 15,
            fill: "Black",
            weight: "bold",
            leading: 1.4,
            anchor: "middle",
          })
          .attr("text-rendering", "optimizeSpeed")
          .amove(
            hexPixelCenter.x + g.hexPixelWidth / 2,
            hexPixelCenter.y + g.hexPixelHeight * 0.12
          );
      }
    }
    const endTime = performance.now();
    console.log(
      `   ...BWARView created labels in ${Math.round(endTime - startTime)}ms`
    );
  }

  /* ************************************************************************
        Utility Functions
   ************************************************************************ */

  toggleShowCoordinates() {
    const gr = this.svgGroups;
    const vs = this.state;

    if (vs.shouldDisplayHexCoordinates) {
      gr.hexesCoords.hide();
      vs.shouldDisplayHexCoordinates = false;
      console.log("   ...BWARView hiding coordinates.");
    } else {
      console.log("   ...BWARView showing coordinates.");
      if (gr.hexesCoords.first() === null) {
        this.drawHexCoordinateLabels();
      }
      gr.hexesCoords.show();
      vs.shouldDisplayHexCoordinates = true;
    }
  }

  /* ************************************************************************
        Unit counters
   ************************************************************************ */

  /**
   * Creates unit counters for all units in the model
   */
  createUnitCountersForAllUnits() {
    const unitIds = this.model.oob.getAllUnitIds();
    if (!unitIds) {
      // testing
      console.log(`BWARView.createUnitCountersForAllUnits(): !unitIds`);
    }
    const start_time = performance.now();
    for (const unitId of unitIds) {
      this.createUnitCounter(unitId);
    }
    const end_time = performance.now();
    console.log(
      `   ...Created ${unitIds.length} unit counters in ${Math.round(
        end_time - start_time
      )}ms`
    );
  }

  /**
   * Draws a unit counter for a unit on the view
   * @param {UnitId} unitId Id of Unit
   * @throws {Error} unitId invalid, unit coord invalid or off map, SVG layer already exists, target hex not found
   */
  createUnitCounter(unitId) {
    const gu = this.geometry.unitCounters;

    const unit = this.model.oob.getUnit(unitId);
    if (!unit || !Number.isInteger(unit?.unitId)) {
      throw new Error(
        `BWARView.createUnitCounter(): Invalid unit [${JSON.stringify(
          unitId
        )}] [${JSON.stringify(unit)}]`
      );
    }

    if (!this.isHexOnMap(unit.hexCoord)) {
      throw new Error(
        `BWARCreateView.createUnitCounter(): Unit not on map or invalid coord [${JSON.stringify(
          unit?.hexCoord
        )}]`
      );
    }

    // Get a ref to the svgLayers base and create it
    if (unit.svgLayers.base !== undefined) {
      throw new Error(
        `BWARView.createUnitCounter(): SVG base layer already exists for ${JSON.stringify(
          unitId
        )}`
      );
    }

    // Get the target hex pixel coordinates
    const pixelTargetHex = this.hexToPixel(unit?.hexCoord);
    if (pixelTargetHex === undefined) {
      throw new Error(
        `BWARView.createUnitCounter(): Unit target hex cannot be found [${JSON.stringify(
          unit?.hexCoord
        )}] [${JSON.stringify(pixelTargetHex)}]`
      );
    }

    // Create a new SVG group to hold the unit counter
    const unitSvg = this.svgGroups.unitsBase
      .group()
      .attr("id", "unit: " + unitId);
    unit.svgLayers.base = unitSvg;
    const unitColors = unit.unitColors;

    // Draw the unit counter onto the SVG group
    unit.svgLayers.base
      .rect(gu.pixelCounterWidth, gu.pixelCounterHeight)
      .radius(gu.rounding)
      .stroke({ color: unit.unitColors.counterForeground, width: 1 })
      .fill(unit.unitColors.counterBackground);

    // Create a new SVG group to hold the unit symbol
    const symbolSvg = unitSvg.group();
    unit.svgLayers.symbol = symbolSvg;

    // Draw rectangle for symbol area
    symbolSvg
      .rect(gu.pixelSymbolWidth, gu.pixelSymbolHeight)
      .radius(gu.rounding)
      .stroke({ color: unitColors.symbolForeground, width: 1 })
      .fill(unitColors.symbolBackground);

    // Draw the symbol to the symbol area
    SymbolDraw.drawSymbol(
      symbolSvg,
      unit.symbolName,
      unitColors.symbolForeground,
      gu.pixelSymbolWidth,
      gu.pixelSymbolHeight,
      gu.rounding
    );
    symbolSvg.move(
      gu.pixelCounterWidth / 2 - gu.pixelSymbolWidth / 2,
      gu.pixelCounterHeight / 2 - gu.pixelSymbolHeight / 2
    );

    // Draw all of the unit.values to the counter
    // == Value Areas ==
    // status   Unitsize   mov
    // AP         AT      DEF
    const valuesSvg = unit.svgLayers.values;
    const values = unit.values;
    const percentCondition = unit.values.percentCondition;

    const statusWidth = gu.pixelCounterWidth * gu.percentStatusBox;
    const statusHeight = gu.pixelCounterHeight * gu.percentStatusBox;

    let statusColor;
    if (values.percentCondition > 0.8) {
      statusColor = "Green";
    } else if (values.percentCondition > 0.4) {
      statusColor = "Orange";
    } else {
      statusColor = "Red";
    }

    valuesSvg.topLeft = unitSvg
      .rect(statusWidth, statusHeight)
      .radius(gu.roundingStatusBox)
      .stroke({ width: 1, color: "Black" })
      .fill(statusColor)
      .move(
        gu.pixelCounterWidth * gu.percentLeftSide - statusWidth / 2,
        gu.pixelCounterWidth * gu.percentTopSide - statusHeight / 2
      );

    valuesSvg.topCenter = unitSvg
      .plain(values.unitSize || "-")
      .font({ family: "Verdana", size: 12, fill: "Black", weight: "bold" })
      .center(
        gu.pixelCounterWidth * 0.5,
        gu.pixelCounterWidth * gu.percentTopSide
      );

    valuesSvg.topRight = unitSvg
      .plain(Math.round(values.moves * percentCondition) || "-")
      .font({ family: "Verdana", size: 12, fill: "Black", weight: "bold" })
      .center(
        gu.pixelCounterWidth * gu.percentRightSide,
        gu.pixelCounterWidth * gu.percentTopSide
      );

    valuesSvg.bottomLeft = unitSvg
      .plain(Math.round(values.attackSoft * percentCondition) || "-")
      .font({ family: "Verdana", size: 12, fill: "Black", weight: "bold" })
      .center(
        gu.pixelCounterWidth * gu.percentLeftSide,
        gu.pixelCounterWidth * gu.percentBottomSide
      );

    valuesSvg.bottomCenter = unitSvg
      .plain(Math.round(values.attackHard * percentCondition) || "-")
      .font({ family: "Verdana", size: 12, fill: "Black", weight: "bold" })
      .center(
        gu.pixelCounterWidth * 0.5,
        gu.pixelCounterWidth * gu.percentBottomSide
      );

    valuesSvg.bottomRight = unitSvg
      .plain(Math.round(values.defend * percentCondition) || "-")
      .font({ family: "Verdana", size: 12, fill: "Black", weight: "bold" })
      .center(
        gu.pixelCounterWidth * gu.percentRightSide,
        gu.pixelCounterWidth * gu.percentBottomSide
      );

    // Moved the finished counter into position
    unitSvg.move(
      pixelTargetHex.x - gu.pixelCounterWidth / 2,
      pixelTargetHex.y - gu.pixelCounterHeight / 2
    );
  }

  /**
   * Removes a unit's SVG group from the SVG.
   * @param {UnitId} unitId Id of unit
   * @throws {Error} unitId not found
   */
  removeUnitId(unitId) {
    // Load unit
    const unit = this.model.oob.getUnit(unitId);
    if (unit === undefined) {
      throw new Error(
        `BWARView.removeUnitId(): UnitId cannot be found [${JSON.stringify(
          unitId
        )}]]`
      );
    }

    // Remove the units SVG group from the SVG
    unit.svgLayers.base.remove();
    unit.svgLayers = new SvgLayers();
  }

  /**
   * Updates the unit counter by deleting and remaking it
   * @param {UnitId} unitId Id of unit
   */
  updateUnitIdCounter(unitId) {
    this.removeUnitId(unitId);
    this.createUnitCounter(unitId);
  }

  /**
   * Moves an on map unit in the view to the taret hex with no animation
   * @param {UnitId} unitId Id of unit to move
   * @param {CartCoordinate} targetHexCoord Coordinate of hex to move to
   * @throws {Error} UnitId not found, target hex invalid or not found
   */
  moveUnitIdToHexCoord(unitId, targetHexCoord) {
    // Get the unit and source hex coordinates
    const unit = this.model.oob.getUnit(unitId);
    if (unit === undefined) {
      throw new Error(
        `BWARView.moveUnitIdToHexCoord(): UnitId cannot be found [${JSON.stringify(
          unitId
        )}]]`
      );
    }

    // Get the pixel coordinates of target hex
    const pixelCoord = this.hexToPixel(targetHexCoord);
    if (pixelCoord === undefined) {
      throw new Error(
        `BWARView.moveUnitIdToHexCoord(): targetHexCoord not on map [${JSON.stringify(
          targetHexCoord
        )}]]`
      );
    }

    // TODO instad of this, just restack the hex
    // Move the unit on the view to the target hex
    unit.svgLayers.base.move(
      pixelCoord.x - this.geometry.unitCounters.pixelCounterWidth / 2,
      pixelCoord.y - this.geometry.unitCounters.pixelCounterHeight / 2
    );
  }

  /* ************************************************************************
        Conversion Functions
   ************************************************************************ */

  /**
   * Converts a pixel coordinate to a hex coordinate
   * @param {CartCoordinate} pixelCoord Pixel coordinate to be converted to hex coordinate
   * @returns {CartCoordinate | undefined} Hex coordinate of pixel coordinate
   * @throws {Error} hexCoord invalid
   */
  pixelToHex(pixelCoord) {
    try {
      const { x, y } = pixelCoord;
      let q = ((2 / 3) * x) / HEXPIXELRADIUS;
      let r = ((-1 / 3) * x + (Math.sqrt(3) / 3) * y) / HEXPIXELRADIUS;
      let s = -q - r;
      const hexCoord = Coordinates.roundCubeToCart(
        Coordinates.makeCube(q, r, s)
      );
      return this.isHexOnMap(hexCoord) ? hexCoord : undefined;
    } catch {
      throw new Error(
        `BWARView.pixelToHex(): pixelCoord is invalid [${JSON.stringify(
          pixelCoord
        )}]]`
      );
    }
  }

  /**
   * Converts a hex coordinate to a pixel coordinate
   * @param {CartCoordinate} hexCoord Hex coordinate to be converted to pixel coordinate
   * @returns {CartCoordinate | undefined} Pixel coordinate of hex coordinate, undefined if invalid coordinate or off map
   * @throws {Error} hexCoord invalid
   */
  hexToPixel(hexCoord) {
    try {
      // This will check if the coordinae is valid and may throw
      if (!this.isHexOnMap(hexCoord)) {
        return undefined;
      }
    } catch {
      // Catch and rethrow so our message comes from hexToPixel instead of isHexOnMap
      throw new Error(
        `BWARView.hexToPixel(): hexCoord is invalid [${JSON.stringify(
          hexCoord
        )}]]`
      );
    }

    try {
      const { q, r } = Coordinates.cartToCube(hexCoord);
      return Coordinates.makeCart(
        HEXPIXELRADIUS * ((3 / 2) * q),
        HEXPIXELRADIUS * ((Math.sqrt(3) / 2) * q + Math.sqrt(3) * r)
      );
    } catch {
      // Should never happen?
      throw new Error(
        `BWARView.hexToPixel(): error converting to cube [${JSON.stringify(
          hexCoord
        )}]]`
      );
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
        `BWARView.isHexOnMap(): hexCoord is invalid [${JSON.stringify(
          hexCoord
        )}]]`
      );
    }
  }

  /* ************************************************************************
        Updating Functions
   ************************************************************************ */

  setSelectedHex(hexCoord) {
    const vs = this.state;
    const g = this.geometry;

    // If a hex was previously selected, unselect it
    if (vs.selectedHexCoord !== undefined) {
      const lastHex = this.model.getHex(vs.selectedHexCoord);
      if (lastHex === undefined) {
        throw new Error(
          `BWARView.setSelectedHex(): Could not get previously selected hex [${JSON.stringify(
            vs.selectedHexCoord
          )}]]`
        );
      }
      lastHex.hexSvg.attr("stroke-width", 1).back();
    }
    vs.selectedHexCoord = undefined;

    // If hexCoord is undefined, return now without setting a new hex
    if (hexCoord === undefined) {
      return;
    }

    // Select the new hex
    const newHex = this.model.getHex(hexCoord);
    if (newHex === undefined) {
      throw new Error(
        `BWARView.setSelectedHex(): Could not get new selected hex [${JSON.stringify(
          hexCoord
        )}]]`
      );
    }
    newHex.hexSvg.attr("stroke-width", g.selectedHexStrokeWidth).back();
    vs.selectedHexCoord = hexCoord;
  }

  /**
   * Gets the coordinates of the currently selected hex.
   * @returns {CartCoordinate | undefined} The coordinates of the selected hex or undefined if none.
   */
  getSelectedHexCoord() {
    return this.state.selectedHexCoord;
  }

  /* ************************************************************************
        Animation Functions
   ************************************************************************ */

  /**
   * Moves a unit along a path of steps. If the unit is initiall off map it will
   * appear on the first step and walk the path. All steps must be on map.
   * @param {UnitId} unitId Id of unit to move
   * @param {Array.<CartCoordinate>} movePath Array of hex coordinates to walk
   * @param {boolean} updateSelectedHex If true calls setSelectedHex() on the last step in movePath
   * @throw {Error} movePath must have 2 steps, unitId not found, unit has no SVG, step invalid or offmap
   */
  animationMoveUnitOnPath(
    unitId,
    movePath,
    updateSelectedHex = false,
    shouldSignalMoveEnd = false
  ) {
    if (!movePath || movePath.length < 2) {
      throw new Error(
        `BWARView.animationMoveUnitOnPath(): movePath must have at least 2 steps`
      );
    }

    // Get the unit
    const unit = this.model.oob.getUnit(unitId);
    if (unit === undefined) {
      throw new Error(
        `BWARView.animationMoveUnitOnPath(): unitId not found [${JSON.stringify(
          unitId
        )}]`
      );
    }

    // Get the unit's base SVG layer
    const unitSvg = unit.svgLayers.base;
    if (unitSvg === undefined) {
      throw new Error(
        `BWARView.animationMoveUnitOnPath(): unit has no SVG [${JSON.stringify(
          unit
        )}]`
      );
    }

    // Get the unit's source hex so the source unitStack can be visually adjusted.
    // An invalid souce hex will silently be ignored, just walk the unit along movePath and update thet target hex unitStack at the end.
    const sourceHexCoord = unit.hexCoord;

    // If an animation timeline exists on the unit's SVG, finish it. This will also create a timeline if it doesn't exist.
    unitSvg.timeline().finish();

    // Walk the move path and process each move. Skip the first step of move path if the unit's source hex is the
    // first step of move path otherwise use it to make the invalid hex unit appear in the first hex of movePath and start walking.
    const startStep = this.isHexOnMap(sourceHexCoord) ? 0 : 1;
    const g = this.geometry;

    for (let step = startStep; step < movePath.length; ++step) {
      // Get the pixel coordinates of the origin point of this step's hex, the hexToPixel
      // function will return undefined if any steps are offmap, all steps must be on map
      const pixelOrigin = this.hexToPixel(movePath[step]);
      if (pixelOrigin === undefined) {
        throw new Error(
          `BWARView.animationMoveUnitOnPath(): movePath has invalid or offmap step [${JSON.stringify(
            movePath[step]
          )}]`
        );
      }

      // Calculate the point needed to center the unit counter in the hex
      const pixelCentered = Coordinates.makeCart(
        pixelOrigin.x - g.unitCounters.pixelCounterWidth * 0.5,
        pixelOrigin.y - g.unitCounters.pixelCounterHeight * 0.5
      );

      // Add an animation step to the timeline that will walk the unit one step further along the path
      unitSvg
        .animate({ duration: 100, swing: true, wait: 5, delay: 0 })
        .move(pixelCentered.x, pixelCentered.y);
    }

    this.state.numOfUnitsMoving += 1;

    // .after() runs after the animation timeline finishes
    if (updateSelectedHex) {
      unitSvg.animate({ duration: 15, delay: 15, wait: 0 }).after(() => {
        this.setSelectedHex(movePath[movePath.length - 1]);
        this.state.numOfUnitsMoving -= 1;
        if (shouldSignalMoveEnd) {
          this.controller.viewUnitAnimationEnded(this.state.numOfUnitsMoving);
        }
      });
    } else {
      unitSvg.animate({ duration: 15, delay: 15, wait: 0 }).after(() => {
        this.state.numOfUnitsMoving -= 1;
        if (shouldSignalMoveEnd) {
          this.controller.viewUnitAnimationEnded(this.state.numOfUnitsMoving);
        }
      });
    }
  }

  /* ************************************************************************
        Misc utility
   ************************************************************************ */

  /**
   * Draws a rectangle filled with a color
   * @param {number} x X coordinate of center of rectangle
   * @param {number} y Y coordinate of center of rectangle
   * @param {number} width Width of rectangle
   * @param {number} height Height of rectangle
   * @param {string} color "#RGB" color to fill with
   */
  drawRect(x, y, width, height, color) {
    this.svgGroups.svgContainer
      ?.rect(width, height)
      .fill(color)
      .move(x - width / 2, y - width / 2);
  }

  /**
   * Draws a circle filled with a color
   * @param {number} x X coordinate of center of circle
   * @param {number} y Y coordinate of center of circle
   * @param {number} width Width of circle
   * @param {number} height Height of circle
   * @param {string} color "#RGB" color to fill with
   */
  drawCircle(x, y, width, height, color) {
    this.svgGroups.svgContainer
      ?.circle(width, height)
      .fill(color)
      .move(x - width / 2, y - height / 2);
  }
}
