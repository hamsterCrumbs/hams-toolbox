import type { Node } from '@xyflow/svelte';
import type { VTuberToolboxEngine } from './engine';

export function generateFlowNodes(engine: VTuberToolboxEngine): Node[] {
  const flowNodes: Node[] = [];
  
  // Map Integrations to Left Side Nodes
  let yOffset = 100;
  for (const integration of engine.getIntegrations()) {
    flowNodes.push({
      id: integration.id,
      type: 'integrationNode', // Custom Svelte component type
      position: { x: 50, y: yOffset },
      data: { label: integration.name, outputs: Array.from(integration.getOutputs().keys()) }
    });
    yOffset += 150;
  }

  // Map Plugins to Right Side Nodes
  yOffset = 100;
  for (const plugin of engine.getPlugins()) {
    flowNodes.push({
      id: plugin.id,
      type: 'pluginNode', // Custom Svelte component type
      position: { x: 400, y: yOffset },
      data: { 
        label: plugin.name, 
        inputs: ['heartRateInput'], // In production, derive this dynamically from the plugin
        outputs: Array.from(plugin.getOutputs().keys()) 
      }
    });
    yOffset += 150;
  }

  return flowNodes;
}