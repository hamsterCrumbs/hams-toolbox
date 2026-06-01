<script lang="ts">
  import { SvelteFlow, Controls, Background, type Connection, type Edge, type Node, type OnDelete } from '@xyflow/svelte';
  import { onMount } from 'svelte';
  
  import IntegrationNode from './IntegrationNode.svelte';
  import PluginNode from './PluginNode.svelte';
  import ExtractPluginNode from './ExtractPluginNode.svelte';
  import VTSIntegrationNode from './VTSIntegrationNode.svelte';
  import VTSOutputNode from './VTSOutputNode.svelte';
  import type { VTuberToolboxEngine } from '../core/engine';
  import { generateFlowNodes } from '../core/graphicUtils';
  import type { IPlugin } from '../core/types';

  export let engine: VTuberToolboxEngine;

  // 1. Use standard Svelte arrays instead of writable stores
  let nodes: Node[] = [];
  let edges: Edge[] = [];

  // 2. Initialize them only once when the engine is passed in
  let isInitialized = false;
  $: if (engine && !isInitialized) {
    isInitialized = true;
    const generated = generateFlowNodes(engine);
    nodes = generated.map(n => {
      if (n.type === 'pluginNode' && n.data.label === 'Extract') {
        n.type = 'extractPluginNode';
      } else if (n.type === 'pluginNode' && n.data.label === 'VTS Output') {
        n.type = 'vtsOutputNode';
      } else if (n.type === 'integrationNode' && n.data.label === 'VTS Phone Integration') {
        n.type = 'vtsIntegrationNode';
      }
      return n;
    });
  }

  // Force Svelte Flow to re-measure the canvas bounding box after rendering.
  // This fixes the offset connection line bug when dragging.
  onMount(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);
    return () => clearTimeout(timer);
  });

  // Expose an interface to push new plugins dynamically onto the canvas
  export function addPluginNode(plugin: IPlugin) {
    let nodeType = 'pluginNode';
    if (plugin.name === 'Extract') {
      nodeType = 'extractPluginNode';
    } else if (plugin.name === 'VTS Output') {
      nodeType = 'vtsOutputNode';
    }

    const newNode: Node = {
      id: plugin.id,
      type: nodeType,
      position: { x: 400, y: Math.random() * 200 + 50 }, // slight random spawn variation
      data: { 
        label: plugin.name, 
        inputs: Array.from(plugin.getExpectedInputs().keys()),
        outputs: Array.from(plugin.getOutputs().keys()),
        id: plugin.id,
        engine: engine
      }
    };
    nodes = [...nodes, newNode];
  }

  const nodeTypes = {
    integrationNode: IntegrationNode,
    pluginNode: PluginNode,
    extractPluginNode: ExtractPluginNode,
    vtsIntegrationNode: VTSIntegrationNode,
    vtsOutputNode: VTSOutputNode
  };

  function handleConnect(connection: Connection) {
    if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) return;

    const poolKey = `${connection.source}.${connection.sourceHandle}`;
    engine.routeData(connection.target, connection.targetHandle, poolKey);

    // An input can only accept ONE connection in the engine.
    // Remove any existing edge going to the same target/targetHandle to prevent visual duplicates.
    const filteredEdges = edges.filter(e => !(e.target === connection.target && e.targetHandle === connection.targetHandle));

    // 3. Standard array assignment to trigger Svelte reactivity
    edges = [
      ...filteredEdges,
      {
        id: `e-${connection.source}${connection.sourceHandle}-${connection.target}${connection.targetHandle}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        animated: true
      }
    ];
  }

  function handleConnectEnd(event: MouseEvent | TouchEvent, connectionState: any) {
    // If the connection was successfully dropped onto a valid handle, do nothing.
    if (!connectionState || connectionState.isValid) return;

    const { fromNode, fromHandle } = connectionState;
    if (!fromNode || !fromHandle) return;

    const handleId = fromHandle.id;

    if (fromHandle.type === 'target') {
      // Dragged from an input onto the void: sever the connection.
      const edgesToRemove = edges.filter(e => e.target === fromNode.id && e.targetHandle === handleId);
      if (edgesToRemove.length > 0) {
        for (const edge of edgesToRemove) {
          if (edge.target && edge.targetHandle) {
            engine.routeData(edge.target, edge.targetHandle, '');
          }
        }
        edges = edges.filter(e => !edgesToRemove.includes(e));
      }
    } else if (fromHandle.type === 'source') {
      // Dragged from an output onto the void: sever only if there is exactly 1 connection.
      const edgesFromOutput = edges.filter(e => e.source === fromNode.id && e.sourceHandle === handleId);
      if (edgesFromOutput.length === 1) {
        const edge = edgesFromOutput[0];
        if (edge.target && edge.targetHandle) {
          engine.routeData(edge.target, edge.targetHandle, '');
        }
        edges = edges.filter(e => e !== edge);
      }
    }
  }

  const onDelete: OnDelete = ({ nodes: deletedNodes, edges: deletedEdges }) => {
    for (const edge of deletedEdges) {
      if (edge.target && edge.targetHandle) {
        engine.routeData(edge.target, edge.targetHandle, '');
      }
    }

    // Make sure we also unregister the deleted nodes from the engine
    for (const node of deletedNodes) {
      if (node.type === 'pluginNode' || node.type === 'extractPluginNode' || node.type === 'vtsOutputNode') {
        engine.unregisterPlugin(node.id);
      } else if (node.type === 'integrationNode' || node.type === 'vtsIntegrationNode') {
        engine.unregisterIntegration(node.id);
      }
    }

    // Filter out the deleted elements
    edges = edges.filter((e) => !deletedEdges.includes(e));
    nodes = nodes.filter((n) => !deletedNodes.includes(n));
  };
</script>

<div style="position: relative; height: 100%; width: 100%; border-radius: 8px; border: 1px solid #334155; overflow: hidden;">
  <SvelteFlow 
    bind:nodes={nodes} 
    bind:edges={edges} 
    {nodeTypes}
    colorMode="dark"
    onconnect={(connection) => handleConnect(connection)}
    onconnectend={handleConnectEnd}
    ondelete={onDelete}
    fitView
  >
    <Background />
    <Controls />
  </SvelteFlow>
</div>