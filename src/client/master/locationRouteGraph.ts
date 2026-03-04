import { Endpoints } from '@shared/endpoints';

declare global {
    interface Window {
        vis: any;
    }
}

interface GraphNodeData {
    id: number;
    label: string;
    isOpen: boolean;
    isFirstLocation: boolean;
    patrolsOnLocation: number;
    size: number;
    color: string;
    borderColor: string;
    x?: number;
    y?: number;
    title: string;
    link: string;
}

interface GraphEdgeData {
    id: string;
    from: number;
    to: number;
    routeExists: boolean;
    routeOpen: boolean;
    patrolsOnRoute: number;
    width: number;
    color: string;
    dashes: boolean;
    title: string;
}

interface GraphResponse {
    nodes: GraphNodeData[];
    edges: GraphEdgeData[];
    firstLocationId: number | null;
}

let network: any = null;
let nodeDataSet: any = null;
let edgeDataSet: any = null;
let saveTimeout: number | undefined;

const containerId = 'location-route-graph';
const statusId = 'location-route-graph-status';

const getStatusElement = (): HTMLElement | null => document.getElementById(statusId);

const setStatus = (text: string, isError = false) => {
    const status = getStatusElement();
    if (!status) {
        return;
    }
    status.textContent = text;
    status.style.color = isError ? '#b91c1c' : '';
};

const fetchGraphData = async (): Promise<GraphResponse> => {
    const response = await fetch(Endpoints.GetLocationRouteGraphData);
    if (!response.ok) {
        throw new Error(`Unable to fetch graph data: ${response.status}`);
    }
    return response.json() as Promise<GraphResponse>;
};

const toVisNode = (node: GraphNodeData, currentPositions: Record<string, { x: number; y: number }>) => {
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
        x: currentPosition?.x ?? node.x,
        y: currentPosition?.y ?? node.y,
        title: node.title,
        locationLink: node.link
    };
};

const toVisEdge = (edge: GraphEdgeData) => {
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

const syncDataSet = (dataSet: any, items: any[]) => {
    const existingIds = new Set((dataSet.getIds() as Array<string | number>).map(id => id.toString()));
    const incomingIds = new Set(items.map(item => item.id.toString()));

    const toRemove: Array<string | number> = [];
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

const saveLayout = async () => {
    if (!network || !nodeDataSet) {
        return;
    }

    const nodeIds = nodeDataSet.getIds() as number[];
    const positions = network.getPositions(nodeIds);

    try {
        await fetch(Endpoints.SetLocationRouteGraphLayout, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(positions)
        });
    } catch {
    }
};

const scheduleLayoutSave = () => {
    if (saveTimeout) {
        window.clearTimeout(saveTimeout);
    }

    saveTimeout = window.setTimeout(() => {
        void saveLayout();
    }, 500);
};

const applyGraphData = (graphData: GraphResponse) => {
    if (!network || !nodeDataSet || !edgeDataSet) {
        return;
    }

    const currentPositions = network.getPositions(nodeDataSet.getIds());
    const visNodes = graphData.nodes.map(node => toVisNode(node, currentPositions));
    const visEdges = graphData.edges.map(toVisEdge);

    syncDataSet(nodeDataSet, visNodes);
    syncDataSet(edgeDataSet, visEdges);
};

const initializeNetwork = async (container: HTMLElement) => {
    const graphData = await fetchGraphData();

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

    network.on('doubleClick', (params: any) => {
        if (!params.nodes || params.nodes.length === 0) {
            return;
        }

        const node = nodeDataSet.get(params.nodes[0]);
        if (node?.locationLink) {
            window.location.assign(node.locationLink);
        }
    });
};

const startRefreshLoop = () => {
    window.setInterval(async () => {
        try {
            const graphData = await fetchGraphData();
            applyGraphData(graphData);
            setStatus(`Senest opdateret: ${new Date().toLocaleTimeString('da-DK')}`);
        } catch {
            setStatus('Kunne ikke hente opdateret grafdata.', true);
        }
    }, 10000);
};

const initialize = async () => {
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }

    if (!window.vis) {
        setStatus('vis-network blev ikke indlæst.', true);
        return;
    }

    try {
        await initializeNetwork(container);
        setStatus(`Senest opdateret: ${new Date().toLocaleTimeString('da-DK')}`);
        startRefreshLoop();
    } catch {
        setStatus('Kunne ikke initialisere lokationsgrafen.', true);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    void initialize();
});
