import { useEffect, useRef, useMemo } from "react";
import { SVG } from "@svgdotjs/svg.js";
import "@svgdotjs/svg.panzoom.js";
import "./App.scss";

/* Demonstrate basic SVG.JS usage in React */

function App() {
  /** Create the main SVG container that sits on the DOM */
  const createSVGContainer = () => {
    // Create a document with a viewbox and panzoom
    const doc = SVG()
      .size(1000, 1000)
      .viewbox("0 0 1000 1000")
      .panZoom({ zoomMin: 0.25, zoomMax: 20, zoomFactor: 0.15 });

    // Fill the entire SVG with a background rect
    doc.rect(1000, 1000).fill("#555");

    // Add a double click handler to draw a circle
    doc.dblclick((e) => {
      // .point() converts page coordinate to SVG coordinate including transforming for panZoom
      const p = doc.point(e.pageX, e.pageY);
      doc
        .circle(50, 50)
        .move(p.x - 25, p.y - 25)
        .fill("#f06");
    });
    return doc;
  };

  const SVGWrapperRefElement = useRef(null);
  const SVGContainer = useMemo(() => createSVGContainer(), []);

  /** Clears all squares from the SVG */
  const clear = () => {
    SVGContainer.clear();
    SVGContainer.rect(1000, 1000).fill("#555");
  };

  /* If the ref that points to the target div changes, or the memo that points to the SVG changes, add the SVG to the div. */
  useEffect(() => {
    if (
      SVGWrapperRefElement &&
      SVGWrapperRefElement?.current &&
      SVGWrapperRefElement?.current?.children.length < 1
    ) {
      SVGContainer.addTo(SVGWrapperRefElement?.current);
    }
  }, [SVGWrapperRefElement, SVGContainer]);

  return (
    <div className="page-container">
      <div className="page-header">
        <button onClick={clear}>Clear</button>
        <span>Dblclick: Place Circles, Drag: Pan, MouseWheel: Zoom</span>
      </div>
      <div className="page-content">
        <div ref={SVGWrapperRefElement} />
      </div>
      <div className="page-footer">Footer</div>
    </div>
  );
}

export default App;
