export interface Config {
    napcat: {
        baseUrl: string;
        accessToken: string;
        throwPromise: boolean;
        reconnection: {
            enable: boolean;
            attempts: number;
            delay: number;
        };
        debug: boolean;
    };
    self: {
        master: Array<number>;
    };
}
