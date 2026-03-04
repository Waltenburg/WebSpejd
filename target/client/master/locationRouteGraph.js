var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let network = null;
let nodeDataSet = null;
let edgeDataSet = null;
let saveTimeout;
const containerId = 'location-route-graph';
const statusId = 'location-route-graph-status';
const getStatusElement = () => document.getElementById(statusId);
const setStatus = (text, isError = false) => {
    const status = getStatusElement();
    if (!status) {
        return;
    }
    status.textContent = text;
    status.style.color = isError ? '#b91c1c' : '';
};
const fetchGraphData = () => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield fetch("/master/locationRouteGraphData");
    if (!response.ok) {
        throw new Error(`Unable to fetch graph data: ${response.status}`);
    }
    return response.json();
});
const toVisNode = (node, currentPositions) => {
    var _a, _b;
    const currentPosition = currentPositions[node.id.toString()];
    return {
        id: node.id,
        label: node.label,
        shape: node.isFirstLocation ? 'star' : 'dot',
        color: {
            background: node.color,
            border: node.borderColor
        },
        borderWidth: 5,
        size: node.size,
        x: (_a = currentPosition === null || currentPosition === void 0 ? void 0 : currentPosition.x) !== null && _a !== void 0 ? _a : node.x,
        y: (_b = currentPosition === null || currentPosition === void 0 ? void 0 : currentPosition.y) !== null && _b !== void 0 ? _b : node.y,
        title: node.title,
        locationLink: node.link
    };
};
const toVisEdge = (edge) => {
    let borderWidth = edge.width;
    if (!edge.routeExists && edge.patrolsOnRoute > 0) {
        borderWidth += 1;
    }
    return {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        arrows: 'to',
        dashes: edge.dashes,
        width: borderWidth,
        color: { color: edge.color },
        title: edge.title,
        smooth: {
            type: 'dynamic'
        }
    };
};
const syncDataSet = (dataSet, items) => {
    const existingIds = new Set(dataSet.getIds().map(id => id.toString()));
    const incomingIds = new Set(items.map(item => item.id.toString()));
    const toRemove = [];
    existingIds.forEach(id => {
        if (!incomingIds.has(id)) {
            toRemove.push(id);
        }
    });
    if (toRemove.length > 0) {
        dataSet.remove(toRemove);
    }
    dataSet.update(items);
};
const saveLayout = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!network || !nodeDataSet) {
        return;
    }
    const nodeIds = nodeDataSet.getIds();
    const positions = network.getPositions(nodeIds);
    try {
        yield fetch("/master/locationRouteGraphLayout", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(positions)
        });
    }
    catch (_a) {
    }
});
const scheduleLayoutSave = () => {
    if (saveTimeout) {
        window.clearTimeout(saveTimeout);
    }
    saveTimeout = window.setTimeout(() => {
        void saveLayout();
    }, 500);
};
const applyGraphData = (graphData) => {
    if (!network || !nodeDataSet || !edgeDataSet) {
        return;
    }
    const currentPositions = network.getPositions(nodeDataSet.getIds());
    const visNodes = graphData.nodes.map(node => toVisNode(node, currentPositions));
    const visEdges = graphData.edges.map(toVisEdge);
    syncDataSet(nodeDataSet, visNodes);
    syncDataSet(edgeDataSet, visEdges);
};
const initializeNetwork = (container) => __awaiter(void 0, void 0, void 0, function* () {
    const graphData = yield fetchGraphData();
    const visNodes = graphData.nodes.map(node => toVisNode(node, {}));
    const visEdges = graphData.edges.map(toVisEdge);
    nodeDataSet = new window.vis.DataSet(visNodes);
    edgeDataSet = new window.vis.DataSet(visEdges);
    const options = {
        autoResize: true,
        physics: {
            enabled: true,
            stabilization: {
                iterations: 200
            }
        },
        interaction: {
            hover: false,
            hoverConnectedEdges: false,
            selectConnectedEdges: false,
            dragNodes: true
        },
        edges: {
            chosen: false
        },
        nodes: {
            chosen: false,
            font: {
                face: 'Arial'
            }
        },
    };
    network = new window.vis.Network(container, { nodes: nodeDataSet, edges: edgeDataSet }, options);
    network.on('dragEnd', () => {
        scheduleLayoutSave();
    });
    network.on('doubleClick', (params) => {
        if (!params.nodes || params.nodes.length === 0) {
            return;
        }
        const node = nodeDataSet.get(params.nodes[0]);
        if (node === null || node === void 0 ? void 0 : node.locationLink) {
            window.location.assign(node.locationLink);
        }
    });
});
const startRefreshLoop = () => {
    window.setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const graphData = yield fetchGraphData();
            applyGraphData(graphData);
            setStatus(`Senest opdateret: ${new Date().toLocaleTimeString('da-DK')}`);
        }
        catch (_a) {
            setStatus('Kunne ikke hente opdateret grafdata.', true);
        }
    }), 10000);
};
const initialize = () => __awaiter(void 0, void 0, void 0, function* () {
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }
    if (!window.vis) {
        setStatus('vis-network blev ikke indlæst.', true);
        return;
    }
    try {
        yield initializeNetwork(container);
        setStatus(`Senest opdateret: ${new Date().toLocaleTimeString('da-DK')}`);
        startRefreshLoop();
    }
    catch (_a) {
        setStatus('Kunne ikke initialisere lokationsgrafen.', true);
    }
});
document.addEventListener('DOMContentLoaded', () => {
    void initialize();
});
export {};
