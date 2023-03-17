import { useEffect, useRef, useMemo, useState } from "react";
import "./App.scss";
import { BWARController } from "./bwar/controller";

/* Demonstrate basic SVG.JS usage in React */


function App() {
  const SVGWrapperRefElement = useRef(null);
  const [headerTextMessage, setHeaderTextMessage] = useState(undefined);
  const memoBWAR = useMemo(() => new BWARController(72, 30, setHeaderTextMessage), []);

  // If the ref to the div changes, reattach BWAR
  useEffect(() => {
    console.log("useEffect[SVGWrapperRefElement]");
    if (
      SVGWrapperRefElement &&
      SVGWrapperRefElement?.current &&
      SVGWrapperRefElement?.current?.children.length < 1
    ) {
      console.log("   ...added to SVG");
      memoBWAR.attachView(SVGWrapperRefElement.current);
    } else {
      console.log("   ...did not add SVG");
    }
  }, [SVGWrapperRefElement, memoBWAR]);

  const clickHandler = (e) => {
    console.log("Random walking all units.");
    memoBWAR.randomWalkAllUnits();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <span className="span-message">
          Moving Units: {memoBWAR && headerTextMessage ? headerTextMessage : "None"}
        </span>
        <span>
          <button onClick={clickHandler} disabled={headerTextMessage}>
            Move
          </button>
        </span>
      </div>
      <div className="page-content">
        <div ref={SVGWrapperRefElement} />
      </div>
      <div className="page-footer">Footer</div>
    </div>
  );
}

export default App;
