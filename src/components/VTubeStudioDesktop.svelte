<script lang="ts">
  import { VTubeStudioDesktop } from '../core/VTubeStudioDesktop';

  const vtsDesktop = new VTubeStudioDesktop();
  
  // Using Svelte 5 runes for reactivity
  let isConnected = $state(false);

  async function toggleConnection() {
    if (isConnected) {
      await vtsDesktop.disconnect();
      isConnected = false;
    } else {
      isConnected = await vtsDesktop.connect();
    }
  }
</script>

<div class="vts-control">
  <div class="title-area">
    <h3>VTubeStudio Desktop</h3>
    <div class="status-indicator" class:connected={isConnected} class:disconnected={!isConnected}></div>
  </div>
  
  <button class="connect-btn" onclick={toggleConnection}>
    {isConnected ? 'Disconnect' : 'Connect'}
  </button>
</div>

<style>
  .vts-control {
    display: flex;
    align-items: center;
    gap: 16px;
    background-color: #1e293b;
    border: 1px solid #334155;
    padding: 8px 16px;
    border-radius: 8px;
    color: #f8fafc;
  }
  .title-area {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }
  .status-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
  .connected {
    background-color: #10b981;
    box-shadow: 0 0 6px #10b981;
  }
  .disconnected {
    background-color: #ef4444;
    box-shadow: 0 0 6px #ef4444;
  }
  .connect-btn {
    background-color: #3b82f6;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
  }
  .connect-btn:hover {
    background-color: #2563eb;
  }
</style>