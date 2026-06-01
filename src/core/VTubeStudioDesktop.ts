import { ApiClient } from 'vtubestudio';

export class VTubeStudioDesktop {
  public isConnected: boolean = false;
  private apiClient: ApiClient | null = null;

  constructor() {
    // Initialize connection parameters if needed
  }

  private getAuthToken = () => {
    return localStorage.getItem("VTS_AUTH_TOKEN");
  };

  private setAuthToken = async (authenticationToken: string) => {
    localStorage.setItem("VTS_AUTH_TOKEN", authenticationToken);
  };

  public async connect(): Promise<boolean> {
    console.log("Connecting to VTubeStudio Desktop...");
    
    if (this.apiClient && this.isConnected) return true;

    return new Promise((resolve) => {
      this.apiClient = new ApiClient({
        authTokenGetter: this.getAuthToken,
        authTokenSetter: this.setAuthToken,
        pluginName: "Ham's VTuber Toolbox",
        pluginDeveloper: "Ham",
      });

      this.apiClient.on("connect", () => {
        console.log("Connected to VTubeStudio Desktop!");
        this.isConnected = true;
        resolve(true);
      });

      this.apiClient.on("error", (e: any) => {
        console.error("VTubeStudio connection error:", e);
        this.isConnected = false;
        resolve(false);
      });
    });
  }

  public async disconnect(): Promise<void> {
    console.log("Disconnecting from VTubeStudio Desktop...");
    if (this.apiClient) {
      this.apiClient.disconnect();
      this.apiClient = null;
    }
    this.isConnected = false;
  }
}