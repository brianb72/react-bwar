
import { BWARView } from "./view";
import "@svgdotjs/svg.panzoom.js";
import './shared-types.js'

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
    this.bwarView = undefined;
    this.mapHexWidth = mapHexWidth;
    this.mapHexHeight = mapHexHeight;
    this.mapSize = { height: mapHexHeight, width: mapHexWidth };
    this.setLastHexClicked = setLastHexClicked;
  }

  /**
   * Create a new view or reuse the old view, and attach to the target div
   * @param {Object} targetDivElement div in the DOM that holds the SVG
   */
  attachView(targetDivElement) {
    if (this.bwarView) {
      console.log("   ...BWARVIEW exists, reusing");
    } else {
      this.bwarView = new BWARView(
        this,
        this.mapHexWidth,
        this.mapHexHeight,
        this.setLastHexClicked
      );
    }
    const svgContainer = this.bwarView.getSvgContainer();
    svgContainer.addTo(targetDivElement);
  }
}
