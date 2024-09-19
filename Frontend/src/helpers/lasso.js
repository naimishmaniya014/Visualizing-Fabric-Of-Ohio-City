export default function Lasso() {
  const d3 = window.d3;
  function initLasso(svg) {
    if (!svg) return null;
    if (svg.selectAll(".lasso").size() > 0) {
      //   svg.selectAll(".selected").classed("selected", false);
      svg.selectAll(".lasso").remove();
    }
    const d3LassoObject = d3
      .lasso()
      .closePathDistance(305)
      .closePathSelect(true)
      .targetArea(svg)
      .items(svg.selectAll("circle"));

    svg.call(d3LassoObject);
    return d3LassoObject;
  }

  return { initLasso };
}
