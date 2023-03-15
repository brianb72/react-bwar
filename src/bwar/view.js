import { SVG } from "@svgdotjs/svg.js";
import { Coordinates } from "./coordinates";
import { TerrainData } from "./models";
import "./shared-types.js";

const HEXPIXELRADIUS = 57; // Sets size of hexes in pixels

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
      `   ...BWARView Constructor mapSize: ${mapHexWidth} x ${mapHexHeight}`
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
        pixelWidth: 64,
        pixelHeight: 56,
        rounding: 6,
      },
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
      `   ...BWARView created map in ${finishCreate - startCreate}ms`
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
      .panZoom({ zoomMin: 0.25, zoomMax: 10, zoomFactor: 0.15 })
      .zoom(0.8, { x: g.mapPixelWidth * 1.5, y: g.mapPixelHeight * 1.2 })
      .attr("id", "container");

    // Add a double click handler
    this.svgGroups.svgContainer.dblclick((e) => {
      // .point() converts page coordinate to SVG coordinate including transforming for panZoom
      const { x, y } = this.svgGroups.svgContainer.point(e.pageX, e.pageY);
      const hexCoord = this.pixelToHex(Coordinates.makeCart(x, y));
      this.lastHexClicked = hexCoord;
      if (hexCoord && this.setLastHexClicked) {
        const hex = this.model.getHex(hexCoord);
        this.setLastHexClicked(
          `${hexCoord.x}, ${hexCoord.y}, ${TerrainData[hex.terrainId].name}`
        );
        this.controller.moveUnitIdToHexCoord(1, hexCoord);
      } else {
        this.setLastHexClicked(undefined);
      }
    });
  }

  /**
   * Clear the svgContainer and draw the initial scene
   */
  drawInitialView() {
    const g = this.geometry;
    const gr = this.svgGroups;

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
        gr.hexesBase
          .polygon(g.hexPixelCorners)
          .fill(fillColor)
          .stroke({ width: 1, color: "Black" })
          .move(hexPixelCenter.x, hexPixelCenter.y);

        // Draw the coordinate label
        gr.hexesCoords
          .text(`${hexX},${hexY}`)
          .font({
            family: "Verdana",
            size: 15,
            fill: "Black",
            weight: "bold",
            leading: 1.4,
            anchor: "middle",
          })
          .move(
            hexPixelCenter.x + (g.hexPixelWidth / 2) * 0.85,
            hexPixelCenter.y
          );
      }
    }
  }

  /* ************************************************************************
        Unit counters
   ************************************************************************ */

  /**
   * Creates unit counters for all units in the model
   */
  createUnitCountersForAllUnits() {
    const unitIds = this.model.getAllUnitIds();
    if (!unitIds) {
      // testing
      console.log(`BWARView.createUnitCountersForAllUnits(): !unitIds`);
    }
    console.log(`Creating ${unitIds.lenght} unit counters.`);
    for (const unitId of unitIds) {
      this.createUnitCounter(unitId);
    }
  }

  /**
   * Draws a unit counter for a unit on the view
   * @param {UnitId} unitId Id of Unit
   * @throws {Error} unitId invalid, unit coord invalid or off map, SVG layer already exists, target hex not found
   */
  createUnitCounter(unitId) {
    const unit = this.model.getUnit(unitId);
    if (!unit || !Number.isInteger(unit?.unitId)) {
      throw new Error(
        `BWARView.createUnitCounter(): Invalid unit [${unitId}] [${unit}]`
      );
    }

    if (!this.isHexOnMap(unit.hexCoord)) {
      throw new Error(
        `BWARCreateView.createUnitCounter(): Unit not on map or invalid coord [${unit?.hexCoord?.x}, ${unit?.hexCoord?.y}]`
      );
    }

    // Get a ref to the svgLayers base and create it
    if (unit.svgLayers.base !== undefined) {
      throw new Error(
        `BWARView.createUnitCounter(): SVG base layer already exists for ${unitId}`
      );
    }

    // Get the target hex pixel coordinates
    const pixelTargetHex = this.hexToPixel(unit.hexCoord);
    if (pixelTargetHex === undefined) {
      throw new Error(
        `BWARView.createUnitCounter(): Unit target hex cannot be found [${unit.hexCoord}] [${pixelTargetHex}]`
      );
    }

    // Create a new SVG group to hold the unit counter
    unit.svgLayers.base = this.svgGroups.unitsBase.group().attr("id", unitId);

    // Draw the unit counter onto the SVG group
    const gu = this.geometry.unitCounters;
    unit.svgLayers.base
      .rect(gu.pixelWidth, gu.pixelHeight)
      .radius(gu.rounding)
      .stroke({ color: "Black", width: 1 })
      .fill("Orange")
      .move(
        pixelTargetHex.x - gu.pixelWidth / 2,
        pixelTargetHex.y - gu.pixelHeight / 2
      );
  }

  /**
   * Moves an on map unit in the view to another hex
   * @param {UnitId} unitId Id of unit to move
   * @param {CartCoordinate} targetHexCoord Coordinate of hex to move to
   * @throws {Error} UnitId not found, target hex invalid or not found
   */
  moveUnitIdToHexCoord(unitId, targetHexCoord) {
    // Get the unit and source hex coordinates
    const unit = this.model.getUnit(unitId);
    if (unit === undefined) {
      throw new Error(
        `BWARView.moveUnitIdToHexCoord(): UnitId cannot be found [${unitId}]]`
      );
    }

    // Get the pixel coordinates of target hex
    const pixelCoord = this.hexToPixel(targetHexCoord);
    if (pixelCoord === undefined) {
      throw new Error(
        `BWARView.moveUnitIdToHexCoord(): targetHexCoord not on map [${targetHexCoord}]]`
      );
    }

    // Move the unit on the view to the target hex
    unit.svgLayers.base.move(
      pixelCoord.x - this.geometry.unitCounters.pixelWidth / 2,
      pixelCoord.y - this.geometry.unitCounters.pixelHeight / 2
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
        `BWARView.pixelToHex(): pixelCoord is invalid [${pixelCoord}]]`
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
        `BWARView.hexToPixel(): hexCoord is invalid [${hexCoord}]]`
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
        `BWARView.hexToPixel(): error converting to cube [${hexCoord}]]`
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
        `BWARView.isHexOnMap(): hexCoord is invalid [${hexCoord}]]`
      );
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
