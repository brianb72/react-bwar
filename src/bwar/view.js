import { SVG } from "@svgdotjs/svg.js";
import { Coordinates } from "./coordinates";
import './shared-types.js'

const HEXPIXELRADIUS = 57;  // Sets size of hexes in pixels

export class BWARView {
  /**
   * Constructor
   * @param {Object} bwar Instance of BWAR that the view will work with
   * @param {number} mapHexWidth Number of hexes wide
   * @param {number} mapHexHeight Number of hexes tall
   * @param {Function} setLastHexClicked React useState() setter
   */
  constructor(bwar, mapHexWidth, mapHexHeight, setLastHexClicked) {
    console.log(
      `   ...BWARView Constructor mapSize: ${mapHexWidth} x ${mapHexHeight}`
    );
    this.bwar = bwar; // Handle back to controller this view is attached to
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
    };

    // Holds the main svgContainer and all child groups
    this.svgGroups = {
      svgContainer: undefined, // The main SVG() object attached to the DOM
      hexesBase: undefined, // Hex outlines
      hexesCoords: undefined, // Hex coordinate text
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
        this.drawCircle(x, y, 20, 20, "#0A0");
        this.setLastHexClicked(`${hexCoord.x}, ${hexCoord.y}`);
      } else {
        this.drawRect(x, y, 15, 15, "#A00");
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

    // Walk the map and create each hex
    for (let hexX = 0; hexX < g.mapHexWidth; ++hexX) {
      for (let hexY = 0; hexY < g.mapHexHeight; ++hexY) {

        // Calculate where it is
        const hexPixelOrigin = this.hexToPixel(
          Coordinates.makeCart(hexX, hexY)
        );
        const hexPixelCenter = Coordinates.makeCart(
          hexPixelOrigin.x - g.hexPixelWidth / 2,
          hexPixelOrigin.y - g.hexPixelHeight / 2
        );

        // Draw the hex outline
        gr.hexesBase
          .polygon(g.hexPixelCorners)
          .fill("White")
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
        Conversion Functions
   ************************************************************************ */
  
  /**
   * Converts a pixel coordinate to a hex coordinate
   * @param {CartCoordinate} pixelCoord Pixel coordinate to be converted to hex coordinate
   * @returns CartCoordinate Hex coordinate of pixel coordinate
   */
  pixelToHex(pixelCoord) {
    const { x, y } = pixelCoord;
    let q = ((2 / 3) * x) / HEXPIXELRADIUS;
    let r = ((-1 / 3) * x + (Math.sqrt(3) / 3) * y) / HEXPIXELRADIUS;
    let s = -q - r;
    const hexCoord = Coordinates.roundCubeToCart(Coordinates.makeCube(q, r, s));
    return this.isHexOnMap(hexCoord) ? hexCoord : undefined;
  }

  /**
   *
   * @param {CartCoordinate} hexCoord Hex coordinate to be converted to pixel coordinate
   * @returns CartCoordinate Pixel coordinate of hex coordinate
   */
  hexToPixel(hexCoord) {
    if (!this.isHexOnMap(hexCoord)) {
      return undefined;
    }
    const { q, r } = Coordinates.cartToCube(hexCoord);
    return Coordinates.makeCart(
      HEXPIXELRADIUS * ((3 / 2) * q),
      HEXPIXELRADIUS * ((Math.sqrt(3) / 2) * q + Math.sqrt(3) * r)
    );
  }

  /**
   * Tests if a hex coordinate is on the map
   * @param {CartCoordinate} hexCoord
   * @returns boolean True if coordinate is on map
   */
  isHexOnMap(hexCoord) {
    const { x, y } = hexCoord;
    return x >= 0 && x < this.mapHexWidth && y >= 0 && y < this.mapHexHeight;
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
