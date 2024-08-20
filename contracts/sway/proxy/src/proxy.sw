contract;

abi Proxy {
    fn whatever();
}

impl Proxy for Contract {
    fn whatever() {}
}