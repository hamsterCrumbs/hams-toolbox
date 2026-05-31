<script lang="ts">
  import { onMount } from 'svelte';
  import { VTuberToolboxEngine } from './core/engine';
  import { MockHeartMonitor, PanicTriggerPlugin } from './core/mocks';
  import GraphCanvas from './components/GraphCanvas.svelte';
  import * as Neutralino from '@neutralinojs/lib';

  // Import Svelte Flow styles globally so it is parsed before the canvas mounts.
  // This prevents the node measurement race conditions that offset the lines!
  import '@xyflow/svelte/dist/style.css';

  // We make engine reactive so the GraphCanvas knows when it is ready
  let engine: VTuberToolboxEngine;
  let ticker: ReturnType<typeof setInterval>;
  let poolState = new Map();
  let unsubscribe: () => void;

onMount(() => {
    // 1. Boot Native OS Bridge safely
    // Wrap in a try-catch so that if we run outside `neu run` (e.g. standard browser), 
    // it doesn't crash the script and prevent the UI from loading.
    try {
      Neutralino.init();
    } catch (error) {
      console.warn("Neutralino initialization skipped (running outside 'neu run'?):", error);
    }

    // 2. Create the Engine locally
    const localEngine = new VTuberToolboxEngine();

    // 3. Add our Mocks
    const heartMonitor = new MockHeartMonitor();
    const panicPlugin = new PanicTriggerPlugin();
    localEngine.registerIntegration(heartMonitor);
    localEngine.registerPlugin(panicPlugin);

    // 4. Start processing data (Note: start() is async, but we don't await it here 
    // so we don't block the UI rendering)
    localEngine.start();

    // 5. Assign to the reactive variable to trigger the GraphCanvas rendering instantly!
    engine = localEngine;

    // 6. Subscribe to data for the text list below the canvas
    unsubscribe = engine.dataPool.subscribe(value => {
      poolState = value;
    });

    // 7. Start the 30fps loop
    ticker = setInterval(() => {
      engine.tick();
    }, 1000 / 30);
  
    return () => {
      if (ticker) clearInterval(ticker);
      if (unsubscribe) unsubscribe();
    };
  });
</script>

<main>
  <div class="header">
    <h1>Ham's VTuber Toolbox</h1>
    <span class="status">Engine Running at 30fps</span>
  </div>

  <div class="workspace">
    {#if engine}
      <GraphCanvas {engine} />
    {:else}
      <p>Loading nodes...</p>
    {/if}
  </div>

  <div class="data-pool">
    <h2>Live Data Pool</h2>
    <ul>
      {#each [...poolState] as [key, envelope]}
        <li>
          <strong>{key}</strong>: 
          {#if envelope.type === 'SINGLE'}
            <span class="value">{envelope.data.value}</span>
          {:else}
            <span class="value">[Bundle Data]</span>
          {/if}
        </li>
      {/each}
    </ul>
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
  .status {
    background: #065f46;
    color: #a7f3d0;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 600;
  }
  .workspace {
    flex-grow: 1;
    min-height: 400px;
    display: flex;
    flex-direction: column;
  }
  .data-pool {
    background: #1e293b;
    padding: 1rem;
    border-radius: 8px;
    height: 200px;
    overflow-y: auto;
    border: 1px solid #334155;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
  }
  li {
    background: #0f172a;
    padding: 0.75rem;
    border-radius: 6px;
    border: 1px solid #334155;
  }
  .value {
    color: #38bdf8;
    font-family: monospace;
    font-weight: bold;
    float: right;
  }
</style>