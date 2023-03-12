import { useEffect, useRef, useMemo } from "react";
import { SVG } from "@svgdotjs/svg.js";
import "./App.scss";

/* Demonstrate basic SVG.JS usage in React */

function App() {
  const SVGWrapperRefElement = useRef(null);
  const SVGContainer = useMemo(() => SVG(), []);

  /** Adds 5 squares at random positions each time button is pressed */
  const draw = () => {
    for (let i = 0; i < 5; ++i) {
      const x = Math.floor(Math.random() * 1900);
      const y = Math.floor(Math.random() * 1000);
      SVGContainer.add(SVG().rect(100, 100).move(x, y).fill("#f06"));
    }
  };

  /** Clears all squares from the SVG */
  const clear = () => {
    SVGContainer.clear();
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
        <button onClick={draw}>Draw</button>
        <button onClick={clear}>Clear</button>
      </div>
      <div className="page-content">
        <div ref={SVGWrapperRefElement} />
      </div>
      <div className="page-footer">Footer</div>
    </div>
  );
}

export default App;
