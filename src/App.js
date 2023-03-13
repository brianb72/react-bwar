import { useEffect, useRef, useMemo } from "react";
import "./App.scss";
import { BWARController } from "./bwar/bwar";

/* Demonstrate basic SVG.JS usage in React */

function App() {
  console.log("=== APP RENDER ===");

  const SVGWrapperRefElement = useRef(null);
  const memoBWAR = useMemo(() => new BWARController(5,5), []);

  useEffect(() => {
    console.log("useEffect[SVGWrapperRefElement]");
    if (
      SVGWrapperRefElement &&
      SVGWrapperRefElement?.current &&
      SVGWrapperRefElement?.current?.children.length < 1
    ) {
      console.log("   ...added to SVG");
      memoBWAR.attachView(SVGWrapperRefElement.current)
    } else {
      console.log("   ...did not add SVG");
    }
  }, [SVGWrapperRefElement]);


  return (
    <div className="page-container">
      <div className="page-header">
        <span>Pan and zoom, double click place circle</span>
      </div>
      <div className="page-content">
        <div ref={SVGWrapperRefElement} />
      </div>
      <div className="page-footer">Footer</div>
    </div>
  );
}

export default App;
