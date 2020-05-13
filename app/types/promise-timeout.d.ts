interface Promise<T> {

    /**
         * Creates a Promise that is rejected if the current promise is not resolved or rejecet before the timeout is reached. 
         * @param ms Milliseconds to timeout.
         * @returns A new Promise.
         */
    timeout<T = any>(ms: number): Promise<T extends PromiseLike<infer U> ? U : T>;

}
