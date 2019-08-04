import * as cola from "webcola";
import * as d3 from "d3";

function drawGraph(graph, panel) {
    const NODE_RADIUS = 7;
    const REPEL_FORCE = -5;
    const LINK_DISTANCE = 100;

   // const WIDTH = window.innerWidth;
    //const HEIGHT = window.innerHeight;
    const WIDTH=2000, HEIGHT=2000;

    const d3cola = cola
        .d3adaptor(d3)
        .avoidOverlaps(true)
        .size([WIDTH, HEIGHT]);

    const svg = d3.select(panel).attr('width', `${WIDTH}px`).attr('height', `${HEIGHT}px`);

    d3.selectAll(`${panel}> *`).remove();

    // define arrow markers for graph links
    svg
        .append("svg:defs")
        .append("svg:marker")
        .attr("id", "end-arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 6)
        .attr("markerWidth", 4)
        .attr("markerHeight", 4)
        .attr("orient", "auto")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");

    graph.nodes.forEach(
        (v) => (v.height = v.width = 2 * NODE_RADIUS)
    );


    d3cola
        .nodes(graph.nodes)
        .links(graph.links)
        .constraints(graph.constraints)
        .symmetricDiffLinkLengths(REPEL_FORCE)
        .linkDistance(LINK_DISTANCE)
        .start(10, 15, 20);

    const path = svg
        .selectAll(".link")
        .data(graph.links)
        .enter()
        .append("svg:path")
        .attr("class", "link");

    const node = svg
        .selectAll(".node")
        .data(graph.nodes)
        .enter()
        .append("circle")
        .attr("class", 'node')
        .attr("r", NODE_RADIUS)
        //.on("click", (d) => (d.fixed = true))
        .call(d3cola.drag);

    node.append("title").text((d) => d.title );

    const label = svg
        .selectAll(".label")
        .data(graph.nodes)
        .enter()
        .append("text")
        .attr("class", "label")
        .text((d) => d.title)
        //.on("click", (d) => (d.fixed = true))
        .call(d3cola.drag);

    d3cola.on("tick", () => {
        // draw directed edges with proper padding from node centers
        path.attr("d", (d) => {
            let deltaX = d.target.x - d.source.x;
            let deltaY = d.target.y - d.source.y;
            let dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            let normX = deltaX / dist;
            let normY = deltaY / dist;

            if (isNaN(normX)) {
                normX = 0;
            }
            if (isNaN(normY)) {
                normY = 0;
            }

            let sourcePadding = d.source.width / 2;
            let targetPadding = d.target.width / 2 + 2;
            let sourceX = d.source.x + sourcePadding * normX;
            let sourceY = d.source.y + sourcePadding * normY;
            let targetX = d.target.x - targetPadding * normX;
            let targetY = d.target.y - targetPadding * normY;

            // Defaults for normal edge.
            let drx = 0;
            let dry = 0;
            let xRotation = 0; // degrees
            let largeArc = 0; // 1 or 0
            const sweep = 1; // 1 or 0

            return `M${sourceX},${sourceY}A${drx},${dry} ${xRotation},${largeArc},${sweep} ${targetX},${targetY}`;
        });
        node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
        label.attr("x", (d) => d.x + 10).attr("y", (d) => d.y - 10);
    });
}

export {drawGraph};