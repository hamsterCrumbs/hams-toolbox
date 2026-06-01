<script lang="ts">
  import { onMount } from 'svelte';
  import { VTuberToolboxEngine } from './core/engine';
  import { VTSPhoneIntegration } from './integrations/VTSPhoneIntegration';
  import GraphCanvas from './components/GraphCanvas.svelte';

  // Import Svelte Flow styles globally so it is parsed before the canvas mounts.
  // This prevents the node measurement race conditions that offset the lines!
  import '@xyflow/svelte/dist/style.css';
  import './components/nodes.css';
  import { BetterMouthPlugin } from './plugins/BetterMouth';
  import { ExtractPlugin } from './plugins/ExtractPlugin';
  import { VTSOutputPlugin } from './plugins/VTSOutputPlugin';
    import VTubeStudioDesktop from './components/VTubeStudioDesktop.svelte';

  // We make engine reactive so the GraphCanvas knows when it is ready
  let engine: VTuberToolboxEngine;
  let ticker: ReturnType<typeof setInterval>;
  let canvas: GraphCanvas;

onMount(() => {
    // 1. Create the Engine locally
    const localEngine = new VTuberToolboxEngine();

    // 3. Mount VTube Studio iOS Integration
    const vtsTracker = new VTSPhoneIntegration('192.168.254.102');
    localEngine.registerIntegration(vtsTracker);

    // 4. Start the engine instantly
    localEngine.start();

    // 5. Assign to the reactive variable to trigger the GraphCanvas rendering instantly!
    engine = localEngine;

    // 7. Start the 60fps loop
    ticker = setInterval(() => {
      engine.tick();
    }, 1000 / 60);
  
    return () => {
      if (ticker) clearInterval(ticker);
    };
  });

  // Spawns a new plugin instance and updates the engine/UI
  function spawnPlugin() {
    if (!engine || !canvas) return;
    const plugin = new BetterMouthPlugin();
    engine.registerPlugin(plugin);
    canvas.addPluginNode(plugin);
  }

  function spawnExtractPlugin() {
    if (!engine || !canvas) return;
    const plugin = new ExtractPlugin();
    engine.registerPlugin(plugin);
    canvas.addPluginNode(plugin);
  }

  function spawnVTSOutputPlugin() {
    if (!engine || !canvas) return;
    const plugin = new VTSOutputPlugin(engine);
    engine.registerPlugin(plugin);
    canvas.addPluginNode(plugin);
  }
</script>

<main>
  <div class="header">
    <h1>Ham's VTuber Toolbox</h1>
    <VTubeStudioDesktop />
    <div class="controls">
      <button onclick={spawnPlugin} class="btn">+ Add BetterMouth Plugin</button>
      <button onclick={spawnExtractPlugin} class="btn">+ Add Extract Plugin</button>
      <button onclick={spawnVTSOutputPlugin} class="btn">+ Add VTS Output</button>
      <span class="status">Engine Running at 60fps</span>
    </div>
  </div>

  <div class="workspace">
    {#if engine}
      <GraphCanvas bind:this={canvas} {engine} />
    {:else}
      <p>Loading nodes...</p>
    {/if}
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    background-color: #0f172a;
    color: white;
  }
  main {
    font-family: system-ui, sans-serif;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    height: 100vh;
    box-sizing: border-box;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h1 { margin: 0; }
  .controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .status {
    background: #065f46;
    color: #a7f3d0;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 600;
  }
  .btn {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
  }
  .btn:hover { background: #2563eb; }
  .workspace {
    flex-grow: 1;
    min-height: 400px;
    display: flex;
    flex-direction: column;
  }
</style>