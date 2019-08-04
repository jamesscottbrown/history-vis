/*global browser*/


function loadHistory() {
    var searchingHistory = browser.history.search({text: 'http', maxResults: 500});

    return searchingHistory.then((historyItems) => {
        const processVisitItems = (historyItem, visitItems) => {
            var links = [];
            var allVisits = [];

            for (let i in visitItems) {
                const visitItem = visitItems[i];
                allVisits[visitItem.visitId] = {
                    id: visitItem.visitId,
                    historyItemId: visitItem.id,
                    time: visitItem.visitTime,
                    referringVisitId: visitItem.referringVisitId,
                    transition: visitItem.transition,
                    url: historyItem.url,
                    title: historyItem.title
                };
                links.push({source: visitItem.referringVisitId, target: visitItem.visitId});
            }
            return {allVisits, links};
        };

        const promises = historyItems.map(historyItem => browser.history.getVisits({url: historyItem.url}));

        return Promise.all(promises)
            .then(d => d.map((visitItem, i) => {
                return processVisitItems(historyItems[i], visitItem);
            }))
            .then(d => {
                const reducer = (accumulator, currentValue) => {

                    currentValue.allVisits.map((v, i) => {
                        if (v) {
                            accumulator.allVisits[i] = v;
                        }
                    });

                    return {
                        allVisits: accumulator.allVisits,
                        links: accumulator.links.concat(currentValue.links)
                    }
                };
                return d.reduce(reducer);
            })
    })
}


function constructTree(allVisits, links) {
    var stack = ['-1'];
    var output = [];

    // const chronologicalLinks = [...links].sort( (a,b) => (allVisits[a.target].time - allVisits[b.target].time));
    let chronologicalLinks = links;

    let depths = {'-1': 0};
    var children = [];

    while (stack.length !== 0) {
        for (let i = 0; i < stack.length; i++) {
            let id = stack.pop();
            output.push(id);

            children = chronologicalLinks.filter(l => l.source === id).map(l => l.target);

            children.map(c => {
                depths[id] = depths[id] ? depths[id] : 0;
                depths[c] = depths[id] + 1;
            });


            stack = stack.concat(children);

        }
    }

    return {output, depths};
}


function constructTree2(allVisits, links) {
    var rootNodes = [];
    let chronologicalLinks = links;

    chronologicalLinks.filter(l => {
        var keepEdge;

        let sourceNode = allVisits[+l.source];
        let targetNode = allVisits[+l.target];

        if (!targetNode){
            console.log("Unexpected - no target: ", l, targetNode);
            return false;
        }

        if (l.source === '-1' || !sourceNode) {
                rootNodes.push(l.target);
                return false;
            }

            if (!sourceNode.children) {
                sourceNode.children = [];
            }
            sourceNode.children = sourceNode.children.concat(targetNode);
            keepEdge = true;

        return keepEdge;
    });

    return rootNodes.map(id => allVisits[+id])
}

module.exports = {loadHistory, constructTree, constructTree2};