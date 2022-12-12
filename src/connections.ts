import { SystemPhoneNumber } from "./rolodex";
import { WebSocket } from 'uWebSockets.js';
import { SpeechToText } from "./speech";


export class ConnectionUnavailableException extends Error {
    constructor(public num: SystemPhoneNumber) {
        super(`Connection unavailable for ${num}`);
        Object.setPrototypeOf(this, ConnectionUnavailableException.prototype)
    }
};

export class Connection<ConnectionType> {
    constructor(
        public id: SystemPhoneNumber,
        public transport: ConnectionType,
        public transformer: SpeechToText
    ) { }
}

export class ConnectionManager<ConnectionType> {
    private readonly connections: Map<SystemPhoneNumber, ConnectionType> = new Map();

    public getConnection(num: SystemPhoneNumber): ConnectionType {
        const maybeConn = this.connections.get(num);
        if (maybeConn) return maybeConn;
        throw new ConnectionUnavailableException(num);
    }

    public add(num: SystemPhoneNumber, conn: ConnectionType): void {
        this.connections.set(num, conn);
    }

    public removeByNumber(num: SystemPhoneNumber): boolean {
        return this.connections.delete(num);
    }

    public removeByConnection(conn: ConnectionType): boolean {
        for (let pair of this.connections.entries()) {
            if (pair[1] === conn) {
                this.connections.delete(pair[0]);
                return true;
            }
        }

        return false;
    }
};
