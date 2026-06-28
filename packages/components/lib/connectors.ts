/**
 * Data Connectors for Plexus UI
 *
 * Provides standardized interfaces for connecting to real-time data sources:
 * - APIs (OpenWeatherMap, etc.)
 * - WebSocket streams (Raspberry Pi sensors, etc.)
 * - MAVLink (drones)
 * - Serial/USB devices
 */

export enum ConnectionStatus {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  ERROR = "error",
  RECONNECTING = "reconnecting",
}

export interface ConnectionError {
  message: string;
  code?: string;
  timestamp: number;
}

export interface ConnectorConfig {
  autoReconnect?: boolean;
  reconnectInterval?: number; // milliseconds
  reconnectAttempts?: number; // max attempts, 0 = infinite
}

/**
 * Base connector interface
 * All data connectors implement this interface
 */
export interface Connector<TData = any> {
  /**
   * Establish connection to data source
   */
  connect(): Promise<void>;

  /**
   * Disconnect from data source
   */
  disconnect(): Promise<void>;

  /**
   * Subscribe to data updates
   * @returns unsubscribe function
   */
  subscribe(callback: (data: TData) => void): () => void;

  /**
   * Subscribe to status changes
   * @returns unsubscribe function
   */
  onStatusChange(callback: (status: ConnectionStatus) => void): () => void;

  /**
   * Subscribe to errors
   * @returns unsubscribe function
   */
  onError(callback: (error: ConnectionError) => void): () => void;

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus;

  /**
   * Get last error if any
   */
  getLastError(): ConnectionError | null;
}

/**
 * Base abstract connector class
 * Provides common functionality for all connectors
 */
export abstract class BaseConnector<TData = any> implements Connector<TData> {
  protected status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  protected lastError: ConnectionError | null = null;
  protected dataSubscribers: Set<(data: TData) => void> = new Set();
  protected statusSubscribers: Set<(status: ConnectionStatus) => void> = new Set();
  protected errorSubscribers: Set<(error: ConnectionError) => void> = new Set();
  protected reconnectAttempt: number = 0;
  protected reconnectTimer?: ReturnType<typeof setTimeout>;

  constructor(protected config: ConnectorConfig = {}) {
    this.config = {
      autoReconnect: true,
      reconnectInterval: 5000,
      reconnectAttempts: 0, // infinite
      ...config,
    };
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;

  subscribe(callback: (data: TData) => void): () => void {
    this.dataSubscribers.add(callback);
    return () => this.dataSubscribers.delete(callback);
  }

  onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusSubscribers.add(callback);
    // Immediately call with current status
    callback(this.status);
    return () => this.statusSubscribers.delete(callback);
  }

  onError(callback: (error: ConnectionError) => void): () => void {
    this.errorSubscribers.add(callback);
    return () => this.errorSubscribers.delete(callback);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  getLastError(): ConnectionError | null {
    return this.lastError;
  }

  protected setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.statusSubscribers.forEach((callback) => {
      callback(status);
    });
  }

  protected emitData(data: TData): void {
    this.dataSubscribers.forEach((callback) => {
      callback(data);
    });
  }

  protected emitError(message: string, code?: string): void {
    const error: ConnectionError = {
      message,
      code,
      timestamp: Date.now(),
    };
    this.lastError = error;
    this.errorSubscribers.forEach((callback) => {
      callback(error);
    });
    this.setStatus(ConnectionStatus.ERROR);
  }

  protected scheduleReconnect(): void {
    if (!this.config.autoReconnect) return;

    const maxAttempts = this.config.reconnectAttempts || 0;
    if (maxAttempts > 0 && this.reconnectAttempt >= maxAttempts) {
      this.emitError("Max reconnection attempts reached");
      return;
    }

    this.setStatus(ConnectionStatus.RECONNECTING);
    this.reconnectAttempt++;

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
        this.reconnectAttempt = 0; // Reset on successful connection
      } catch {
        this.scheduleReconnect();
      }
    }, this.config.reconnectInterval);
  }

  protected clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }
}
