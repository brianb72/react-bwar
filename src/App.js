import { useEffect, useRef, useMemo, useState } from "react";
import "./App.scss";
import { BWARController } from "./bwar/controller";
import TreeView from "./components/treeview/treeview.component"

function App() {
  const SVGWrapperRefElement = useRef(null);
  const [headerTextMessage, setHeaderTextMessage] = useState(undefined);
  const [selectedUnitId, setSelectedUnitId] = useState(0);
  const [treeViewData, setTreeViewData] = useState([])
  
  const memoBWAR = useMemo(
    () => new BWARController(
      {
        setHeaderTextMessage: setHeaderTextMessage, 
        setTreeViewData: setTreeViewData
      }
    ),
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


  // If the selected unit in the treeview changes, tell bwar controller
  useEffect(() => {
    memoBWAR.setSelectedUnitId(selectedUnitId)
  }, [selectedUnitId, memoBWAR])


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
        <div className="page-sidebar">


          <div className="page-unit">
            <div className="page-unit__left">
              <div className="unit-symbol">Symbol</div>
              <div className="unit-name">Name</div>
            </div>
            <div className="page-unit__right">
              <div>A</div>
              <div>B</div>
              <div>C</div>
              <div>D</div>
            </div>
          </div>

          <div className="page-hex">
            <div className="page-hex__left">
                <div className="hex-symbol">Symbol</div>
                <div className="hex-name">Name</div>
              </div>
              <div className="page-hex__right">
                <div>A</div>
              </div>
          </div>

          <div className="page-oob">
            <TreeView treeViewData={treeViewData} selectedUnitId={selectedUnitId} setSelectedUnitId={setSelectedUnitId} />            
          </div>


        </div>
      </div>
      <div className="page-footer">
        <button onClick={clickCoordsButton}>Coords</button>
      </div>
    </div>
  );
}

export default App;
