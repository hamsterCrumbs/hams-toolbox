<script lang="ts">
  import { SvelteFlow, Controls, Background, type Connection, type Edge, type Node, type OnDelete } from '@xyflow/svelte';
  import { onMount } from 'svelte';
  
  import IntegrationNode from './IntegrationNode.svelte';
  import PluginNode from './PluginNode.svelte';
  import type { VTuberToolboxEngine } from '../core/engine';
  import { generateFlowNodes } from '../core/graphicUtils';

  export let engine: VTuberToolboxEngine;

  // 1. Use standard Svelte arrays instead of writable stores
  let nodes: Node[] = [];
  let edges: Edge[] = [];

  // 2. Reactively update them when the engine is passed in
  $: if (engine) {
    nodes = generateFlowNodes(engine);
  }

  // Force Svelte Flow to re-measure the canvas bounding box after rendering.
  // This fixes the offset connection line bug when dragging.
  onMount(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);
    return () => clearTimeout(timer);
  });

  const nodeTypes = {
    integrationNode: IntegrationNode,
    pluginNode: PluginNode
  };

  function handleConnect(connection: Connection) {
    if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) return;

    const poolKey = `${connection.source}.${connection.sourceHandle}`;
    engine.routeData(connection.target, connection.targetHandle, poolKey);

    // 3. Standard array assignment to trigger Svelte reactivity
    edges = [
      ...edges,
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

  const onDelete: OnDelete = ({ nodes: deletedNodes, edges: deletedEdges }) => {
    for (const edge of deletedEdges) {
      if (edge.target && edge.targetHandle) {
        engine.routeData(edge.target, edge.targetHandle, '');
      }
    }

    // Filter out the deleted elements
    edges = edges.filter((e) => !deletedEdges.includes(e));
    nodes = nodes.filter((n) => !deletedNodes.includes(n));
  };
</script>

<div style="position: relative; flex-grow: 1; display: flex; flex-direction: column; height: 100%; width: 100%; border-radius: 8px; border: 1px solid #334155; overflow: hidden; box-sizing: border-box;">
  <SvelteFlow 
    bind:nodes={nodes} 
    bind:edges={edges} 
    {nodeTypes}
    colorMode="dark"
    onconnect={(connection) => handleConnect(connection)}
    ondelete={onDelete}
    fitView
  >
    <Background />
    <Controls />
  </SvelteFlow>
</div>