contract;

abi Bridge {
    fn process_message(msg_idx: u64);
}

impl Bridge for Contract {
    fn process_message(msg_idx: u64) {}
}