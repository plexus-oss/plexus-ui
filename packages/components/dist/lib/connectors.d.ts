/**
 * Data Connectors for Plexus UI
 *
 * Provides standardized interfaces for connecting to real-time data sources:
 * - APIs (OpenWeatherMap, etc.)
 * - WebSocket streams (Raspberry Pi sensors, etc.)
 * - MAVLink (drones)
 * - Serial/USB devices
 */
export declare enum ConnectionStatus {
    DISCONNECTED = "disconnected",
    CONNECTING = "connecting",
    CONNECTED = "connected",
    ERROR = "error",
    RECONNECTING = "reconnecting"
}
export interface ConnectionError {
    message: string;
    code?: string;
    timestamp: number;
}
export interface ConnectorConfig {
    autoReconnect?: boolean;
    reconnectInterval?: number;
    reconnectAttempts?: number;
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
export declare abstract class BaseConnector<TData = any> implements Connector<TData> {
    protected config: ConnectorConfig;
    protected status: ConnectionStatus;
    protected lastError: ConnectionError | null;
    protected dataSubscribers: Set<(data: TData) => void>;
    protected statusSubscribers: Set<(status: ConnectionStatus) => void>;
    protected errorSubscribers: Set<(error: ConnectionError) => void>;
    protected reconnectAttempt: number;
    protected reconnectTimer?: ReturnType<typeof setTimeout>;
    constructor(config?: ConnectorConfig);
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    subscribe(callback: (data: TData) => void): () => void;
    onStatusChange(callback: (status: ConnectionStatus) => void): () => void;
    onError(callback: (error: ConnectionError) => void): () => void;
    getStatus(): ConnectionStatus;
    getLastError(): ConnectionError | null;
    protected setStatus(status: ConnectionStatus): void;
    protected emitData(data: TData): void;
    protected emitError(message: string, code?: string): void;
    protected scheduleReconnect(): void;
    protected clearReconnectTimer(): void;
}
//# sourceMappingURL=connectors.d.ts.map