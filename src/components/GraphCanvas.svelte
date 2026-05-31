<script lang="ts">
  import { writable } from 'svelte/store';
  import { SvelteFlow, Controls, Background, type Connection, type Edge, type Node, type OnDelete } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  
  import IntegrationNode from './IntegrationNode.svelte';
  import PluginNode from './PluginNode.svelte';
  import type { VTuberToolboxEngine } from '../core/engine';
  import { generateFlowNodes } from '../core/graphicUtils';

  // The engine is handed down from App.svelte
  export let engine: VTuberToolboxEngine;

  // Initialize Svelte Flow stores natively (do not use $ prefix here)
  const nodes = writable<Node[]>([]);
  const edges = writable<Edge[]>([]);

  // Svelte Native Reactivity: Generate nodes whenever the engine updates/loads
  $: if (engine) {
    nodes.set(generateFlowNodes(engine));
  }

  const nodeTypes = {
    integrationNode: IntegrationNode,
    pluginNode: PluginNode
  };

  function handleConnect(connection: Connection) {
    if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) return;

    // Route data in the background engine
    const poolKey = `${connection.source}.${connection.sourceHandle}`;
    engine.routeData(connection.target, connection.targetHandle, poolKey);

    // Draw the animated line on the screen
    edges.update((eds) => [
      ...eds,
      {
        id: `e-${connection.source}${connection.sourceHandle}-${connection.target}${connection.targetHandle}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        animated: true
      }
    ]);
  }

  const onDelete: OnDelete = ({ nodes: deletedNodes, edges: deletedEdges }) => {
    // When elements are deleted, we need to update both the engine and our stores.
    for (const edge of deletedEdges) {
      if (edge.target && edge.targetHandle) {
        // Un-route data in the engine by passing an empty string for the poolKey.
        engine.routeData(edge.target, edge.targetHandle, '');
      }
    }

    // Update the stores to remove the deleted elements from the canvas.
    edges.update((eds) => eds.filter((e) => !deletedEdges.includes(e)));
    nodes.update((nds) => nds.filter((n) => !deletedNodes.includes(n)));
  };
</script>

<div style="height: 100%; width: 100%; border-radius: 8px; border: 1px solid #334155; overflow: hidden;">
  <SvelteFlow 
    nodes={$nodes} 
    edges={$edges} 
    {nodeTypes}
    colorMode="dark"
    onconnect={(connection: Connection) => handleConnect(connection)}
    ondelete={onDelete}
    fitView
  >
    <Background />
    <Controls />
  </SvelteFlow>
</div>