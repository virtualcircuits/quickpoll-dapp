module quickpoll_addr::quickpoll {
    use std::string::String;
    use std::signer;
    use std::vector;

    struct Poll has key, store {
        id: u64,
        prompt: String,
        reward: u64,
        participants: vector<address>,
        responses: vector<String>,
    }

    struct Polls has key, store {
        list: vector<Poll>,
        next_id: u64,
    }

    public entry fun create_poll(account: &signer, prompt: String, reward: u64) acquires Polls {
        let owner = signer::address_of(account);
        if (!exists<Polls>(owner)) {
            move_to(account, Polls { list: vector::empty<Poll>(), next_id: 1 });
        };
        let polls = borrow_global_mut<Polls>(owner);
        let id = polls.next_id;
        polls.next_id = polls.next_id + 1;
        let poll = Poll {
            id,
            prompt,
            reward,
            participants: vector::empty<address>(),
            responses: vector::empty<String>(),
        };
        vector::push_back(&mut polls.list, poll);
    }

    public entry fun answer_poll(account: &signer, owner: address, poll_id: u64, response: String) acquires Polls {
        let participant = signer::address_of(account);
        let polls = borrow_global_mut<Polls>(owner);
        let found = false;
        let len = vector::length(&polls.list);
        let i = 0;
        while (i < len) {
            let poll_ref = vector::borrow_mut(&mut polls.list, i);
            if (poll_ref.id == poll_id) {
                vector::push_back(&mut poll_ref.participants, participant);
                vector::push_back(&mut poll_ref.responses, response);
                found = true;
                break;
            };
            i = i + 1;
        };
        assert!(found, 100);
    }
}
