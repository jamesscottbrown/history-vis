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
                const reducer = (accumulator, currentValue) => ({
                    allVisits: accumulator.allVisits.concat(currentValue.allVisits),
                    links: accumulator.links.concat(currentValue.links)
                });
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
    var stack = ['-1'];
    var output = [];

    let chronologicalLinks = links;

    let depths = {'-1': 0};
    var childIds = [];

    const getVisitNode = id => allVisits.filter(d => d.id === id)[0];

    while (stack.length !== 0) {
        for (let i = 0; i < stack.length; i++) {
            let id = stack.pop();

            childIds = chronologicalLinks.filter(l => l.source === id).map(l => l.target);
            const children = childIds.map(getVisitNode);

            if (id === '-1') {
                const node = {url: ''};
                if (!node.children) {
                    node.children = [];
                }
                node.children = node.children.concat(children);
                output.push(node);

            } else {
                const node = getVisitNode(id);
                if (!node.children) {
                    node.children = [];
                }
                node.children = node.children.concat(children);
            }

            childIds.map(c => {
                depths[id] = depths[id] ? depths[id] : 0;
                depths[c] = depths[id] + 1;
            });

            stack = stack.concat(childIds);
        }
    }

    return output;
}

module.exports = {loadHistory, constructTree, constructTree2};