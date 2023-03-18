import { useEffect, useRef, useMemo, useState } from "react";
import "./App.scss";
import { BWARController } from "./bwar/controller";

function App() {
  const SVGWrapperRefElement = useRef(null);
  const [headerTextMessage, setHeaderTextMessage] = useState(undefined);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const memoBWAR = useMemo(
    () => new BWARController(9, 5, setHeaderTextMessage, setButtonDisabled),
    []
  );

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

  const clickMoveButton = (e) => {
    console.log("Random walking all units.");
    memoBWAR.randomWalkAllUnits();
  };

  const clickCoordsButton = (e) => {
    memoBWAR.toggleShowCoordinates();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <span className="span-message">
          {memoBWAR && headerTextMessage ? headerTextMessage : "None"}
        </span>
      </div>
      <div className="page-content">
        <div ref={SVGWrapperRefElement} />
      </div>
      <div className="page-footer">
        <button onClick={clickCoordsButton}>Coords</button>
        <button onClick={clickMoveButton} disabled={buttonDisabled}>
          Move
        </button>
      </div>
    </div>
  );
}

export default App;
