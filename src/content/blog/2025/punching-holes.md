---
title: Punching Holes in The Dark
pubDatetime: 2025-12-08
description: DCUtR, NATs, and the Path to a More Reachable Kaspa Network
heroImage: /assets/img/2025/punching-holes/router.gif
tags: ["kaspa", "p2p", "dcutr"]
featured: true
---

Nodes fascinate me. They’re the part of a P2P network most people never think about, but they’re the whole reason anything works at all.

They come in all shapes: beefy public boxes in a rack somewhere, janky VMs on random VPS providers, Raspberry Pis hiding behind $20 routers. For this post I’ll be talking about them in the context of the Kaspa network.

Right now I’m playing with a few different areas around Kaspa nodes:

- mapping public nodes (there’ll be a separate post on KasNodes later)
- working out how to map “private” nodes
- figuring out how all of these actually connect to each other in practice

There’s always been this nagging thought: there’s a whole class of nodes out there that *want* to contribute real P2P connectivity, but the network can’t properly reach them. They dial out, they sync, they gossip a bit, but they never become first-class peers because of how home networking works.

That’s the gap this DCUtR work is trying to close.

Obviously DCUtR itself isn’t new. Variations of this “upgrade through relay” trick have been around since the early Skype days and live on in things like libp2p’s DCUtR and WebRTC-style hole punching.

What *is* new (for Kaspa) is applying that pattern to our network. That part came from Michael Sutton: he started off the line of research on whether a DCUtR-style approach could behave well with Kaspa’s stack and topology. He did the initial digging so we knew this wasn’t a dead end. I’m picking up that thread and trying to turn it into something real.

## The actual problem

Most *P2P* nodes these days don’t live on a clean, publicly reachable IPv4 address. They live behind some consumer router in a random living room.

Kaspa is no different here.

From the node’s point of view:

- Outbound connections **just work**
- Inbound connections **usually don’t**, unless the user:
  - manually forwards ports, or  
  - gets lucky with UPnP actually working

So you end up with a bunch of “half-connected” nodes:

- They can dial out to the network
- The network can’t reliably dial back in
- The effective routing graph is thinner than the set of nodes you see in telemetry

That pattern shows up in basically every P2P system running over IPv4 + NAT. I just happen to care about it in the context of Kaspa, so that’s where I’m poking at it.

## NAT in one paragraph

Short version, aimed at people who already roughly know how this works:

- Your router usually has one public IPv4 address
- Everything behind it lives on private RFC1918 space
- NAT keeps a table of `(internal_ip, internal_port) -> (external_port)` mappings
- Outbound traffic creates/refreshes these mappings
- Inbound traffic with no matching mapping gets dropped 

The key point: **initiating an outbound connection is easy, accepting unsolicited inbound traffic is not**.

That’s the only piece that really matters here.

## What Kaspa does today

Right now, home / private nodes basically fit into a few buckets:

- Public IPv4 (static **or** dynamic) + open ports → no problem, easy peers
- Public IPv4 (static **or** dynamic) + no open ports → outbound only, unless UPnP happens to work
- CGNAT / carrier-grade weirdness → usually outbound only, often with strange edge cases
- IPv6 exists in theory → in practice, very few nodes are cleanly reachable over it end-to-end

On top of that, we lean on the usual stuff:

- Port forwarding docs (fine for power users, ignored by almost everyone else)
- UPnP (occasionally works, often disabled or broken on consumer routers)

The end result is a big chunk of the network behaving like “clients”: they’re Kaspa nodes, but the rest of the network can’t reliably peer *into* them.

That’s where DCUtR-style hole punching comes in: it gives those outbound-only nodes another way to become proper peers without anyone touching their router.

## DCUTR: the rough idea

The idea is roughly:

> Use a publicly reachable node as a temporary rendezvous/coordination point so two private nodes can punch through their respective NATs and talk directly.

High level roles:

- **Public node**: already reachable; acts as rendezvous/coordinator
- **Private nodes**: both stuck behind NATs; can dial out but not accept random inbound

Very rough flow:

1. Private node A connects to a public node P (normal outbound Kaspa connection)
2. Private node B connects to the same public node P
3. P learns the observed public address/port for A and B (from the TCP/UDP socket)
4. A and B agree (via P) that they want to try a direct connection
5. P sends A the tuple for B, and B the tuple for A
6. A and B simultaneously start dialing each other on those observed addresses
7. If the NATs are “friendly enough”, matching outbound attempts create NAT mappings on both sides and one of the handshakes wins

If it works, the connection is upgraded from “through a public relay” to “direct”.

If it fails, they just keep using the relay path or give up gracefully.

## Reality: NATs are all kinds of cursed

The simple description above hides a bunch of annoying details.

Different NAT behaviours:

- Full-cone, restricted-cone, port-restricted, symmetric, etc.
- Some rewrite source ports pretty aggressively
- Some have very short mapping timeouts for “unvalidated” flows

So in practice you need to handle cases like:

- The observed external port changing between attempts
- Race conditions where one side’s mapping times out while the other is still retrying
- Symmetric NATs where the port mapping depends on the destination ip:port, making hole punching much less reliable

You end up with things like:

- Multiple dial attempts with slightly different timing
- Backoff and retry strategies
- Some heuristics about when to stop burning attempts on a peer

I’m not trying to perfectly classify NATs here. The point is: hole punching is probabilistic, not guaranteed. You try to skew the odds in your favour without wrecking the rest of the network.

## Constraints specific to Kaspa

This isn’t a generic NAT traversal library; it has to behave nicely inside a live, gossip-heavy network.

Some constraints I’m keeping in mind:

- **Inbound connection limits**  
  Public nodes can’t accept infinite DCUtR attempts. If everyone behind CGNAT starts spraying punch attempts at the same few public nodes, those nodes get sad fast.

- **Routing stability**  
  Hole-punched connections should actually help the graph:
  - avoid short-lived flappy connections
  - avoid pointless upgrades where the relay path is already fine and low-latency

- **Attack surface**  
  Any rendezvous-like thing can be abused:
  - reflection/amplification attempts
  - using public nodes as coordination hubs for unrelated traffic
  - trying to force nodes into exhausting connection slots

- **Implementation complexity**  
  This has to live inside real code:
  - minimal extra state per peer
  - clean failure paths

## How I’m thinking about the protocol

Right now my mental model looks like this (leaving out message names and wire details):

1. **Capability discovery**  
   When two peers connect (via a public node), they gossip:
   - whether they support DCUTR
   - what transport variants they’re willing to try
   - some limits (max concurrent punch attempts, etc.)

2. **Upgrade intent**  
   One side proposes: "we’re currently talking via P, but I’d like to try a direct upgrade with you".  
   The other side can say “yes/no/maybe later”.

3. **Coordination via P**  
   P:
   - holds temporary state for this upgrade attempt
   - shares observed public addresses
   - triggers the simultaneous dial

4. **Race phase**  
   Both sides:
   - fire off a small number of outbound connect attempts
   - tag these as part of the DCUTR attempt (so they don’t conflict with normal dial logic)
   - accept whichever one completes first and associate it back to the right peer

5. **Cleanup**  
   Once the direct connection is established:
   - both sides mark the relay path as “replaceable”
   - traffic migrates
   - old connection is closed cleanly once we’re confident the new one is stable

If any step fails, both peers fall back to the existing connection and mark that particular upgrade attempt as “don’t bother again for a while”.

## Some design questions I’m still poking at

These are the bits that feel hand-wavy and will likely change after more real-world testing:

- **How aggressive should we be with retries?**  
  Punching too often wastes resources and creates weird network patterns. Too conservative and we don’t get much benefit.

- **How to pick rendezvous public nodes?**  
  Random? Weighted by capacity? Only nodes that explicitly opt-in?  

- **How to account for them in inbound slot policies?**  
  Hole-punched connections aren’t “free”; they still consume inbound capacity. There probably needs to be some fairness logic so DCUTR traffic doesn’t starve “normal” peers.

## Where this sits in the Kaspa stack (and the architecture rabbit hole)

On top of the networking details, there’s a separate question: *where* does libp2p/DCUTR actually live in the Kaspa codebase?

Right now the shape is roughly:

- There’s a single existing `connection_handler` in the p2p core that knows how to:
  - accept an incoming stream
  - run the Kaspa handshake
  - plug the connection into the router/hub

- Libp2p owns its own swarm/provider, but once it has a stream it hands it off to the same `connection_handler`:
  - outbound goes through a pluggable “outbound connector” hook
  - inbound libp2p streams come in through a “serve with incoming” hook

So once a stream exists, direct TCP and libp2p look the same to the rest of the system. The only difference is how we *obtain* the stream.

The open question I’m working through (with a lot of help from IzioDev – cheers!) is how visible that should be architecturally:

- One option is to keep libp2p in its own component crate, treated as a sort of “overlay transport” that plugs into the core via those two seams.
- The other option is to pull it closer, treat it as just another “connection strategy” next to direct TCP, and have a single obvious entry point in p2p for “how we connect to peers”, with strategies living underneath.

“Transport” kind of fits before the connection is established, but once the stream exists it’s all just Kaspa protocol. Thinking of it as a `ConnectionStrategy` (direct vs overlay) probably matches reality better.

None of this is blocking DCUTR itself, but it does affect how understandable the final design will be for other contributors. Before I pile more features on (relay rotation, better AutoNAT role detection, etc.), I’d like to get this “one place to look for how we connect” story into a shape that feels right for the long term.

## Current status (snapshot)

As I’m writing this:

- DCUTR works in a controlled lab setup:
  - Node A and Node B VMs behind OpenWRT VMs (full-cone NAT enabled)
  - a public relay
  - a helper tool that wires them together and shows a live view of peers
- In that setup, the punch succeeds and a direct connection shows up alongside the relay.

On the production side:

- Bridge mode still dials out with plain TCP, so none of this touches regular mainnet peers yet.
- Relay selection is “first one that works”, with a simple 30‑second cooldown between DCUTR attempts per peer.
- Direct connections don’t replace relay paths yet; both can coexist.

If we can get even, say, 30–50% of the currently “private-only” nodes to become reachable via DCUTR-style upgrades, the network graph gets a lot denser without asking people to touch their routers.

If you've read to the end here and want to follow along for more, feel free to [join the TG channel](https://t.me/kasparnd/5090) for more information.