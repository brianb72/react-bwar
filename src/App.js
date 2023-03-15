import { useEffect, useRef, useMemo, useState } from "react";
import "./App.scss";
import { BWARController } from "./bwar/controller";

/* Demonstrate basic SVG.JS usage in React */

function App() {
  const SVGWrapperRefElement = useRef(null);
  const [lastHexClicked, setLastHexClicked] = useState(undefined);
  const memoBWAR = useMemo(() => new BWARController(7,7 , setLastHexClicked), []);

  // If the ref to the div changes, reattach BWAR
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
  }, [SVGWrapperRefElement, memoBWAR]);


  return (
    <div className="page-container">
      <div className="page-header">
        <span className='last-clicked'>Hex: { 
          memoBWAR && lastHexClicked ?
          lastHexClicked : "None"
          
        }</span>
      </div>
      <div className="page-content">
        <div ref={SVGWrapperRefElement} />
      </div>
      <div className="page-footer">Footer</div>
    </div>
  );
}

export default App;
