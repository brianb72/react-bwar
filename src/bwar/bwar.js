import { SVG } from "@svgdotjs/svg.js";
import "@svgdotjs/svg.panzoom.js";

export class BWARController {
  /**
   * Constructor
   * @param {number} mapHexWidth Number of hexes wide
   * @param {number} mapHexHeight Number of hexes tall
   */
  constructor(mapHexWidth, mapHexHeight) {
    console.log(
      `   ...BWAR Constructor mapSize: ${mapHexWidth} x ${mapHexHeight}`
    );
    this.bwarView = undefined;
    this.mapHexWidth = mapHexWidth;
    this.mapHexHeight = mapHexHeight;
    this.mapSize = { height: mapHexHeight, width: mapHexWidth };
  }

  /**
   * Create a new view or reuse the old view, and attach to the target div
   * @param {Object} targetDivElement div in the DOM that holds the SVG
   */
  attachView(targetDivElement) {
    if (this.bwarView) {
      console.log("   ...BWARVIEW exists, reusing");
    } else {
      this.bwarView = new BWARView(this, this.mapHexWidth, this.mapHexHeight);
    }
    const svgContainer = this.bwarView.getSvgContainer();
    svgContainer.addTo(targetDivElement);
  }
}

export class BWARView {
  /**
   * Constructor
   * @param {Object} bwar Instance of BWAR that the view will work with
   * @param {number} mapHexWidth Number of hexes wide
   * @param {number} mapHexHeight Number of hexes tall
   */
  constructor(bwar, mapHexWidth, mapHexHeight) {
    console.log(
      `   ...BWARView Constructor mapSize: ${mapHexWidth} x ${mapHexHeight}`
    );
    this.bwar = bwar; // Handle back to controller this view is attached to
    this.mapHexWidth = mapHexWidth;
    this.mapHexHeight = mapHexHeight;
    this.hexPixelRadius = 57;
    this.mapPixelWidth = this.hexPixelRadius * 2 * this.mapHexWidth * 1.1;
    this.mapPixelHeight = this.hexPixelRadius * 2 * this.mapHexHeight * 1.1;

    // Holds the main svgContainer and all child groups
    this.svgGroups = {
      svgContainer: undefined, // The main SVG() object attached to the DOM
    };

    this.createSVGContainer();
    this.drawInitialView();
  }

  /**
   * Gets the svgContainer SVG() object that is attached to the DOM 
   * @returns Object SVG()
   */
  getSvgContainer() {
    return this.svgGroups.svgContainer;
  }

  /**
   * Creates the SVG() that will be attached to the DOM
   */
  createSVGContainer() {
    const xo = -200;
    const yo = -200;

    this.svgGroups.svgContainer = SVG()
      .size(this.mapPixelWidth, this.mapPixelHeight)
      .viewbox(
        `${xo} ${yo} ${this.mapPixelWidth + xo} ${this.mapPixelHeight + yo}`
      )
      .panZoom({ zoomMin: 0.25, zoomMax: 10, zoomFactor: 0.15 })
      .zoom(0.8)
      .attr("id", "container");

    // Add a double click handler
    this.svgGroups.svgContainer.dblclick((e) => {
      // .point() converts page coordinate to SVG coordinate including transforming for panZoom
      const p = this.svgGroups.svgContainer.point(e.pageX, e.pageY);
      console.log("Doubleclick", p);
      this.drawCircle(p.x, p.y, 50, 50, "#F00");
    });
  }

  /**
   * Clear the svgContainer and draw the initial scene
   */
  drawInitialView() {
    this.svgGroups.svgContainer.clear();
    this.drawRect(0, 0, this.mapPixelWidth, this.mapPixelHeight, "#555");
  }

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
      .move(x - width / 2, y - height / 2);
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
