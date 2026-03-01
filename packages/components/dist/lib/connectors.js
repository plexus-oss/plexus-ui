/**
 * Data Connectors for Plexus UI
 *
 * Provides standardized interfaces for connecting to real-time data sources:
 * - APIs (OpenWeatherMap, etc.)
 * - WebSocket streams (Raspberry Pi sensors, etc.)
 * - MAVLink (drones)
 * - Serial/USB devices
 */
export var ConnectionStatus;
(function (ConnectionStatus) {
    ConnectionStatus["DISCONNECTED"] = "disconnected";
    ConnectionStatus["CONNECTING"] = "connecting";
    ConnectionStatus["CONNECTED"] = "connected";
    ConnectionStatus["ERROR"] = "error";
    ConnectionStatus["RECONNECTING"] = "reconnecting";
})(ConnectionStatus || (ConnectionStatus = {}));
/**
 * Base abstract connector class
 * Provides common functionality for all connectors
 */
export class BaseConnector {
    constructor(config = {}) {
        this.config = config;
        this.status = ConnectionStatus.DISCONNECTED;
        this.lastError = null;
        this.dataSubscribers = new Set();
        this.statusSubscribers = new Set();
        this.errorSubscribers = new Set();
        this.reconnectAttempt = 0;
        this.config = {
            autoReconnect: true,
            reconnectInterval: 5000,
            reconnectAttempts: 0, // infinite
            ...config,
        };
    }
    subscribe(callback) {
        this.dataSubscribers.add(callback);
        return () => this.dataSubscribers.delete(callback);
    }
    onStatusChange(callback) {
        this.statusSubscribers.add(callback);
        // Immediately call with current status
        callback(this.status);
        return () => this.statusSubscribers.delete(callback);
    }
    onError(callback) {
        this.errorSubscribers.add(callback);
        return () => this.errorSubscribers.delete(callback);
    }
    getStatus() {
        return this.status;
    }
    getLastError() {
        return this.lastError;
    }
    setStatus(status) {
        this.status = status;
        this.statusSubscribers.forEach((callback) => {
            callback(status);
        });
    }
    emitData(data) {
        this.dataSubscribers.forEach((callback) => {
            callback(data);
        });
    }
    emitError(message, code) {
        const error = {
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
    scheduleReconnect() {
        if (!this.config.autoReconnect)
            return;
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
            }
            catch (_error) {
                this.scheduleReconnect();
            }
        }, this.config.reconnectInterval);
    }
    clearReconnectTimer() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }
    }
}
//# sourceMappingURL=connectors.js.map