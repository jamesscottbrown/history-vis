/*global browser*/


function loadHistory(startTime, endTime) {

    if (!startTime){ startTime = new Date(Date.now() - 1000*60*60*24); }
    if (!endTime){ endTime = new Date(); }

    const query = {text: 'http', maxResults: 1000, startTime, endTime};
    var searchingHistory = browser.history.search(query);

    return searchingHistory.then((historyItems) => {
        const processVisitItems = (historyItem, visitItems) => {
            var links = [];
            var allVisits = [];

            for (let i in visitItems) {
                const visitItem = visitItems[i];

               if (visitItem.visitTime < startTime.getTime() || visitItem.visitTime > endTime.getTime){ continue; }

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
                return d.reduce(reducer, {allVisits: [], links: []});
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
    allVisits = JSON.parse(JSON.stringify(allVisits));
    links = JSON.parse(JSON.stringify(links));

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


function convertNetwork(allVisits, links){
    links = links.filter(l => l.source !== '-1');  // remove edges from -1
    const actualVisits = allVisits.filter(d => d) // remove nulls
        .filter( n =>{
            const inDegree = links.filter(l => l.target === n.id).length;

            if (inDegree > 0){
                return true;
            }
            const outDegree = links.filter(l => l.source === n.id).length;
            return outDegree > 0;
        }); // remove isolated nodes

    const visitIds = actualVisits.map(v => v.id);
    const indexBasedLinks = links.map(l => ({source: visitIds.indexOf(l.source), target: visitIds.indexOf(l.target)}))
        .filter(l => (l.source !== -1 && l.target !== -1));

    const constraints = indexBasedLinks.map(l => ({axis: 'y', left: l.source, right: l.target, gap: 25}));

    return {nodes: actualVisits, links: indexBasedLinks, constraints: constraints};
}
function filterNetwork(allVisits, links, filter){

    if (!filter){
        return {visitsToShow: allVisits, linksToShow: links};
    }


    const visitMatches = v => v && (v.title.toLowerCase().includes(filter.toLowerCase()) || v.url.toLowerCase().includes(filter.toLowerCase()));

    let visitsToProcess = allVisits.filter(visitMatches);

    let linksToKeep = [], processedVisitIds = [], processedLinkIndexes = [];

    // could iterate over links instead of visits
    while (visitsToProcess.length > 0){
        const visit = visitsToProcess.pop();

        if (processedVisitIds.includes(visit.id)){ continue; }
        processedVisitIds.push(visit.id);

        // process incoming nodes
        for (let i in links) {
            if (processedLinkIndexes.includes(i)){
                continue;
            }

            let l = links[i];
            if (l.target === visit.id){
                linksToKeep.push(l);

                if (l.source === "-1"){ continue; } // don't track back down from root node
                visitsToProcess.push(allVisits[+l.source]);
                processedLinkIndexes.push(i);
            }

            if (l.source === visit.id){
                linksToKeep.push(l);
                visitsToProcess.push(allVisits[+l.target]);
                processedLinkIndexes.push(i);
            }
        }

        visitsToProcess = visitsToProcess.filter(v =>  v && !processedVisitIds.includes(v.id)); // unenessary ?
    }

    // preserve indexes
    const visitsToShow = allVisits.map(v => (processedVisitIds.includes(v.id)) ? v : undefined);

    return {visitsToShow, linksToShow: linksToKeep};
}


module.exports = {loadHistory, constructTree, constructTree2, convertNetwork, filterNetwork};