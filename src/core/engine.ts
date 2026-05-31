import { writable, type Writable } from 'svelte/store';
import type { DataEnvelope, IIntegration, IPlugin } from './types';

export class VTuberToolboxEngine {
  addPlugin(arg0: any) {
      throw new Error('Method not implemented.');
  }
  public dataPool: Writable<Map<string, DataEnvelope>>;
  private integrations: Map<string, IIntegration> = new Map();
  private plugins: Map<string, IPlugin> = new Map();

  // Simple routing table: "PluginID" -> { "InputHandle" : "PoolKey" }
  private routes: Map<string, Record<string, string>> = new Map();

  constructor() {
    this.dataPool = writable(new Map());
  }

  // --- Getters ---
  
  /**
   * Retrieves all registered data integrations as an array.
   */
  public getIntegrations(): IIntegration[] {
    return Array.from(this.integrations.values());
  }

  /**
   * Retrieves all registered data processor plugins as an array.
   */
  public getPlugins(): IPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Returns a copy of the current internal routing configuration.
   */
  public getRoutes(): Map<string, Record<string, string>> {
    // Returning a new map instance to prevent direct mutation of internal state
    return new Map(this.routes);
  }

  /**
   * Gets the specific pool key routed to a plugin's input handle.
   */
  public getRoute(pluginId: string, inputHandle: string): string | undefined {
    return this.routes.get(pluginId)?.[inputHandle];
  }

  // --- Registration & Routing ---

  public registerIntegration(integration: IIntegration) {
    this.integrations.set(integration.id, integration);
  }

  public registerPlugin(plugin: IPlugin) {
    this.plugins.set(plugin.id, plugin);
  }

  public routeData(pluginId: string, inputHandle: string, poolKey: string) {
    if (!this.routes.has(pluginId)) {
      this.routes.set(pluginId, {});
    }
    this.routes.get(pluginId)![inputHandle] = poolKey;
  }

  public unregisterIntegration(id: string) {
    this.integrations.delete(id);
    this.routes.delete(id);
  }

  public unregisterPlugin(id: string) {
    this.plugins.delete(id);
    this.routes.delete(id);
  }

  // --- Runtime Loops ---

  public async start() {
    for (const integration of this.integrations.values()) {
      await integration.connect();
    }
  }

  // This should be called on a timer (e.g., 30fps or 60fps)
  public tick() {
    let currentPool = new Map<string, DataEnvelope>();

    // 1. Poll Integrations
    for (const integration of this.integrations.values()) {
      if (integration.isConnected) {
        integration.poll();
        const outputs = integration.getOutputs();
        outputs.forEach((val, key) => currentPool.set(`${integration.id}.${key}`, val));
      }
    }

    // 2. Process Plugins (Simplified: Assumes flat topology for now)
    for (const plugin of this.plugins.values()) {
      const routing = this.routes.get(plugin.id) || {};
      const pluginInputs = new Map<string, DataEnvelope>();
      
      // Fetch required inputs from the pool
      for (const [handle, poolKey] of Object.entries(routing)) {
        if (currentPool.has(poolKey)) {
          pluginInputs.set(handle, currentPool.get(poolKey)!);
        }
      }

      // Execute plugin logic
      const outputs = plugin.process(pluginInputs);
      outputs.forEach((val, key) => currentPool.set(`${plugin.id}.${key}`, val));
    }

    // 3. Update global store (Triggers Svelte UI update)
    this.dataPool.set(currentPool);
  }
}